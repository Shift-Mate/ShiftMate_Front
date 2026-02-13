"use client";

import { useMemo, useState } from "react";

type StoreSalaryItem = {
    storeName: string;
    shiftType: string;
    hourlyRate: number;
    workedHours: number;
    estimatedPay: number;
    icon: string;
    tone: "blue" | "orange";
    primary?: boolean;
};

const salaryItems: StoreSalaryItem[] = [
    {
        storeName: "강남점",
        shiftType: "평일 시프트",
        hourlyRate: 10000,
        workedHours: 40,
        estimatedPay: 400000,
        icon: "storefront",
        tone: "blue",
        primary: true,
    },
    {
        storeName: "홍대점",
        shiftType: "주말 시프트",
        hourlyRate: 12000,
        workedHours: 20,
        estimatedPay: 240000,
        icon: "local_cafe",
        tone: "orange",
    },
];

const formatWon = (value: number) => `₩${value.toLocaleString("ko-KR")}`;

export function SalaryEstimationPanel() {
    const [monthOffset, setMonthOffset] = useState(0);

    const displayedDate = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        return date;
    }, [monthOffset]);

    const monthLabel = useMemo(
        () =>
            displayedDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
            }),
        [displayedDate]
    );

    const adjustedSalaryItems = useMemo(() => {
        const ratio = Math.max(0.7, 1 + monthOffset * 0.05);
        return salaryItems.map((item) => ({
            ...item,
            estimatedPay: Math.round(item.estimatedPay * ratio),
            workedHours: Math.max(1, Math.round(item.workedHours * ratio)),
        }));
    }, [monthOffset]);

    const totalEstimatedPay = adjustedSalaryItems.reduce(
        (sum, item) => sum + item.estimatedPay,
        0
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    월별 예상 급여 기록
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMonthOffset((prev) => prev - 1)}
                        className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        aria-label="이전 달"
                    >
                        <span className="material-icons text-base">chevron_left</span>
                    </button>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
                        {monthLabel}
                    </span>
                    <button
                        type="button"
                        onClick={() => setMonthOffset((prev) => Math.min(0, prev + 1))}
                        className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                        aria-label="다음 달"
                        disabled={monthOffset === 0}
                    >
                        <span className="material-icons text-base">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 dark:from-[#15152a] dark:to-[#1c1c2e] border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    선택한 달 예상 급여
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">{formatWon(totalEstimatedPay)}</p>
                <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                    <span className="material-icons text-[14px] mr-1">trending_up</span>
                    전월 대비 +12%
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adjustedSalaryItems.map((item) => (
                    <div
                        key={item.storeName}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#15152a]"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        item.tone === "blue"
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                    }`}
                                >
                                    <span className="material-icons text-[18px]">{item.icon}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {item.storeName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.shiftType}
                                    </p>
                                </div>
                            </div>
                            {item.primary && (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                    Primary
                                </span>
                            )}
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">시급</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formatWon(item.hourlyRate)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">근무 시간</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {item.workedHours}시간
                                </span>
                            </div>
                            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    예상 급여
                                </span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {formatWon(item.estimatedPay)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
