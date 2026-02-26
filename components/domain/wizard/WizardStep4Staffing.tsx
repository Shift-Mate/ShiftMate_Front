"use client";

import { Button } from "@/components/ui/Button";
import {
    TemplateType,
    WizardTemplateResDto,
} from "@/components/domain/wizard/types";

type Props = {
    templates: WizardTemplateResDto[];
    selectedTemplateType: TemplateType;
    staffingByTemplateId: Record<number, number>;
    onStaffingChange: (templateId: number, nextCount: number) => void;
    templateNamesById: Record<number, string>;
    onTemplateNameChange: (templateId: number, nextName: string) => void;
};

const formatTime = (time: string): string => {
    const [hourText, minuteText] = time.split(":");
    if (!hourText || !minuteText) {
        return time;
    }
    return `${hourText.padStart(2, "0")}:${minuteText.padStart(2, "0")}`;
};

const templateTypeLabel: Record<TemplateType, string> = {
    COSTSAVER: "Cost Saver",
    HIGHSERVICE: "High Service",
};

export function WizardStep4Staffing({
    templates,
    selectedTemplateType,
    staffingByTemplateId,
    onStaffingChange,
    templateNamesById,
    onTemplateNameChange,
}: Props) {
    const sortedTemplates = [...templates].sort((a, b) => {
        const [aHour, aMinute] = a.startTime.split(":");
        const [bHour, bMinute] = b.startTime.split(":");
        const aStart = Number(aHour) * 60 + Number(aMinute);
        const bStart = Number(bHour) * 60 + Number(bMinute);
        return aStart - bStart;
    });
    const updateCount = (templateId: number, delta: number) => {
        const current = staffingByTemplateId[templateId] ?? 1;
        const next = Math.max(1, Math.min(20, current + delta));
        onStaffingChange(templateId, next);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    5단계: 시프트별 선호 인원
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    선택된 템플릿 타입({templateTypeLabel[selectedTemplateType]})의 시프트별 인원을 입력하세요.
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div className="px-3 py-2">이름</div>
                    <div className="px-3 py-2">시작시간</div>
                    <div className="px-3 py-2">끝나는 시간</div>
                    <div className="px-3 py-2">선호 인원</div>
                </div>
                {sortedTemplates.length === 0 && (
                    <div className="col-span-4 px-3 py-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                        선택된 타입의 시프트를 불러오지 못했습니다.
                    </div>
                )}
                {sortedTemplates.map((template, idx) => {
                    const label =
                        template.name ??
                        (template.shiftType === "PEAK" ? "Peak" : `Shift ${idx + 1}`);
                    const editableName = templateNamesById[template.id] ?? label;
                    const count = staffingByTemplateId[template.id] ?? 1;

                    return (
                        <div
                            key={`${template.id}-${template.startTime}-${template.endTime}`}
                            className="grid grid-cols-4 text-sm border-t border-slate-200 dark:border-slate-700"
                        >
                            <div className="px-3 py-2">
                                <input
                                    type="text"
                                    value={editableName}
                                    onChange={(event) =>
                                        onTemplateNameChange(template.id, event.target.value)
                                    }
                                    maxLength={40}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {formatTime(template.startTime)}
                            </div>
                            <div className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {formatTime(template.endTime)}
                            </div>
                            <div className="px-3 py-2 flex items-center">
                                <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-r-none"
                                        onClick={() => updateCount(template.id, -1)}
                                    >
                                        <span className="material-icons text-base">remove</span>
                                    </Button>
                                    <span className="w-16 text-center font-semibold text-slate-900 dark:text-white">
                                        {count}명
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-l-none"
                                        onClick={() => updateCount(template.id, 1)}
                                    >
                                        <span className="material-icons text-base">add</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
