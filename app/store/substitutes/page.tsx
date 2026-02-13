"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SubstituteRequest } from "@/types/schedule";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

const openRequests: SubstituteRequest[] = [
    {
        id: "open-1",
        shiftId: "shift1",
        requesterId: "emp1",
        requesterName: "김철수",
        date: "2024-02-15",
        shiftTime: "09:00 - 17:00",
        reason: "개인 사정으로 대타가 필요합니다.",
        status: "pending",
        createdAt: "2024-02-10T10:00:00Z",
    },
    {
        id: "open-2",
        shiftId: "shift2",
        requesterId: "emp2",
        requesterName: "이영희",
        date: "2024-02-16",
        shiftTime: "13:00 - 21:00",
        reason: "가족 행사 참석",
        status: "pending",
        createdAt: "2024-02-09T14:30:00Z",
    },
    {
        id: "open-3",
        shiftId: "shift3",
        requesterId: "emp3",
        requesterName: "박민수",
        date: "2024-02-17",
        shiftTime: "10:00 - 18:00",
        reason: "병원 진료 일정",
        status: "pending",
        createdAt: "2024-02-11T09:15:00Z",
    },
];

const initialMyRequestHistory: SubstituteRequest[] = [
    {
        id: "my-1",
        shiftId: "my-shift1",
        requesterId: "me",
        requesterName: "나",
        date: "2024-02-12",
        shiftTime: "09:00 - 17:00",
        reason: "학사 일정 충돌",
        status: "pending",
        createdAt: "2024-02-08T08:20:00Z",
    },
    {
        id: "my-2",
        shiftId: "my-shift2",
        requesterId: "me",
        requesterName: "나",
        date: "2024-02-08",
        shiftTime: "13:00 - 21:00",
        reason: "개인 일정",
        status: "approved",
        createdAt: "2024-02-05T11:40:00Z",
    },
    {
        id: "my-3",
        shiftId: "my-shift3",
        requesterId: "me",
        requesterName: "나",
        date: "2024-02-04",
        shiftTime: "10:00 - 18:00",
        reason: "컨디션 난조",
        status: "rejected",
        createdAt: "2024-02-02T16:10:00Z",
    },
];

const plannedShifts = [
    {
        id: "planned-1",
        date: "2024-02-18",
        label: "Feb 18 • 오픈 시프트 (08:00 - 14:00)",
        time: "08:00 - 14:00",
    },
    {
        id: "planned-2",
        date: "2024-02-19",
        label: "Feb 19 • 미들 시프트 (12:00 - 18:00)",
        time: "12:00 - 18:00",
    },
    {
        id: "planned-3",
        date: "2024-02-22",
        label: "Feb 22 • 마감 시프트 (16:00 - 22:00)",
        time: "16:00 - 22:00",
    },
];

type TabKey = "open" | "my" | "others";

const getStatusChip = (status: SubstituteRequest["status"]) => {
    if (status === "approved" || status === "filled") {
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    }
    if (status === "rejected") {
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    }
    return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
};

const getStatusLabel = (status: SubstituteRequest["status"]) => {
    if (status === "approved") return "승인됨";
    if (status === "filled") return "매칭 완료";
    if (status === "rejected") return "반려";
    return "대기 중";
};

