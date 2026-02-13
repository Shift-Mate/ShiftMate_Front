"use client";

import { Button } from "@/components/ui/Button";
import { WizardFormData } from "@/components/domain/wizard/types";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
};

const shifts = [
    { key: "opening" as const, label: "오픈 시프트", time: "09:00 - 13:00" },
    { key: "middle" as const, label: "미들 시프트", time: "13:00 - 18:00" },
    { key: "closing" as const, label: "마감 시프트", time: "18:00 - 22:00" },
];

export function WizardStep4Staffing({ data, onChange }: Props) {
    const updateCount = (key: keyof WizardFormData["staffing"], delta: number) => {
        const current = data.staffing[key];
        const next = Math.max(1, Math.min(20, current + delta));
        onChange({ staffing: { ...data.staffing, [key]: next } });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    5단계: 시프트별 필요 인원
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    각 시프트에 필요한 목표 인원을 설정하세요.
                </p>
            </div>

            <div className="space-y-4">
                {shifts.map((shift) => (
                    <div
                        key={shift.key}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {shift.label}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {shift.time}
                            </p>
                        </div>
                        <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-r-none"
                                onClick={() => updateCount(shift.key, -1)}
                            >
                                <span className="material-icons text-base">remove</span>
                            </Button>
                            <span className="w-16 text-center font-semibold">
                                {data.staffing[shift.key]}명
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-l-none"
                                onClick={() => updateCount(shift.key, 1)}
                            >
                                <span className="material-icons text-base">add</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
