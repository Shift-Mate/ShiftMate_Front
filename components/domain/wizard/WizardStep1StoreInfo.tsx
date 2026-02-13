"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { WizardFormData } from "@/components/domain/wizard/types";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
};

export function WizardStep1StoreInfo({ data, onChange }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    2단계: 매장 기본 정보
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    매장 별칭, 운영 시간, 일일 시프트 수를 입력하세요.
                </p>
            </div>

            <div className="space-y-5">
                <Input
                    label="사업자 등록번호 (검증 완료)"
                    value={data.businessId}
                    readOnly
                    className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40"
                />

                <Input
                    label="매장 이름"
                    value={data.storeName}
                    onChange={(e) => onChange({ storeName: e.target.value })}
                    placeholder="예: 강남역점"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="오픈 시간"
                        type="time"
                        value={data.openTime}
                        onChange={(e) => onChange({ openTime: e.target.value })}
                    />
                    <Input
                        label="마감 시간"
                        type="time"
                        value={data.closeTime}
                        onChange={(e) => onChange({ closeTime: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        일일 시프트 수
                    </label>
                    <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-r-none"
                            onClick={() =>
                                onChange({ shiftsPerDay: Math.max(1, data.shiftsPerDay - 1) })
                            }
                        >
                            <span className="material-icons text-base">remove</span>
                        </Button>
                        <span className="w-14 text-center text-sm font-semibold">
                            {data.shiftsPerDay}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-l-none"
                            onClick={() =>
                                onChange({ shiftsPerDay: Math.min(10, data.shiftsPerDay + 1) })
                            }
                        >
                            <span className="material-icons text-base">add</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
