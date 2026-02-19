"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type StaffWorkCost = {
    id: string;
    name: string;
    role: string;
    hourlyWage: number;
    actualHours: number;
    scheduledHours: number;
};

const staffWorkCosts: StaffWorkCost[] = [
    {
        id: "s1",
        name: "김민지",
        role: "헤드 바리스타",
        hourlyWage: 11000,
        actualHours: 38,
        scheduledHours: 40,
    },
    {
        id: "s2",
        name: "박준호",
        role: "직원",
        hourlyWage: 9860,
        actualHours: 35,
        scheduledHours: 40,
    },
    {
        id: "s3",
        name: "이수진",
        role: "매니저",
        hourlyWage: 15000,
        actualHours: 45,
        scheduledHours: 40,
    },
    {
        id: "s4",
        name: "최민호",
        role: "직원",
        hourlyWage: 9860,
        actualHours: 20,
        scheduledHours: 25,
    },
    {
        id: "s5",
        name: "김유나",
        role: "직원",
        hourlyWage: 9860,
        actualHours: 30,
        scheduledHours: 30,
    },
];

const formatWon = (value: number) => `₩${value.toLocaleString("ko-KR")}`;

function StoreLaborCostPageContent() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const totalActiveStaff = staffWorkCosts.length;
    const totalHoursLogged = staffWorkCosts.reduce((sum, row) => sum + row.actualHours, 0);
    const estimatedLaborCost = staffWorkCosts.reduce(
        (sum, row) => sum + row.actualHours * row.hourlyWage,
        0
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                                    {storeName} 인건비 현황
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    총 직원 근무기록 기반 주간 인건비 코스트 대시보드
                                </p>
                            </div>

                            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-1">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors">
                                    <span className="material-icons text-sm">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-2 px-4 py-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <span className="material-icons text-primary text-base">
                                        date_range
                                    </span>
                                    Feb 10 - Feb 16, 2024
                                </div>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors">
                                    <span className="material-icons text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        활성 직원 수
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {totalActiveStaff}
                                    </p>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        총 근무시간
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {totalHoursLogged}
                                        <span className="text-lg font-medium text-slate-500 ml-1">
                                            h
                                        </span>
                                    </p>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        예상 인건비
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {formatWon(estimatedLaborCost)}
                                    </p>
                                </CardBody>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    직원별 주간 근무/급여 상세
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" className="gap-2">
                                        <span className="material-icons text-sm">filter_list</span>
                                        필터
                                    </Button>
                                    <Button className="gap-2">
                                        <span className="material-icons text-sm">download</span>
                                        내보내기
                                    </Button>
                                </div>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[860px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                직원
                                            </th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                시급
                                            </th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/4">
                                                주간 근무 (실제 / 예정)
                                            </th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                                예상 급여
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {staffWorkCosts.map((row) => {
                                            const ratio = Math.min(
                                                100,
                                                (row.actualHours / row.scheduledHours) * 100
                                            );
                                            const estPay = row.actualHours * row.hourlyWage;
                                            return (
                                                <tr
                                                    key={row.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                                                {row.name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                    {row.name}
                                                                </p>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                    {row.role}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {formatWon(row.hourlyWage)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {row.actualHours}h
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                of {row.scheduledHours}h
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    ratio >= 100
                                                                        ? "bg-rose-500"
                                                                        : "bg-primary"
                                                                }`}
                                                                style={{ width: `${ratio}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {formatWon(estPay)}
                                                        </p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function StoreLaborCostPage() {
  return (
    <Suspense fallback={null}>
      <StoreLaborCostPageContent />
    </Suspense>
  );
}
