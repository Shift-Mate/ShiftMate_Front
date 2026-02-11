"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Shift } from "@/types/schedule";

// Mock data - 오픈 시프트
const mockOpenShifts: Shift[] = [
    {
        id: "open1",
        employeeId: "",
        employeeName: "",
        date: "2024-02-15",
        startTime: "09:00",
        endTime: "17:00",
        type: "opening",
        status: "scheduled",
    },
    {
        id: "open2",
        employeeId: "",
        employeeName: "",
        date: "2024-02-16",
        startTime: "13:00",
        endTime: "21:00",
        type: "closing",
        status: "scheduled",
    },
    {
        id: "open3",
        employeeId: "",
        employeeName: "",
        date: "2024-02-17",
        startTime: "10:00",
        endTime: "18:00",
        type: "middle",
        status: "scheduled",
    },
    {
        id: "open4",
        employeeId: "",
        employeeName: "",
        date: "2024-02-18",
        startTime: "09:00",
        endTime: "17:00",
        type: "opening",
        status: "scheduled",
    },
];

const navItems = [
    { label: "내 일정", href: "/employee/schedule", icon: "calendar_today" },
    { label: "대체 근무", href: "/employee/substitutes", icon: "swap_horiz" },
    { label: "오픈 시프트", href: "/employee/open-shifts", icon: "work_outline" },
];

const getShiftTypeLabel = (type: string) => {
    switch (type) {
        case "opening":
            return "오픈";
        case "middle":
            return "미들";
        case "closing":
            return "마감";
        default:
            return type;
    }
};

const getShiftTypeColor = (type: string) => {
    switch (type) {
        case "opening":
            return "info";
        case "middle":
            return "success";
        case "closing":
            return "warning";
        default:
            return "default";
    }
};

export default function OpenShiftsPage() {
    const handleClaimShift = (id: string) => {
        console.log("Claim shift:", id);
        // TODO: API 연동
    };

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
                                    오픈 시프트
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    추가 근무가 필요하신가요? 사용 가능한 시프트를 선택하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">filter_list</span>
                                    필터
                                </Button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            사용 가능한 시프트
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockOpenShifts.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">work_outline</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            이번 주
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockOpenShifts.filter((s) => s.date <= "2024-02-18").length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <span className="material-icons">event</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            내가 신청한 시프트
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            0
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">check_circle</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Open Shifts List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                사용 가능한 시프트
                            </h3>

                            {mockOpenShifts.length > 0 ? (
                                <div className="grid gap-4">
                                    {mockOpenShifts.map((shift) => (
                                        <Card key={shift.id} hover>
                                            <CardBody className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <span className="material-icons">work</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                                {new Date(shift.date).toLocaleDateString("ko-KR", {
                                                                    month: "long",
                                                                    day: "numeric",
                                                                    weekday: "long",
                                                                })}
                                                            </h4>
                                                            <Badge
                                                                variant={
                                                                    getShiftTypeColor(shift.type) as
                                                                    | "success"
                                                                    | "warning"
                                                                    | "info"
                                                                }
                                                            >
                                                                {getShiftTypeLabel(shift.type)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                            <div className="flex items-center gap-1">
                                                                <span className="material-icons text-sm">
                                                                    schedule
                                                                </span>
                                                                <span>
                                                                    {shift.startTime} - {shift.endTime}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="material-icons text-sm">
                                                                    payments
                                                                </span>
                                                                <span>₩10,000/시간</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleClaimShift(shift.id)}
                                                    className="gap-2"
                                                >
                                                    <span className="material-icons text-sm">add</span>
                                                    신청하기
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons text-3xl text-slate-400">
                                            work_outline
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        사용 가능한 시프트가 없습니다
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        새로운 오픈 시프트가 있으면 여기에 표시됩니다.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Info Banner */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardBody className="flex items-start gap-3">
                                <span className="material-icons text-primary">info</span>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                        오픈 시프트란?
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        오픈 시프트는 아직 배정되지 않은 근무 시간입니다. 추가 근무를
                                        원하시면 사용 가능한 시프트를 신청하실 수 있습니다. 관리자가
                                        승인하면 일정에 추가됩니다.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
