"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SubstituteRequestCard } from "@/components/domain/SubstituteRequestCard";
import { Button } from "@/components/ui/Button";
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
        status: "approved",
        createdAt: "2024-02-09T14:30:00Z",
    },
    {
        id: "3",
        shiftId: "shift3",
        requesterId: "emp3",
        requesterName: "박민수",
        date: "2024-02-17",
        shiftTime: "10:00 - 18:00",
        status: "pending",
        createdAt: "2024-02-11T09:15:00Z",
    },
];

const navItems = [
    { label: "내 일정", href: "/employee/schedule", icon: "calendar_today" },
    { label: "대체 근무", href: "/employee/substitutes", icon: "swap_horiz" },
    { label: "오픈 시프트", href: "/employee/open-shifts", icon: "work_outline" },
];

export default function SubstitutesPage() {
    const handleAccept = (id: string) => {
        console.log("Accept request:", id);
        // TODO: API 연동
    };

    const handleReject = (id: string) => {
        console.log("Reject request:", id);
        // TODO: API 연동
    };

    const pendingRequests = mockRequests.filter((r) => r.status === "pending");
    const otherRequests = mockRequests.filter((r) => r.status !== "pending");

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="employee" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    대체 근무 요청
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    동료의 대체 근무 요청을 확인하고 수락하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <Button className="gap-2">
                                    <span className="material-icons text-sm">add</span>
                                    새 요청 생성
                                </Button>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        대기 중인 요청
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
                                            onAccept={handleAccept}
                                            onReject={handleReject}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Requests */}
                        {otherRequests.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    처리된 요청
                                </h3>
                                <div className="grid gap-4">
                                    {otherRequests.map((request) => (
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
                                <p className="text-slate-500 dark:text-slate-400 mb-6">
                                    동료의 대체 근무 요청이 있으면 여기에 표시됩니다.
                                </p>
                                <Button>새 요청 생성</Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
