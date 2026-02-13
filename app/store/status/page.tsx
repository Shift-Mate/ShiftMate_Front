"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Attendance, AttendanceStatus } from "@/types/attendance";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type ViewMode = "daily" | "weekly";

type WeeklyDay = {
    label: string;
    status: "present" | "late" | "absent" | "off";
    time?: string;
};

type WeeklyEmployee = {
    id: string;
    name: string;
    role: string;
    days: WeeklyDay[];
    totalHours: string;
};

const dailyAttendance: Attendance[] = [
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

const weeklyAttendance: WeeklyEmployee[] = [
    {
        id: "w1",
        name: "김철수",
        role: "홀",
        days: [
            { label: "월", status: "present", time: "09:00-18:00" },
            { label: "화", status: "late", time: "09:15-18:00" },
            { label: "수", status: "present", time: "09:00-18:00" },
            { label: "목", status: "present", time: "09:00-18:00" },
            { label: "금", status: "present", time: "09:00-18:00" },
            { label: "토", status: "off" },
            { label: "일", status: "off" },
        ],
        totalHours: "39h 45m",
    },
    {
        id: "w2",
        name: "이영희",
        role: "주방",
        days: [
            { label: "월", status: "present", time: "08:00-16:00" },
            { label: "화", status: "present", time: "08:00-16:00" },
            { label: "수", status: "present", time: "08:00-16:00" },
            { label: "목", status: "present", time: "08:00-16:00" },
            { label: "금", status: "present", time: "08:00-16:00" },
            { label: "토", status: "off" },
            { label: "일", status: "off" },
        ],
        totalHours: "40h 00m",
    },
    {
        id: "w3",
        name: "박민수",
        role: "배달",
        days: [
            { label: "월", status: "off" },
            { label: "화", status: "off" },
            { label: "수", status: "absent" },
            { label: "목", status: "present", time: "12:00-20:00" },
            { label: "금", status: "present", time: "12:00-20:00" },
            { label: "토", status: "present", time: "10:00-16:00" },
            { label: "일", status: "off" },
        ],
        totalHours: "22h 00m",
    },
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

const getWeeklyStatusChip = (status: WeeklyDay["status"]) => {
    if (status === "present") {
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    }
    if (status === "late") {
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    }
    if (status === "absent") {
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    }
    return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
};

const getWeeklyStatusText = (day: WeeklyDay) => {
    if (day.status === "present" || day.status === "late") {
        return day.time || "-";
    }
    if (day.status === "absent") return "결근";
    return "-";
};

export default function WorkStatusPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [viewMode, setViewMode] = useState<ViewMode>("daily");

    const presentCount = dailyAttendance.filter((a) => a.status === "present").length;
    const lateCount = dailyAttendance.filter((a) => a.status === "late").length;
    const absentCount = dailyAttendance.filter((a) => a.status === "absent").length;

    const dailyColumns = [
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
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    {storeName} 근태 현황
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    일간/주간 단위로 근무 기록을 확인할 수 있습니다.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {viewMode === "daily" ? "Today, Feb 14, 2024" : "Feb 9 - Feb 15, 2024"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("daily")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === "daily"
                                            ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    일간
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("weekly")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === "weekly"
                                            ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    주간
                                </button>
                            </div>

                            <div className="hidden md:flex items-center gap-4 text-sm">
                                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    출근 {presentCount + lateCount}
                                </span>
                                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    지각 {lateCount}
                                </span>
                                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    결근 {absentCount}
                                </span>
                            </div>
                        </div>

                        {viewMode === "daily" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Card>
                                        <CardBody className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    총 직원
                                                </p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                                    {dailyAttendance.length}
                                                </p>
                                            </div>
                                            <span className="material-icons text-primary">people</span>
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
                                            <span className="material-icons text-green-500">
                                                check_circle
                                            </span>
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
                                            <span className="material-icons text-amber-500">
                                                warning
                                            </span>
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
                                            <span className="material-icons text-red-500">cancel</span>
                                        </CardBody>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            오늘의 출퇴근 현황
                                        </h3>
                                    </CardHeader>
                                    <Table data={dailyAttendance} columns={dailyColumns} />
                                </Card>
                            </>
                        )}

                        {viewMode === "weekly" && (
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        주간 근태 그리드
                                    </h3>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                                                        직원
                                                    </th>
                                                    {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                                                        <th
                                                            key={d}
                                                            className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                                                        >
                                                            {d}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {weeklyAttendance.map((employee) => (
                                                    <tr
                                                        key={employee.id}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {employee.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {employee.role}
                                                            </p>
                                                        </td>
                                                        {employee.days.map((day, idx) => (
                                                            <td key={`${employee.id}-${idx}`} className="px-3 py-3">
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium ${getWeeklyStatusChip(
                                                                        day.status
                                                                    )}`}
                                                                >
                                                                    {getWeeklyStatusText(day)}
                                                                </span>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
