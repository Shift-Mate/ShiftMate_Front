"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { StoreCard } from "@/components/domain/StoreCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Store } from "@/types/store";
import { storeApi } from "@/lib/api/stores";

type ApiError = {
    code: string;
    message: string;
    details: unknown[];
};

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error: ApiError | null;
};

type StoreResDto = {
    id: number;
    name: string;
    alias: string | null;
    openTime: string;
    closeTime: string;
    createdAt: string;
    updatedAt: string;
    monthlySales: number | null;
    location: string | null;
    storeMemberCount: number;
    imageUrl?: string | null;
};

const TOKEN_ERROR_CODES = new Set([
    "EXPIRED_TOKEN",
    "INVALID_SIGNATURE",
    "MALFORMED_TOKEN",
    "UNSUPPORTED_TOKEN",
]);

const parseTimeToMinutes = (time: string): number | null => {
    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        return null;
    }

    return hour * 60 + minute;
};

const isOpenNow = (openTime: string, closeTime: string): boolean => {
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);

    if (openMinutes === null || closeMinutes === null) {
        return false;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (openMinutes === closeMinutes) {
        return true;
    }

    if (openMinutes < closeMinutes) {
        return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    }

    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
};

const mapStoreDtoToCardStore = (store: StoreResDto): Store => ({
    id: String(store.id),
    name: store.name,
    code: store.alias ?? `STORE-${store.id}`,
    location: store.location?.trim() ? store.location : "미설정",
    status: isOpenNow(store.openTime, store.closeTime) ? "open" : "closed",
    activeStaff: store.storeMemberCount,
    shiftCoverage: 0,
    openTime: store.openTime,
    closeTime: store.closeTime,
    image: store.imageUrl ?? undefined,
});

const isStoreDto = (value: unknown): value is StoreResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<StoreResDto>;

    return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        (typeof candidate.alias === "string" || candidate.alias === null) &&
        typeof candidate.openTime === "string" &&
        typeof candidate.closeTime === "string" &&
        (typeof candidate.location === "string" || candidate.location === null) &&
        typeof candidate.storeMemberCount === "number" &&
        (typeof candidate.imageUrl === "string" ||
            candidate.imageUrl === null ||
            candidate.imageUrl === undefined)
    );
};

const isApiEnvelope = (value: unknown): value is ApiResponse<StoreResDto[]> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ApiResponse<StoreResDto[]>>;

    return typeof candidate.success === "boolean";
};

const getErrorCode = (error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}): string => {
    if (error.details && typeof error.details.code === "string") {
        return error.details.code;
    }

    return error.code;
};

