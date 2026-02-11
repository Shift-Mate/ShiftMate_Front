"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];

export default function StoreWizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [storeData, setStoreData] = useState({
        name: "",
        location: "",
        peakHours: [] as string[],
        shiftTypes: {
            opening: { start: "09:00", end: "17:00" },
            middle: { start: "13:00", end: "21:00" },
            closing: { start: "17:00", end: "01:00" },
        },
        staffingNeeds: {
            kitchen: 2,
            frontOfHouse: 3,
            delivery: 1,
        },
    });

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = () => {
        console.log("Store data:", storeData);
        // TODO: API 연동
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-3xl mx-auto">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-2 rounded-full mx-1 ${s <= step
                                        ? "bg-primary"
                                        : "bg-slate-200 dark:bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        단계 {step} / 4
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {step === 1 && "매장 기본 정보"}
                            {step === 2 && "피크 타임 설정"}
                            {step === 3 && "시프트 설정"}
                            {step === 4 && "인력 배치"}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {step === 1 && "매장의 기본 정보를 입력하세요"}
                            {step === 2 && "바쁜 시간대를 선택하세요"}
                            {step === 3 && "근무 시간을 설정하세요"}
                            {step === 4 && "필요한 인력을 설정하세요"}
                        </p>
                    </CardHeader>

                    <CardBody className="space-y-6">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <Input
                                    label="매장명"
                                    value={storeData.name}
                                    onChange={(e) =>
                                        setStoreData({ ...storeData, name: e.target.value })
                                    }
                                    placeholder="예: 강남점"
                                />
                                <Input
                                    label="위치"
                                    value={storeData.location}
                                    onChange={(e) =>
                                        setStoreData({ ...storeData, location: e.target.value })
                                    }
                                    placeholder="예: 서울시 강남구"
                                />
                            </div>
                        )}

                        {/* Step 2: Peak Hours */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    바쁜 시간대를 선택하세요 (복수 선택 가능)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        "09:00-12:00",
                                        "12:00-15:00",
                                        "15:00-18:00",
                                        "18:00-21:00",
                                        "21:00-24:00",
                                    ].map((hour) => (
                                        <button
                                            key={hour}
                                            onClick={() => {
                                                const newPeakHours = storeData.peakHours.includes(hour)
                                                    ? storeData.peakHours.filter((h) => h !== hour)
                                                    : [...storeData.peakHours, hour];
                                                setStoreData({ ...storeData, peakHours: newPeakHours });
                                            }}
                                            className={`p-4 rounded-lg border-2 text-left transition-colors ${storeData.peakHours.includes(hour)
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <span className="font-medium">{hour}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Shift Times */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                        오픈 시프트
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="시작 시간"
                                            type="time"
                                            value={storeData.shiftTypes.opening.start}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        opening: {
                                                            ...storeData.shiftTypes.opening,
                                                            start: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                        <Input
                                            label="종료 시간"
                                            type="time"
                                            value={storeData.shiftTypes.opening.end}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        opening: {
                                                            ...storeData.shiftTypes.opening,
                                                            end: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                        미들 시프트
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="시작 시간"
                                            type="time"
                                            value={storeData.shiftTypes.middle.start}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        middle: {
                                                            ...storeData.shiftTypes.middle,
                                                            start: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                        <Input
                                            label="종료 시간"
                                            type="time"
                                            value={storeData.shiftTypes.middle.end}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        middle: {
                                                            ...storeData.shiftTypes.middle,
                                                            end: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                        마감 시프트
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="시작 시간"
                                            type="time"
                                            value={storeData.shiftTypes.closing.start}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        closing: {
                                                            ...storeData.shiftTypes.closing,
                                                            start: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                        <Input
                                            label="종료 시간"
                                            type="time"
                                            value={storeData.shiftTypes.closing.end}
                                            onChange={(e) =>
                                                setStoreData({
                                                    ...storeData,
                                                    shiftTypes: {
                                                        ...storeData.shiftTypes,
                                                        closing: {
                                                            ...storeData.shiftTypes.closing,
                                                            end: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Staffing */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                주방
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                필요한 주방 인력
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            kitchen: Math.max(
                                                                0,
                                                                storeData.staffingNeeds.kitchen - 1
                                                            ),
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                -
                                            </button>
                                            <span className="text-xl font-bold text-slate-900 dark:text-white w-8 text-center">
                                                {storeData.staffingNeeds.kitchen}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            kitchen: storeData.staffingNeeds.kitchen + 1,
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                홀
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                필요한 홀 인력
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            frontOfHouse: Math.max(
                                                                0,
                                                                storeData.staffingNeeds.frontOfHouse - 1
                                                            ),
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                -
                                            </button>
                                            <span className="text-xl font-bold text-slate-900 dark:text-white w-8 text-center">
                                                {storeData.staffingNeeds.frontOfHouse}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            frontOfHouse:
                                                                storeData.staffingNeeds.frontOfHouse + 1,
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                배달
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                필요한 배달 인력
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            delivery: Math.max(
                                                                0,
                                                                storeData.staffingNeeds.delivery - 1
                                                            ),
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                -
                                            </button>
                                            <span className="text-xl font-bold text-slate-900 dark:text-white w-8 text-center">
                                                {storeData.staffingNeeds.delivery}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setStoreData({
                                                        ...storeData,
                                                        staffingNeeds: {
                                                            ...storeData.staffingNeeds,
                                                            delivery: storeData.staffingNeeds.delivery + 1,
                                                        },
                                                    })
                                                }
                                                className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="secondary"
                                onClick={handleBack}
                                disabled={step === 1}
                            >
                                이전
                            </Button>
                            {step < 4 ? (
                                <Button onClick={handleNext}>다음</Button>
                            ) : (
                                <Button onClick={handleComplete}>완료</Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