export default function SubstitutesPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [activeTab, setActiveTab] = useState<TabKey>("open");
    const [acceptedRequestIds, setAcceptedRequestIds] = useState<string[]>([]);
    const [myRequests, setMyRequests] = useState<SubstituteRequest[]>(initialMyRequestHistory);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState(plannedShifts[0]?.id || "");
    const [requestReason, setRequestReason] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);

    const openRequestModal = () => {
        setIsRequestModalOpen(true);
    };

    const closeRequestModal = () => {
        setIsRequestModalOpen(false);
        setSelectedShiftId(plannedShifts[0]?.id || "");
        setRequestReason("");
        setIsUrgent(false);
    };

    const handleApplySubstitute = (requestId: string) => {
        console.log("Apply substitute:", requestId);
    };

    const handleCancelMyRequest = (requestId: string) => {
        console.log("Cancel my request:", requestId);
        setMyRequests((prev) =>
            prev.map((request) =>
                request.id === requestId ? { ...request, status: "rejected" } : request
            )
        );
    };

    const handleAcceptOtherRequest = (requestId: string) => {
        console.log("Accept other request:", requestId);
        setAcceptedRequestIds((prev) =>
            prev.includes(requestId) ? prev : [...prev, requestId]
        );
    };

    const handleSubmitSubstituteRequest = () => {
        const selectedShift = plannedShifts.find((shift) => shift.id === selectedShiftId);
        if (!selectedShift) return;

        const newRequest: SubstituteRequest = {
            id: `my-${Date.now()}`,
            shiftId: selectedShift.id,
            requesterId: "me",
            requesterName: "나",
            date: selectedShift.date,
            shiftTime: selectedShift.time,
            reason: requestReason || undefined,
            status: "pending",
            createdAt: new Date().toISOString(),
        };

        setMyRequests((prev) => [newRequest, ...prev]);
        setActiveTab("my");
        console.log("Create substitute request:", { ...newRequest, urgent: isUrgent });
        closeRequestModal();
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    {storeName} 대타 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    대기 중인 대타 요청을 확인하고, 내가 요청한 근무 기록을 조회하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <Button className="gap-2" onClick={openRequestModal}>
                                    <span className="material-icons text-sm">add</span>
                                    대타 요청 등록
                                </Button>
                            </div>
                        </div>

                        <div className="border-b border-slate-200 dark:border-slate-700">
                            <nav className="-mb-px flex gap-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("open")}
                                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === "open"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-slate-500 hover:text-primary"
                                    }`}
                                >
                                    대기 중 요청
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {openRequests.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("my")}
                                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === "my"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-slate-500 hover:text-primary"
                                    }`}
                                >
                                    내 요청 근무 기록
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("others")}
                                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === "others"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-slate-500 hover:text-primary"
                                    }`}
                                >
                                    다른 직원 요청
                                </button>
                            </nav>
                        </div>

                        {activeTab === "open" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {openRequests.map((request) => (
                                    <Card key={request.id} className="h-full">
                                        <CardBody className="flex flex-col h-full">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {request.requesterName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        등록{" "}
                                                        {new Date(request.createdAt).toLocaleDateString(
                                                            "ko-KR"
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                                    대기 중
                                                </span>
                                            </div>

                                            <div className="mt-4 space-y-2 text-sm">
                                                <p className="text-slate-900 dark:text-white font-medium">
                                                    {request.date}
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    {request.shiftTime}
                                                </p>
                                                {request.reason && (
                                                    <p className="text-slate-500 dark:text-slate-400">
                                                        사유: {request.reason}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-5">
                                                <Button
                                                    onClick={() =>
                                                        handleApplySubstitute(request.id)
                                                    }
                                                    className="w-full gap-2"
                                                >
                                                    <span className="material-icons text-sm">
                                                        assignment_turned_in
                                                    </span>
                                                    대타 지원
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === "my" && (
                            <div className="space-y-4">
                                {myRequests.map((request) => (
                                    <Card key={request.id}>
                                        <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {request.date} / {request.shiftTime}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusChip(
                                                            request.status
                                                        )}`}
                                                    >
                                                        {getStatusLabel(request.status)}
                                                    </span>
                                                </div>
                                                {request.reason && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        사유: {request.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-400">
                                                    요청일{" "}
                                                    {new Date(request.createdAt).toLocaleDateString(
                                                        "ko-KR"
                                                    )}
                                                </p>
                                            </div>

                                            {request.status === "pending" && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        handleCancelMyRequest(request.id)
                                                    }
                                                    className="gap-2"
                                                >
                                                    <span className="material-icons text-sm">
                                                        close
                                                    </span>
                                                    요청 취소
                                                </Button>
                                            )}
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === "others" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {openRequests.map((request) => {
                                    const isAccepted = acceptedRequestIds.includes(request.id);
                                    return (
                                        <Card key={`others-${request.id}`} className="h-full">
                                            <CardBody className="flex flex-col h-full">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">
                                                            {request.requesterName}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {request.date} / {request.shiftTime}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                        대타 모집중
                                                    </span>
                                                </div>

                                                {request.reason && (
                                                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                                        사유: {request.reason}
                                                    </p>
                                                )}

                                                <div className="mt-auto pt-5">
                                                    <Button
                                                        className="w-full gap-2"
                                                        onClick={() =>
                                                            handleAcceptOtherRequest(request.id)
                                                        }
                                                        disabled={isAccepted}
                                                    >
                                                        <span className="material-icons text-sm">
                                                            check
                                                        </span>
                                                        {isAccepted ? "수락 완료" : "요청 수락"}
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Modal
                isOpen={isRequestModalOpen}
                onClose={closeRequestModal}
                title="대타 요청 등록"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        대타가 필요한 근무를 선택하면 해당 요청이 등록됩니다.
                    </p>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Select Shift
                        </label>
                        <select
                            value={selectedShiftId}
                            onChange={(e) => setSelectedShiftId(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            {plannedShifts.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                    {shift.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            사유 (선택)
                        </label>
                        <textarea
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                            className="w-full min-h-[100px] text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3"
                            placeholder="대타가 필요한 사유를 입력하세요."
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        긴급 요청으로 표시
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={closeRequestModal}>
                            취소
                        </Button>
                        <Button
                            onClick={handleSubmitSubstituteRequest}
                            disabled={!selectedShiftId}
                        >
                            요청 등록
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