export default function DashboardPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchStores = async () => {
            const token = localStorage.getItem("auth_token");

            if (!token) {
                setErrorMessage("로그인이 필요합니다. 다시 로그인 후 시도해 주세요.");
                setIsLoading(false);
                return;
            }

            const response = await storeApi.getStores();

            if (!response.success) {
                if (response.error) {
                    const code = getErrorCode(response.error);
                    if (TOKEN_ERROR_CODES.has(code) || code === "401") {
                        setErrorMessage(
                            "인증이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요."
                        );
                    } else {
                        setErrorMessage(response.error.message);
                    }
                } else {
                    setErrorMessage("매장 정보를 불러오지 못했습니다.");
                }
                setIsLoading(false);
                return;
            }

            const rawData = response.data as unknown;
            let fetchedStores: StoreResDto[] = [];

            if (Array.isArray(rawData)) {
                fetchedStores = rawData.filter(isStoreDto);
            } else if (isApiEnvelope(rawData)) {
                if (!rawData.success) {
                    const code = rawData.error?.code ?? "";
                    if (TOKEN_ERROR_CODES.has(code)) {
                        setErrorMessage(
                            "인증이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요."
                        );
                    } else {
                        setErrorMessage(rawData.error?.message ?? "매장 정보를 불러오지 못했습니다.");
                    }
                    setIsLoading(false);
                    return;
                }

                fetchedStores = Array.isArray(rawData.data)
                    ? rawData.data.filter(isStoreDto)
                    : [];
            } else {
                setErrorMessage("서버 응답 형식이 올바르지 않습니다.");
                setIsLoading(false);
                return;
            }

            setStores(fetchedStores.map(mapStoreDtoToCardStore));
            setIsLoading(false);
        };

        void fetchStores();
    }, []);

    const totalStores = stores.length;
    const openStores = useMemo(
        () => stores.filter((store) => store.status === "open").length,
        [stores]
    );
    const totalStaff = useMemo(
        () => stores.reduce((sum, store) => sum + store.activeStaff, 0),
        [stores]
    );

    const handleDeleteStore = async () => {
        if (!storeToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        const response = await storeApi.deleteStore(storeToDelete.id);

        if (!response.success) {
            const code = response.error ? getErrorCode(response.error) : "";
            if (code === "STORE_NOT_FOUND") {
                setErrorMessage("가게 정보를 찾을 수 없습니다.");
            } else if (code === "STORE_ACCESS_DENIED") {
                setErrorMessage("매장 삭제 권한이 없습니다.");
            } else if (code === "401" || TOKEN_ERROR_CODES.has(code)) {
                setErrorMessage("인증이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.");
            } else {
                setErrorMessage(response.error?.message ?? "매장 삭제에 실패했습니다.");
            }
            setIsDeleting(false);
            setStoreToDelete(null);
            return;
        }

        setStores((prevStores) =>
            prevStores.filter((store) => store.id !== storeToDelete.id)
        );
        setIsDeleting(false);
        setStoreToDelete(null);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    매장 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    관리 중인 모든 매장의 개요입니다.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">filter_list</span>
                                    필터
                                </Button>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">sort</span>
                                    정렬
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 매장
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {totalStores}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">store</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            영업 중
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {openStores}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <span className="material-icons">check_circle</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {totalStaff}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">people</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {isLoading && (
                            <Card>
                                <CardBody className="py-8 text-center text-slate-500 dark:text-slate-400">
                                    매장 정보를 불러오는 중입니다...
                                </CardBody>
                            </Card>
                        )}

                        {errorMessage && !isLoading && (
                            <Card>
                                <CardBody className="py-8 text-center text-red-600 dark:text-red-400">
                                    {errorMessage}
                                </CardBody>
                            </Card>
                        )}

                        {!isLoading && !errorMessage && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stores.map((store) => (
                                    <StoreCard
                                        key={store.id}
                                        store={store}
                                        href={`/store?storeId=${store.id}`}
                                        onDelete={setStoreToDelete}
                                        isDeleting={isDeleting && storeToDelete?.id === store.id}
                                    />
                                ))}

                                <Link
                                    href="/wizard"
                                    className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 h-full min-h-[300px] text-center"
                                >
                                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-surface-dark flex items-center justify-center mb-4 transition-colors shadow-sm group-hover:shadow-md">
                                        <span className="material-icons text-3xl text-slate-400 group-hover:text-primary transition-colors">
                                            add
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary mb-1">
                                        새 매장 추가
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
                                        새로운 매장을 등록하여 일정 관리를 시작하세요.
                                    </p>
                                </Link>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Modal
                isOpen={storeToDelete !== null}
                onClose={() => {
                    if (!isDeleting) {
                        setStoreToDelete(null);
                    }
                }}
                title="매장 삭제 확인"
                size="sm"
            >
                <div className="space-y-5">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        정말 <span className="font-semibold">{storeToDelete?.name}</span> 매장을
                        삭제하시겠습니까? 삭제는 소프트 삭제로 처리되며, 목록에서 제외됩니다.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setStoreToDelete(null)}
                            disabled={isDeleting}
                        >
                            취소
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteStore}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
