"use client";

import { WizardFormData } from "@/components/domain/wizard/types";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
};

const options = [
    {
        value: "fixed" as const,
        title: "고정 타임테이블",
        subtitle: "예측 가능한 일일 운영에 적합",
        bullets: ["고정 8시간 블록", "단순한 인수인계", "직원 예측 가능성 높음"],
    },
    {
        value: "demand" as const,
        title: "수요 기반 타임테이블",
        subtitle: "점심/저녁 피크에 인력 집중",
        bullets: ["매출/혼잡도 기반 배치", "유휴 인력 최소화", "피크 시간 커버 강화"],
    },
];

export function WizardStep3ShiftLogic({ data, onChange }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    4단계: 타임테이블 선택
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    두 가지 타임테이블 로직 중 하나를 선택하세요.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option) => {
                    const selected = data.shiftLogic === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange({ shiftLogic: option.value })}
                            className={`text-left rounded-xl border-2 p-5 transition-colors ${
                                selected
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                    {option.title}
                                </h4>
                                <span
                                    className={`w-5 h-5 rounded-full border-2 ${
                                        selected
                                            ? "border-primary bg-primary"
                                            : "border-slate-300 dark:border-slate-600"
                                    }`}
                                />
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {option.subtitle}
                            </p>

                            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                {option.bullets.map((bullet) => (
                                    <li key={bullet} className="flex items-center gap-2">
                                        <span className="material-icons text-primary text-base">
                                            check_circle
                                        </span>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
