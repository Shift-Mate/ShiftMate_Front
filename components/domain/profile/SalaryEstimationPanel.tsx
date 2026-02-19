"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthlySalarySummary, SalaryMonth, salaryApi } from "@/lib/api/salary";

const formatWon = (value: number) => `₩${value.toLocaleString("ko-KR")}`;
const formatMonth = (month: SalaryMonth) => `${month.year}년 ${month.month}월`;
const formatWorkedTime = (minutes: number) => {
    const safeMinutes = Math.max(0, minutes);
    const hours = Math.floor(safeMinutes / 60);
    const remainMinutes = safeMinutes % 60;
    if (remainMinutes === 0) {
        return `${hours}시간`;
    }
    return `${hours}시간 ${remainMinutes}분`;
};

export function SalaryEstimationPanel() {
    const [availableMonths, setAvailableMonths] = useState<SalaryMonth[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<SalaryMonth | null>(null);
    const [summary, setSummary] = useState<MonthlySalarySummary | null>(null);
    const [loadingMonths, setLoadingMonths] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadAvailableMonths = async () => {
            setLoadingMonths(true);
            setErrorMessage(null);
            const response = await salaryApi.getSalaryMonths();

            if (!isMounted) {
                return;
            }

            if (!response.success || !response.data) {
                setAvailableMonths([]);
                setSelectedMonth(null);
                setSummary(null);
                setErrorMessage(response.error?.message ?? "월 목록을 불러오지 못했습니다.");
                setLoadingMonths(false);
                return;
            }

            const months = response.data;
            setAvailableMonths(months);

            if (months.length === 0) {
                setSelectedMonth(null);
                setSummary(null);
                setLoadingMonths(false);
                return;
            }

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const defaultMonth =
                months.find((month) => month.year === currentYear && month.month === currentMonth) ??
                months[0];

            setSelectedMonth(defaultMonth);
            setLoadingMonths(false);
        };

        void loadAvailableMonths();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedMonth) {
            return;
        }

        let isMounted = true;

        const loadMonthlySalary = async () => {
            setLoadingSummary(true);
            setErrorMessage(null);

            const response = await salaryApi.getMonthlySalary(selectedMonth.year, selectedMonth.month);
            if (!isMounted) {
                return;
            }

            if (!response.success || !response.data) {
                setSummary(null);
                setErrorMessage(response.error?.message ?? "월별 급여를 불러오지 못했습니다.");
                setLoadingSummary(false);
                return;
            }

            setSummary(response.data);
            setLoadingSummary(false);
        };

        void loadMonthlySalary();

        return () => {
            isMounted = false;
        };
    }, [selectedMonth]);

    const selectedIndex = useMemo(() => {
        if (!selectedMonth) {
            return -1;
        }
        return availableMonths.findIndex(
            (month) => month.year === selectedMonth.year && month.month === selectedMonth.month
        );
    }, [availableMonths, selectedMonth]);

    const monthLabel = selectedMonth ? formatMonth(selectedMonth) : "선택 가능한 월 없음";
    const totalEstimatedPay = summary?.totalEstimatedPay ?? 0;
    const canMovePrev = selectedIndex >= 0 && selectedIndex < availableMonths.length - 1;
    const canMoveNext = selectedIndex > 0;

    const handleMovePrev = () => {
        if (!canMovePrev || selectedIndex < 0) {
            return;
        }
        setSelectedMonth(availableMonths[selectedIndex + 1]);
    };

    const handleMoveNext = () => {
        if (!canMoveNext || selectedIndex <= 0) {
            return;
        }
        setSelectedMonth(availableMonths[selectedIndex - 1]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    월별 예상 급여 기록
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleMovePrev}
                        className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        aria-label="이전 달"
                        disabled={!canMovePrev}
                    >
                        <span className="material-icons text-base">chevron_left</span>
                    </button>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
                        {monthLabel}
                    </span>
                    <button
                        type="button"
                        onClick={handleMoveNext}
                        className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                        aria-label="다음 달"
                        disabled={!canMoveNext}
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
                {loadingSummary && (
                    <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        불러오는 중...
                    </span>
                )}
            </div>

            {loadingMonths && (
                <p className="text-sm text-slate-500 dark:text-slate-400">필터를 불러오는 중입니다.</p>
            )}
            {!loadingMonths && availableMonths.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    근무 기록이 있는 월이 없어 표시할 데이터가 없습니다.
                </p>
            )}
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(summary?.stores ?? []).map((item, index) => (
                    <div
                        key={`${item.storeId}-${index}`}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#15152a]"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        index % 2 === 0
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                    }`}
                                >
                                    <span className="material-icons text-[18px]">storefront</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {item.storeName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.storeAlias || "스토어"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">시급</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formatWon(item.hourlyWage)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">근무 시간</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formatWorkedTime(item.workedMinutes)}
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

            {!loadingSummary && summary && summary.stores.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    해당 월에는 근무 기록이 없습니다.
                </p>
            )}
        </div>
    );
}
