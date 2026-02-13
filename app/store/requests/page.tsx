"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SubstituteRequest } from "@/types/schedule";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type SubstituteApplicant = {
    id: string;
    name: string;
    department: string;
    appliedAt: string;
    message?: string;
};

const initialRequests: SubstituteRequest[] = [
    {
        id: "1",
        shiftId: "shift1",
        requesterId: "emp1",
        requesterName: "김철수",
        date: "2024-02-15",
        shiftTime: "09:00 - 17:00",
        reason: "개인 사정으로 인한 대체 근무 요청",
        status: "pending",
        createdAt: "2024-02-10T10:00:00Z",
    },
    {
        id: "2",
        shiftId: "shift2",
        requesterId: "emp2",
        requesterName: "이영희",
        date: "2024-02-16",
        shiftTime: "13:00 - 21:00",
        reason: "가족 행사",
        status: "pending",
        createdAt: "2024-02-09T14:30:00Z",
    },
    {
        id: "3",
        shiftId: "shift3",
        requesterId: "emp3",
        requesterName: "박민수",
        date: "2024-02-14",
        shiftTime: "10:00 - 18:00",
        status: "approved",
        createdAt: "2024-02-08T09:15:00Z",
    },
];

const mockApplicantsByRequestId: Record<string, SubstituteApplicant[]> = {
    "1": [
        {
            id: "a-1",
            name: "정수민",
            department: "홀",
            appliedAt: "2024-02-10T11:10:00Z",
            message: "해당 시간 근무 가능합니다.",
        },
        {
            id: "a-2",
            name: "이유진",
            department: "주방",
            appliedAt: "2024-02-10T11:40:00Z",
        },
    ],
    "2": [
        {
            id: "a-3",
            name: "김도윤",
            department: "홀",
            appliedAt: "2024-02-09T15:20:00Z",
        },
        {
            id: "a-4",
            name: "박서연",
            department: "배달",
            appliedAt: "2024-02-09T16:05:00Z",
            message: "마감 시프트 경험 있습니다.",
        },
        {
            id: "a-5",
            name: "최민준",
            department: "홀",
            appliedAt: "2024-02-10T09:25:00Z",
        },
    ],
};

export default function ManagerRequestsPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [requests, setRequests] = useState<SubstituteRequest[]>(initialRequests);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [acceptedApplicantByRequestId, setAcceptedApplicantByRequestId] = useState<
        Record<string, string>
    >({});

    const pendingRequests = requests.filter((r) => r.status === "pending");
    const processedRequests = requests.filter((r) => r.status !== "pending");

    useEffect(() => {
        if (pendingRequests.length === 0) {
            setSelectedRequestId(null);
            return;
        }

        if (!selectedRequestId || !pendingRequests.some((r) => r.id === selectedRequestId)) {
            setSelectedRequestId(pendingRequests[0].id);
        }
    }, [pendingRequests, selectedRequestId]);

    const selectedRequest =
        pendingRequests.find((request) => request.id === selectedRequestId) || null;
    const applicants = selectedRequest ? mockApplicantsByRequestId[selectedRequest.id] || [] : [];

    const handleAcceptApplicant = (requestId: string, applicantId: string) => {
        console.log("Accept applicant:", { requestId, applicantId });

        setAcceptedApplicantByRequestId((prev) => ({
            ...prev,
            [requestId]: applicantId,
        }));

        setRequests((prev) =>
            prev.map((request) =>
                request.id === requestId ? { ...request, status: "filled" } : request
            )
        );
    };

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
                                    {storeName} 대체 근무 요청 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    요청을 선택하면 우측에서 대타 지원자 목록을 확인하고 수락할 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            대기 중 요청
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {pendingRequests.length}
                                        </p>
                                    </div>
                                    <span className="material-icons text-yellow-500">pending</span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            처리 완료
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {processedRequests.length}
                                        </p>
                                    </div>
                                    <span className="material-icons text-green-500">
                                        check_circle
                                    </span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            전체 요청
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {requests.length}
                                        </p>
                                    </div>
                                    <span className="material-icons text-primary">swap_horiz</span>
                                </CardBody>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        대타 요청 목록
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                        {pendingRequests.length}건
                                    </span>
                                </div>

                                {pendingRequests.length > 0 ? (
                                    <div className="grid gap-4">
                                        {pendingRequests.map((request) => {
                                            const isSelected = request.id === selectedRequestId;
                                            const applicantCount =
                                                mockApplicantsByRequestId[request.id]?.length || 0;
                                            return (
                                                <button
                                                    type="button"
                                                    key={request.id}
                                                    onClick={() => setSelectedRequestId(request.id)}
                                                    className={`text-left rounded-xl border p-4 transition-colors ${
                                                        isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/40"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {request.requesterName}님의 대타 요청
                                                            </p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                                {request.date} / {request.shiftTime}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            지원 {applicantCount}명
                                                        </span>
                                                    </div>
                                                    {request.reason && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                                                            사유: {request.reason}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardBody className="text-center py-10">
                                            <p className="text-slate-500 dark:text-slate-400">
                                                현재 대기 중인 대타 요청이 없습니다.
                                            </p>
                                        </CardBody>
                                    </Card>
                                )}

                                {processedRequests.length > 0 && (
                                    <div className="pt-2 space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            최근 처리 완료
                                        </h4>
                                        {processedRequests.map((request) => (
                                            <Card key={request.id}>
                                                <CardBody className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {request.requesterName}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {request.date} / {request.shiftTime}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                        처리 완료
                                                    </span>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <aside className="lg:sticky lg:top-24 h-fit">
                                <Card>
                                    <CardBody className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                대타 지원자 목록
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                요청을 선택하고 지원자를 수락하세요.
                                            </p>
                                        </div>

                                        {selectedRequest ? (
                                            <>
                                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {selectedRequest.requesterName} /{" "}
                                                        {selectedRequest.shiftTime}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {selectedRequest.date}
                                                    </p>
                                                </div>

                                                {applicants.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {applicants.map((applicant) => {
                                                            const isAccepted =
                                                                acceptedApplicantByRequestId[
                                                                    selectedRequest.id
                                                                ] === applicant.id;
                                                            return (
                                                                <div
                                                                    key={applicant.id}
                                                                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                                {applicant.name}
                                                                            </p>
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                                {applicant.department}{" "}
                                                                                · 신청{" "}
                                                                                {new Date(
                                                                                    applicant.appliedAt
                                                                                ).toLocaleString(
                                                                                    "ko-KR"
                                                                                )}
                                                                            </p>
                                                                            {applicant.message && (
                                                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                                                                    {applicant.message}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleAcceptApplicant(
                                                                                    selectedRequest.id,
                                                                                    applicant.id
                                                                                )
                                                                            }
                                                                            disabled={isAccepted}
                                                                        >
                                                                            {isAccepted
                                                                                ? "수락됨"
                                                                                : "수락"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                                        아직 지원한 직원이 없습니다.
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                                좌측 요청을 선택하면 지원자 목록이 표시됩니다.
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </aside>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
