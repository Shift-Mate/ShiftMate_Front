"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Attendance, AttendanceStatus } from "@/types/attendance";

// Mock data
const mockAttendance: Attendance[] = [
    {
        id: "1",
        employeeId: "emp1",
        employeeName: "김철수",
        date: "2024-02-11",
        clockIn: "09:00",
        clockOut: "18:00",
        status: "present",
    },
    {
        id: "2",
        employeeId: "emp2",
        employeeName: "이영희",
        date: "2024-02-11",
        clockIn: "09:15",
        clockOut: "18:05",
        status: "late",
    },
    {
        id: "3",
        employeeId: "emp3",
        employeeName: "박민수",
        date: "2024-02-11",
        clockIn: "09:00",
        status: "present",
    },
    {
        id: "4",
        employeeId: "emp4",
        employeeName: "최지은",
        date: "2024-02-11",
        status: "absent",
    },
];

const navItems = [
    { label: "대시보드", href: "/manager", icon: "dashboard" },
    { label: "직원 관리", href: "/manager/staff", icon: "people" },
    { label: "근무 상태", href: "/manager/status", icon: "assessment" },
    { label: "대체 요청", href: "/manager/requests", icon: "swap_horiz" },
];

const getStatusVariant = (
    status: AttendanceStatus
): "success" | "warning" | "error" | "default" => {
    switch (status) {
        case "present":
            return "success";
        case "late":
            return "warning";
        case "absent":
            return "error";
        case "early_leave":
            return "warning";
        default:
            return "default";
    }
};

const getStatusLabel = (status: AttendanceStatus): string => {
    const labels: Record<AttendanceStatus, string> = {
        present: "출근",
        late: "지각",
        absent: "결근",
        early_leave: "조퇴",
    };
    return labels[status];
};

export default function WorkStatusPage() {
    const presentCount = mockAttendance.filter((a) => a.status === "present").length;
    const lateCount = mockAttendance.filter((a) => a.status === "late").length;
    const absentCount = mockAttendance.filter((a) => a.status === "absent").length;

    const columns = [
        {
            key: "employeeName",
            header: "직원명",
            render: (att: Attendance) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {att.employeeName[0]}
                    </div>
                    <span className="font-medium">{att.employeeName}</span>
                </div>
            ),
        },
        {
            key: "clockIn",
            header: "출근 시간",
            render: (att: Attendance) => att.clockIn || "-",
        },
        {
            key: "clockOut",
            header: "퇴근 시간",
            render: (att: Attendance) => att.clockOut || "-",
        },
        {
            key: "workHours",
            header: "근무 시간",
            render: (att: Attendance) => {
                if (!att.clockIn || !att.clockOut) return "-";
                const [inH, inM] = att.clockIn.split(":").map(Number);
                const [outH, outM] = att.clockOut.split(":").map(Number);
                const hours = outH - inH + (outM - inM) / 60;
                return `${hours.toFixed(1)}시간`;
            },
        },
        {
            key: "status",
            header: "상태",
            render: (att: Attendance) => (
                <Badge variant={getStatusVariant(att.status)}>
                    {getStatusLabel(att.status)}
                </Badge>
            ),
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="manager" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    근무 상태 대시보드
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    오늘의 출퇴근 현황을 확인하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date().toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        weekday: "long",
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockAttendance.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">people</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            출근
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {presentCount + lateCount}
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
                                            지각
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {lateCount}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <span className="material-icons">warning</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            결근
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {absentCount}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <span className="material-icons">cancel</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Attendance Table */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    오늘의 출퇴근 현황
                                </h3>
                            </CardHeader>
                            <Table data={mockAttendance} columns={columns} />
                        </Card>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardBody className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <span className="material-icons">info</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            출퇴근 관리 안내
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            직원들은 PIN 번호를 사용하여 출퇴근을 기록할 수 있습니다.
                                            /attendance 페이지에서 출퇴근 등록이 가능합니다.
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                                <CardBody className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0">
                                        <span className="material-icons">trending_up</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            출근율
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            오늘 출근율:{" "}
                                            {(
                                                ((presentCount + lateCount) / mockAttendance.length) *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
