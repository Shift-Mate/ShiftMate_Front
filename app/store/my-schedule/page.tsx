"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { ScheduleGrid } from "@/components/ui/ScheduleGrid";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storeApi } from "@/lib/api/stores";
import { Shift, ShiftType } from "@/types/schedule";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    } | null;
};

type MyScheduleResDto = {
    workDate: string;
    startTime: string;
    endTime: string;
    templateName: string | null;
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return typeof (value as { success?: unknown }).success === "boolean";
};

const isMyScheduleResDto = (value: unknown): value is MyScheduleResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<MyScheduleResDto>;

    return (
        typeof candidate.workDate === "string" &&
        typeof candidate.startTime === "string" &&
        typeof candidate.endTime === "string" &&
        (typeof candidate.templateName === "string" || candidate.templateName === null)
    );
};

const parseMySchedules = (rawData: unknown): MyScheduleResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isMyScheduleResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isMyScheduleResDto);
    }

    return [];
};

const getErrorCode = (error: {
    code: string;
    details?: Record<string, unknown>;
}): string => {
    if (error.details && typeof error.details.code === "string") {
        return error.details.code;
    }

    if (
        error.details &&
        typeof error.details.error === "object" &&
        error.details.error !== null &&
        "code" in error.details.error &&
        typeof (error.details.error as { code?: unknown }).code === "string"
    ) {
        return (error.details.error as { code: string }).code;
    }

    return error.code;
};

const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string): Date => new Date(`${dateKey}T00:00:00`);

const getWeekStartDate = (baseDate: Date): string => {
    const date = new Date(baseDate);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset);
    return formatDateKey(date);
};

const addDays = (dateKey: string, amount: number): string => {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + amount);
    return formatDateKey(date);
};

const formatTime = (value: string): string => {
    const [hour, minute] = value.split(":");
    if (!hour || !minute) {
        return value;
    }
    return `${hour}:${minute}`;
};

const parseTimeToMinutes = (value: string): number => {
    const [hour = "0", minute = "0"] = value.split(":");
    return Number(hour) * 60 + Number(minute);
};

const getShiftType = (startTime: string): ShiftType => {
    const hour = Number(startTime.split(":")[0]);
    if (hour < 12) {
        return "opening";
    }
    if (hour < 17) {
        return "middle";
    }
    return "closing";
};

const formatDuration = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    if (minute === 0) {
        return `${hour}시간`;
    }
    return `${hour}시간 ${minute}분`;
};

export default function MySchedulePage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [weekStartDate, setWeekStartDate] = useState(() =>
        getWeekStartDate(new Date())
    );
    const [allSchedules, setAllSchedules] = useState<MyScheduleResDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchMySchedules = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            if (!/^\d+$/.test(storeId)) {
                setErrorMessage("유효하지 않은 매장 ID입니다.");
                setIsLoading(false);
                return;
            }

            const authToken =
                typeof window !== "undefined"
                    ? localStorage.getItem("auth_token")
                    : null;
            if (!authToken) {
                setErrorMessage("로그인이 필요합니다. 다시 로그인해 주세요.");
                setIsLoading(false);
                return;
            }

            const response = await storeApi.getMySchedules(storeId);

            if (cancelled) {
                return;
            }

            if (!response.success) {
                const code = response.error ? getErrorCode(response.error) : "";

                if (code === "STORE_NOT_FOUND") {
                    setErrorMessage("매장을 찾을 수 없습니다.");
                } else if (code === "STORE_MEMBER_NOT_FOUND") {
                    setErrorMessage("해당 매장의 멤버 정보를 찾을 수 없습니다.");
                } else if (code === "INVALID_REQUEST" || code === "400") {
                    setErrorMessage("요청 값이 올바르지 않습니다.");
                } else {
                    setErrorMessage(
                        response.error?.message ??
                            "사용자 근무 스케줄 정보를 불러오지 못했습니다."
                    );
                }

                setIsLoading(false);
                return;
            }

            const schedules = parseMySchedules(response.data as unknown);

            if (!cancelled) {
                setAllSchedules(schedules);
                setIsLoading(false);
            }
        };

        void fetchMySchedules();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    const weekDateSet = useMemo(() => {
        return new Set(Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)));
    }, [weekStartDate]);

    const weekSchedules = useMemo(() => {
        return allSchedules
            .filter((item) => weekDateSet.has(item.workDate))
            .sort((a, b) => {
                if (a.workDate !== b.workDate) {
                    return a.workDate.localeCompare(b.workDate);
                }
                return a.startTime.localeCompare(b.startTime);
            });
    }, [allSchedules, weekDateSet]);

    const weekShifts = useMemo<Shift[]>(() => {
        return weekSchedules.map((item, index) => ({
            id: `${item.workDate}-${item.startTime}-${index}`,
            employeeId: "me",
            employeeName: "내 근무",
            date: item.workDate,
            startTime: formatTime(item.startTime),
            endTime: formatTime(item.endTime),
            type: getShiftType(item.startTime),
            status: "scheduled",
        }));
    }, [weekSchedules]);

    const weekRangeLabel = useMemo(() => {
        const weekEndDate = addDays(weekStartDate, 6);
        return `${weekStartDate} ~ ${weekEndDate}`;
    }, [weekStartDate]);

    const workedDays = useMemo(
        () => new Set(weekSchedules.map((item) => item.workDate)).size,
        [weekSchedules]
    );

    const totalMinutes = useMemo(
        () =>
            weekSchedules.reduce(
                (sum, item) =>
                    sum +
                    Math.max(
                        parseTimeToMinutes(item.endTime) -
                            parseTimeToMinutes(item.startTime),
                        0
                    ),
                0
            ),
        [weekSchedules]
    );

    const templateCount = useMemo(
        () =>
            new Set(
                weekSchedules
                    .map((item) => item.templateName?.trim())
                    .filter((name): name is string => !!name)
            ).size,
        [weekSchedules]
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    {storeName} 내 근무 일정
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    사용자 개인 근무 스케줄을 조회합니다.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button
                                    variant="secondary"
                                    className="gap-2"
                                    onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}
                                >
                                    <span className="material-icons text-sm">chevron_left</span>
                                    이전 주
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="gap-2"
                                    onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}
                                >
                                    <span className="material-icons text-sm">chevron_right</span>
                                    다음 주
                                </Button>
                            </div>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}
                                    >
                                        <span className="material-icons">chevron_left</span>
                                    </Button>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {weekRangeLabel}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            주간 스케줄
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}
                                    >
                                        <span className="material-icons">chevron_right</span>
                                    </Button>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setWeekStartDate(getWeekStartDate(new Date()))}
                                >
                                    오늘
                                </Button>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            이번 주 근무
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {workedDays}일
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">event_available</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 근무 시간
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {formatDuration(totalMinutes)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <span className="material-icons">schedule</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            템플릿 종류
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {templateCount}개
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">category</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    주간 스케줄
                                </h3>
                            </CardHeader>
                            <CardBody>
                                {isLoading && (
                                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                                        근무 정보를 불러오는 중입니다...
                                    </div>
                                )}

                                {!isLoading && errorMessage && (
                                    <div className="py-10 text-center text-red-600 dark:text-red-400">
                                        {errorMessage}
                                    </div>
                                )}

                                {!isLoading && !errorMessage && weekShifts.length === 0 && (
                                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                                        해당 주차의 근무 일정이 없습니다.
                                    </div>
                                )}

                                {!isLoading && !errorMessage && weekShifts.length > 0 && (
                                    <ScheduleGrid shifts={weekShifts} weekStart={weekStartDate} />
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
