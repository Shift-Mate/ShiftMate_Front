"use client";

import {
    TemplateType,
    WizardFormData,
    WizardTemplateResDto,
} from "@/components/domain/wizard/types";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
    templatesByType: Record<TemplateType, WizardTemplateResDto[]>;
};

const options: Array<{
    value: TemplateType;
    title: string;
    subtitle: string;
    bullets: string[];
}> = [
    {
        value: "COSTSAVER",
        title: "Cost Saver",
        subtitle: "최소 인력 중심 운영",
        bullets: ["중복 근무 최소화", "인건비 효율화", "기본 피크 커버"],
    },
    {
        value: "HIGHSERVICE",
        title: "High Service",
        subtitle: "서비스 품질 중심 운영",
        bullets: ["피크 시간 인력 강화", "응대 속도/품질 우선", "혼잡 시간대 여유 인원"],
    },
];

const formatTime = (time: string): string => {
    const [hourText, minuteText] = time.split(":");
    if (!hourText || !minuteText) {
        return time;
    }
    return `${hourText.padStart(2, "0")}:${minuteText.padStart(2, "0")}`;
};

export function WizardStep3ShiftLogic({ data, onChange, templatesByType }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    4단계: 타임테이블 선택
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    템플릿 타입을 선택하면 생성 시 해당 타입만 최종 저장됩니다.
                </p>
                {!data.peakTimeEnabled && (
                    <p className="mt-2 text-sm text-primary">
                        피크 타임 미사용: 영업시간이 일일 시프트 수({data.shiftsPerDay}) 기준으로
                        자동 분할됩니다.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {options.map((option) => {
                    const selected = data.templateType === option.value;
                    const previewRows = templatesByType[option.value] ?? [];

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange({ templateType: option.value })}
                            className={`text-left rounded-xl border-2 p-5 transition-colors space-y-4 ${
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

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {option.subtitle}
                            </p>

                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                {option.bullets.map((bullet) => (
                                    <li key={bullet} className="flex items-center gap-2">
                                        <span className="material-icons text-primary text-base">
                                            check_circle
                                        </span>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>

                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <div className="px-3 py-2">Shift</div>
                                    <div className="px-3 py-2">Start</div>
                                    <div className="px-3 py-2">End</div>
                                </div>
                                {previewRows.length === 0 && (
                                    <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                                        템플릿 시프트가 없습니다.
                                    </div>
                                )}
                                {previewRows.map((row, idx) => {
                                    const label =
                                        row.name ??
                                        (row.shiftType === "PEAK"
                                            ? "Peak"
                                            : `Shift ${idx + 1}`);

                                    return (
                                        <div
                                            key={`${option.value}-${row.id}-${row.startTime}-${row.endTime}`}
                                            className="grid grid-cols-3 text-sm border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="px-3 py-2 text-slate-900 dark:text-white">
                                                {label}
                                            </div>
                                            <div className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                                {formatTime(row.startTime)}
                                            </div>
                                            <div className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                                {formatTime(row.endTime)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
