"use client";

import { useMemo } from "react";
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

const weekDays = [
    { label: "Mon", date: "09" },
    { label: "Tue", date: "10" },
    { label: "Wed", date: "11" },
    { label: "Thu", date: "12", highlight: true },
    { label: "Fri", date: "13" },
    { label: "Sat", date: "14" },
    { label: "Sun", date: "15" },
];

type ShiftTone = "emerald" | "amber" | "sky";

type RosterRow = {
    name: string;
    time: string;
    tone: ShiftTone;
    cells: string[][];
};

const rosterRows: RosterRow[] = [
    {
        name: "Opening",
        time: "09:00 - 13:00",
        tone: "emerald",
        cells: [["Alice", "Bob"], ["David"], [], [], ["Alice"], ["James"], []],
    },
    {
        name: "Middle",
        time: "13:00 - 18:00",
        tone: "amber",
        cells: [[], ["Katie"], ["Mike"], ["Sarah", "Paul"], ["Ryan"], [], ["John"]],
    },
    {
        name: "Closing",
        time: "18:00 - 22:00",
        tone: "sky",
        cells: [["Emma"], [], ["Noah"], ["Liam"], [], ["Olivia", "Mason"], []],
    },
];

const badgeStyleByTone: Record<ShiftTone, string> = {
    emerald:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50",
    amber:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50",
    sky:
        "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800/50",
};

const dotStyleByTone: Record<ShiftTone, string> = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
};

export default function StoreMainPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

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
                                    {storeName} 주간 시간표
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    storeId: {storeId} 기준 매장 메인 화면 (주간 시간표)
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">chevron_left</span>
                                    이전 주
                                </Button>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">chevron_right</span>
                                    다음 주
                                </Button>
                                <Button className="gap-2">
                                    <span className="material-icons text-sm">add</span>
                                    새 시프트
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            오늘 배정 인원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            9명
                                        </p>
                                    </div>
                                    <span className="material-icons text-primary">groups</span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            오픈 시프트
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            3개
                                        </p>
                                    </div>
                                    <span className="material-icons text-green-500">wb_sunny</span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            대체 요청
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            2건
                                        </p>
                                    </div>
                                    <span className="material-icons text-amber-500">swap_horiz</span>
                                </CardBody>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Weekly Roster
                                    </h3>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Oct 09 - Oct 15
                                    </span>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[1100px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#15232d]">
                                        <div className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Shift / Day
                                                </span>
                                            </div>
                                            {weekDays.map((day) => (
                                                <div
                                                    key={`${day.label}-${day.date}`}
                                                    className={`p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${day.highlight ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                                                >
                                                    <span
                                                        className={`block text-xs font-semibold uppercase ${day.highlight ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}
                                                    >
                                                        {day.label}
                                                    </span>
                                                    <span
                                                        className={`block text-lg font-bold ${day.highlight ? "text-primary" : "text-slate-900 dark:text-white"}`}
                                                    >
                                                        {day.date}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {rosterRows.map((row) => (
                                            <div
                                                key={row.name}
                                                className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                                            >
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${dotStyleByTone[row.tone]}`}
                                                        />
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {row.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                                                        {row.time}
                                                    </span>
                                                </div>

                                                {row.cells.map((names, idx) => (
                                                    <div
                                                        key={`${row.name}-${idx}`}
                                                        className={`p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[110px] flex flex-col gap-2 ${idx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-800/20" : ""}`}
                                                    >
                                                        {names.length > 0 ? (
                                                            names.map((name) => (
                                                                <div
                                                                    key={`${row.name}-${idx}-${name}`}
                                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium ${badgeStyleByTone[row.tone]}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-[10px] font-bold">
                                                                        {name[0]}
                                                                    </div>
                                                                    {name}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="w-full h-full border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                                            >
                                                                <span className="material-icons text-sm">
                                                                    add
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
