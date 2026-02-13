"use client";

import { WizardFormData } from "@/components/domain/wizard/types";
import { Input } from "@/components/ui/Input";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
};

export function WizardStep2PeakTime({ data, onChange }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    3단계: 피크 타임 설정
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    피크 타임 사용 여부와 시간대를 설정하세요.
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                            피크 타임 사용
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            사용 안 함이면 3단계는 건너뜁니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange({ peakTimeEnabled: !data.peakTimeEnabled })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                            data.peakTimeEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                data.peakTimeEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {data.peakTimeEnabled && (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="피크 시작 시간"
                            type="time"
                            value={data.peakStart}
                            onChange={(e) => onChange({ peakStart: e.target.value })}
                        />
                        <Input
                            label="피크 종료 시간"
                            type="time"
                            value={data.peakEnd}
                            onChange={(e) => onChange({ peakEnd: e.target.value })}
                        />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={data.applyPeakAllDays}
                            onChange={(e) =>
                                onChange({ applyPeakAllDays: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        모든 운영일에 동일한 피크타임 적용
                    </label>
                </div>
            )}
        </div>
    );
}
