"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ScheduleGrid } from "@/components/ui/ScheduleGrid";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Shift } from "@/types/schedule";

// Mock data
const mockShifts: Shift[] = [
    {
        id: "1",
        employeeId: "emp1",
        employeeName: "김철수",
        date: "2024-02-12",
        startTime: "09:00",
        endTime: "17:00",
        type: "opening",
        status: "scheduled",
    },
    {
        id: "2",
        employeeId: "emp2",
        employeeName: "이영희",
        date: "2024-02-12",
        startTime: "13:00",
        endTime: "21:00",
        type: "closing",
        status: "scheduled",
    },
    {
        id: "3",
        employeeId: "emp1",
        employeeName: "김철수",
        date: "2024-02-14",
        startTime: "10:00",
        endTime: "18:00",
        type: "middle",
        status: "scheduled",
    },
];

const navItems = [
    { label: "내 일정", href: "/employee/schedule", icon: "calendar_today" },
    { label: "대체 근무", href: "/employee/substitutes", icon: "swap_horiz" },
    { label: "오픈 시프트", href: "/employee/open-shifts", icon: "work_outline" },
];

export default function EmployeeSchedulePage() {
    const weekStart = "2024-02-12";

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="employee" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    내 근무 일정
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    이번 주 근무 스케줄을 확인하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">download</span>
                                    내보내기
                                </Button>
                                <Button className="gap-2">
                                    <span className="material-icons text-sm">add</span>
                                    대체 근무 요청
                                </Button>
                            </div>
                        </div>

                        {/* Week Navigation */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm">
                                        <span className="material-icons">chevron_left</span>
                                    </Button>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            2024년 2월 12일 - 2월 18일
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            7주차
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <span className="material-icons">chevron_right</span>
                                    </Button>
                                </div>
                                <Button variant="secondary" size="sm">
                                    오늘
                                </Button>
                            </CardHeader>
                        </Card>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            이번 주 근무
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockShifts.length}일
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
                                            24시간
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
                                            예상 급여
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            ₩240,000
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">payments</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Schedule Grid */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        주간 스케줄
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-blue-500" />
                                            <span className="text-slate-600 dark:text-slate-400">
                                                오픈
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-green-500" />
                                            <span className="text-slate-600 dark:text-slate-400">
                                                미들
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-purple-500" />
                                            <span className="text-slate-600 dark:text-slate-400">
                                                마감
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <ScheduleGrid shifts={mockShifts} weekStart={weekStart} />
                            </CardBody>
                        </Card>

                        {/* Upcoming Shifts */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    다가오는 근무
                                </h3>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {mockShifts.slice(0, 3).map((shift) => (
                                    <div
                                        key={shift.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-icons text-sm">work</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {new Date(shift.date).toLocaleDateString("ko-KR", {
                                                        month: "long",
                                                        day: "numeric",
                                                        weekday: "short",
                                                    })}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {shift.startTime} - {shift.endTime}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <span className="material-icons">more_vert</span>
                                        </Button>
                                    </div>
                                ))}
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
