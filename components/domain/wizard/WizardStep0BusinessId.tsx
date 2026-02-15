"use client";

import { useMemo } from "react";
import { WizardFormData } from "@/components/domain/wizard/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
    data: WizardFormData;
    onChange: (patch: Partial<WizardFormData>) => void;
    onVerify: () => Promise<void>;
    isVerifying: boolean;
    verifyError: string | null;
};

export function WizardStep0BusinessId({
    data,
    onChange,
    onVerify,
    isVerifying,
    verifyError,
}: Props) {
    const isFormatValid = useMemo(
        () => /^(\d{10}|\d{3}-\d{2}-\d{5})$/.test(data.businessId),
        [data.businessId]
    );

    const handleVerify = async () => {
        if (!isFormatValid) return;
        await onVerify();
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    1단계: 사업자 번호 검증
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    유효한 사업자 번호를 입력하고 검증을 완료하세요.
                </p>
            </div>

            <div className="space-y-4">
                <Input
                    label="사업자 등록번호"
                    value={data.businessId}
                    onChange={(e) =>
                        onChange({
                            businessId: e.target.value,
                            businessIdVerified: false,
                        })
                    }
                    placeholder="000-00-00000"
                />

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={handleVerify}
                        disabled={!isFormatValid || isVerifying}
                        className="gap-2"
                    >
                        <span className="material-icons text-sm">verified_user</span>
                        {isVerifying ? "검증 중..." : "사업자 번호 검증"}
                    </Button>

                    {data.businessIdVerified ? (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            검증 완료
                        </span>
                    ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            형식: 000-00-00000 또는 10자리 숫자
                        </span>
                    )}
                </div>
                {verifyError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{verifyError}</p>
                )}
            </div>
        </div>
    );
}
