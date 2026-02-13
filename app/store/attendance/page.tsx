"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/Button";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type ShiftOption = {
    id: string;
    label: string;
};

const STORE_SHIFT_OPTIONS: Record<string, ShiftOption[]> = {
    "1": [
        { id: "gn-2026-02-13-open", label: "02/13 (금) 오픈 09:00 - 13:00" },
        { id: "gn-2026-02-13-middle", label: "02/13 (금) 미들 13:00 - 18:00" },
        { id: "gn-2026-02-13-close", label: "02/13 (금) 마감 18:00 - 22:00" },
    ],
    "2": [
        { id: "hd-2026-02-13-open", label: "02/13 (금) 오픈 08:00 - 12:00" },
        { id: "hd-2026-02-13-middle", label: "02/13 (금) 미들 12:00 - 18:00" },
        { id: "hd-2026-02-13-close", label: "02/13 (금) 마감 18:00 - 23:00" },
    ],
    "3": [
        { id: "pg-2026-02-13-open", label: "02/13 (금) 오픈 09:00 - 14:00" },
        { id: "pg-2026-02-13-middle", label: "02/13 (금) 미들 14:00 - 19:00" },
        { id: "pg-2026-02-13-close", label: "02/13 (금) 마감 19:00 - 23:00" },
    ],
    "4": [
        { id: "bs-2026-02-13-open", label: "02/13 (금) 오픈 10:00 - 14:00" },
        { id: "bs-2026-02-13-middle", label: "02/13 (금) 미들 14:00 - 19:00" },
        { id: "bs-2026-02-13-close", label: "02/13 (금) 마감 19:00 - 24:00" },
    ],
};

type AttendanceAction = "clock-in" | "clock-out";

export default function AttendancePage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";

    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const shiftOptions = useMemo(
        () => STORE_SHIFT_OPTIONS[storeId] || STORE_SHIFT_OPTIONS["1"],
        [storeId]
    );
    const hasShiftOptions = shiftOptions.length > 0;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [pin, setPin] = useState("");
    const [selectedShiftId, setSelectedShiftId] = useState("");
    const [message, setMessage] = useState("");
    const [messageTone, setMessageTone] = useState<"success" | "error">("success");

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const activeShiftId = useMemo(() => {
        const selectedExists = shiftOptions.some((shift) => shift.id === selectedShiftId);
        if (selectedExists) return selectedShiftId;
        return shiftOptions[0]?.id || "";
    }, [selectedShiftId, shiftOptions]);

    const handleNumberClick = (num: string) => {
        if (pin.length >= 4) return;
        setPin((prev) => prev + num);
        setMessage("");
    };

    const handleBackspace = () => {
        setPin((prev) => prev.slice(0, -1));
        setMessage("");
    };

    const handleClear = () => {
        setPin("");
        setMessage("");
    };

    const handleAttendanceAction = (action: AttendanceAction) => {
        if (!activeShiftId) {
            setMessageTone("error");
            setMessage("출퇴근할 근무 shift를 먼저 선택해 주세요.");
            return;
        }

        if (pin.length !== 4) {
            setMessageTone("error");
            setMessage("PIN 4자리를 입력해 주세요.");
            return;
        }

        const selectedShift = shiftOptions.find((shift) => shift.id === activeShiftId);

        console.log("attendance", {
            storeId,
            shiftId: activeShiftId,
            pin,
            action,
        });

        setMessageTone("success");
        setMessage(
            `${action === "clock-in" ? "출근" : "퇴근"} 처리 완료: ${selectedShift?.label || "선택된 근무"}`
        );
        setPin("");
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-hidden p-6">
                    <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <section className="p-8 bg-gradient-to-br from-white to-primary/5 dark:from-[#15232b] dark:to-[#101c22] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                            <div className="max-w-lg">
                                <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                                    Current Time
                                </p>
                                <div className="text-6xl leading-none font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                    {currentTime.toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </div>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {storeName} •{" "}
                                    {currentTime.toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        weekday: "long",
                                    })}
                                </p>

                                <div className="mt-8 bg-white/80 dark:bg-[#1a2c36] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Select Shift
                                    </label>
                                    <select
                                        value={activeShiftId}
                                        onChange={(e) => setSelectedShiftId(e.target.value)}
                                        disabled={!hasShiftOptions}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-[#101c22] border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="" disabled>
                                            {hasShiftOptions
                                                ? "예정된 근무 shift를 선택해 주세요"
                                                : "현재 선택 가능한 근무 shift가 없습니다"}
                                        </option>
                                        {shiftOptions.map((shift) => (
                                            <option key={shift.id} value={shift.id}>
                                                {shift.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {message && (
                                    <div
                                        className={`mt-6 p-4 rounded-xl border text-sm ${
                                            messageTone === "success"
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                        }`}
                                    >
                                        {message}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="p-8 bg-white dark:bg-[#15232b] flex flex-col justify-center">
                            <div className="w-full max-w-md mx-auto">
                                <div className="mb-6 text-center">
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                                        Enter Staff PIN
                                    </label>
                                    <div className="flex justify-center gap-4 mb-2 h-10 items-center">
                                        {[0, 1, 2, 3].map((index) => (
                                            <div
                                                key={index}
                                                className={`w-4 h-4 rounded-full ${
                                                    pin.length > index
                                                        ? "bg-primary"
                                                        : "bg-slate-200 dark:bg-slate-600"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => handleNumberClick(num.toString())}
                                            className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-2xl font-semibold text-slate-900 dark:text-white shadow-sm border-b-4 border-slate-200 dark:border-[#101c22]"
                                        >
                                            {num}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleBackspace}
                                        className="h-16 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center shadow-sm border-b-4 border-red-100 dark:border-red-900/40"
                                    >
                                        <span className="material-icons">backspace</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNumberClick("0")}
                                        className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-2xl font-semibold text-slate-900 dark:text-white shadow-sm border-b-4 border-slate-200 dark:border-[#101c22]"
                                    >
                                        0
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-sm font-semibold text-slate-500 dark:text-slate-300 shadow-sm border-b-4 border-slate-200 dark:border-[#101c22]"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        className="h-20 flex-col text-xl font-bold"
                                        onClick={() => handleAttendanceAction("clock-in")}
                                        disabled={!hasShiftOptions || !activeShiftId}
                                    >
                                        <span className="material-icons text-3xl">login</span>
                                        출근
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="h-20 flex-col text-xl font-bold"
                                        onClick={() => handleAttendanceAction("clock-out")}
                                        disabled={!hasShiftOptions || !activeShiftId}
                                    >
                                        <span className="material-icons text-3xl">logout</span>
                                        퇴근
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
