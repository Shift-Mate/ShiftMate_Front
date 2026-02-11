"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const PinPad: React.FC<{
    onComplete: (pin: string) => void;
    onClear: () => void;
}> = ({ onComplete, onClear }) => {
    const [pin, setPin] = useState("");

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                onComplete(newPin);
            }
        }
    };

    const handleClear = () => {
        setPin("");
        onClear();
    };

    return (
        <div className="space-y-6">
            {/* PIN Display */}
            <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${pin.length > i
                                ? "bg-primary border-primary text-white"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            }`}
                    >
                        {pin.length > i && "●"}
                    </div>
                ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="h-16 rounded-lg bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-2xl font-semibold text-slate-900 dark:text-white transition-colors"
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={handleClear}
                    className="h-16 rounded-lg bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-lg font-semibold text-red-600 dark:text-red-400 transition-colors"
                >
                    지우기
                </button>
                <button
                    onClick={() => handleNumberClick("0")}
                    className="h-16 rounded-lg bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-2xl font-semibold text-slate-900 dark:text-white transition-colors"
                >
                    0
                </button>
                <div className="h-16" /> {/* Empty space */}
            </div>
        </div>
    );
};

export default function AttendancePage() {
    const [mode, setMode] = useState<"select" | "clock-in" | "clock-out">("select");
    const [message, setMessage] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handlePinComplete = async (pin: string) => {
        // TODO: API 연동
        console.log(`${mode} with PIN:`, pin);

        if (mode === "clock-in") {
            setMessage("출근이 완료되었습니다!");
        } else {
            setMessage("퇴근이 완료되었습니다!");
        }

        setTimeout(() => {
            setMode("select");
            setMessage("");
        }, 2000);
    };

    const handleClear = () => {
        setMessage("");
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-icons text-3xl">schedule</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        출퇴근 관리
                    </h1>
                    <p className="text-lg font-mono text-slate-600 dark:text-slate-400">
                        {currentTime.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {currentTime.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            weekday: "long",
                        })}
                    </p>
                </CardHeader>

                <CardBody className="space-y-6">
                    {mode === "select" ? (
                        <div className="space-y-4">
                            <Button
                                onClick={() => setMode("clock-in")}
                                className="w-full h-16 text-lg gap-3"
                            >
                                <span className="material-icons">login</span>
                                출근하기
                            </Button>
                            <Button
                                onClick={() => setMode("clock-out")}
                                variant="secondary"
                                className="w-full h-16 text-lg gap-3"
                            >
                                <span className="material-icons">logout</span>
                                퇴근하기
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {mode === "clock-in" ? "출근" : "퇴근"} PIN을 입력하세요
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    4자리 PIN 번호를 입력해주세요
                                </p>
                            </div>

                            <PinPad onComplete={handlePinComplete} onClear={handleClear} />

                            {message && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                                    <p className="text-green-800 dark:text-green-300 font-medium">
                                        {message}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={() => setMode("select")}
                                variant="ghost"
                                className="w-full"
                            >
                                취소
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
