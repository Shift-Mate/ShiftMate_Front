"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SubstituteRequestCard } from "@/components/domain/SubstituteRequestCard";
import { Card, CardBody } from "@/components/ui/Card";
import { SubstituteRequest } from "@/types/schedule";

// Mock data
const mockRequests: SubstituteRequest[] = [
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
    {
        id: "4",
        shiftId: "shift4",
        requesterId: "emp4",
        requesterName: "최지은",
        date: "2024-02-13",
        shiftTime: "14:00 - 22:00",
        status: "rejected",
        createdAt: "2024-02-07T16:20:00Z",
    },
];

const navItems = [
    { label: "대시보드", href: "/manager", icon: "dashboard" },
    { label: "직원 관리", href: "/manager/staff", icon: "people" },
    { label: "대체 요청", href: "/manager/requests", icon: "swap_horiz" },
];

export default function ManagerRequestsPage() {
    const handleApprove = (id: string) => {
        console.log("Approve request:", id);
        // TODO: API 연동
    };

    const handleReject = (id: string) => {
        console.log("Reject request:", id);
        // TODO: API 연동
    };

    const pendingRequests = mockRequests.filter((r) => r.status === "pending");
    const processedRequests = mockRequests.filter((r) => r.status !== "pending");

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="manager" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    대체 근무 요청 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    직원들의 대체 근무 요청을 검토하고 승인하세요.
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            대기 중
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {pendingRequests.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <span className="material-icons">pending</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            승인됨
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockRequests.filter((r) => r.status === "approved").length}
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
                                            거부됨
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockRequests.filter((r) => r.status === "rejected").length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <span className="material-icons">cancel</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        승인 대기 중
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                        {pendingRequests.length}건
                                    </span>
                                </div>
                                <div className="grid gap-4">
                                    {pendingRequests.map((request) => (
                                        <SubstituteRequestCard
                                            key={request.id}
                                            request={request}
                                            onAccept={handleApprove}
                                            onReject={handleReject}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Processed Requests */}
                        {processedRequests.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    처리 완료
                                </h3>
                                <div className="grid gap-4">
                                    {processedRequests.map((request) => (
                                        <SubstituteRequestCard key={request.id} request={request} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {mockRequests.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-icons text-3xl text-slate-400">
                                        swap_horiz
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    대체 근무 요청이 없습니다
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    직원의 대체 근무 요청이 있으면 여기에 표시됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
