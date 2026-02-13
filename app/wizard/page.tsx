"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WizardStep0BusinessId } from "@/components/domain/wizard/WizardStep0BusinessId";
import { WizardStep1StoreInfo } from "@/components/domain/wizard/WizardStep1StoreInfo";
import { WizardStep2PeakTime } from "@/components/domain/wizard/WizardStep2PeakTime";
import { WizardStep3ShiftLogic } from "@/components/domain/wizard/WizardStep3ShiftLogic";
import { WizardStep4Staffing } from "@/components/domain/wizard/WizardStep4Staffing";
import { WizardFormData } from "@/components/domain/wizard/types";

type StepKey = "business" | "store" | "peak" | "logic" | "staffing";

const stepTitleByKey: Record<StepKey, string> = {
    business: "사업자 검증",
    store: "매장 정보",
    peak: "피크 타임",
    logic: "타임테이블",
    staffing: "근무 인원",
};

const initialData: WizardFormData = {
    businessId: "849-22-00123",
    businessIdVerified: false,
    storeName: "",
    openTime: "09:00",
    closeTime: "22:00",
    shiftsPerDay: 3,
    peakTimeEnabled: true,
    peakStart: "12:00",
    peakEnd: "14:00",
    applyPeakAllDays: true,
    shiftLogic: "demand",
    staffing: {
        opening: 3,
        middle: 4,
        closing: 3,
    },
};

export default function WizardPage() {
    const router = useRouter();
    const [data, setData] = useState<WizardFormData>(initialData);
    const [currentStep, setCurrentStep] = useState<StepKey>("business");

    const visibleSteps = useMemo<StepKey[]>(
        () =>
            data.peakTimeEnabled
                ? ["business", "store", "peak", "logic", "staffing"]
                : ["business", "store", "peak", "staffing"],
        [data.peakTimeEnabled]
    );

    useEffect(() => {
        if (currentStep === "logic" && !data.peakTimeEnabled) {
            setCurrentStep("staffing");
        }
    }, [currentStep, data.peakTimeEnabled]);

    const currentStepIndex = visibleSteps.indexOf(currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === visibleSteps.length - 1;

    const handlePatch = (patch: Partial<WizardFormData>) => {
        setData((prev) => ({ ...prev, ...patch }));
    };

    const canProceed = useMemo(() => {
        if (currentStep === "business") {
            return data.businessIdVerified;
        }
        return true;
    }, [currentStep, data.businessIdVerified]);

    const goPrev = () => {
        if (isFirstStep) {
            router.push("/dashboard");
            return;
        }
        setCurrentStep(visibleSteps[currentStepIndex - 1]);
    };

    const goNext = () => {
        if (isLastStep) {
            console.log("Wizard complete:", data);
            router.push("/dashboard");
            return;
        }
        setCurrentStep(visibleSteps[currentStepIndex + 1]);
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <MainHeader />

            <main className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        새 매장 생성
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        단계별 설정을 완료하면 매장을 생성할 수 있습니다.
                                    </p>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                                    Step {currentStepIndex + 1} / {visibleSteps.length}
                                </span>
                            </div>
                        </CardHeader>

                        <CardBody className="space-y-6">
                            <div className="grid grid-cols-5 gap-2">
                                {(
                                    ["business", "store", "peak", "logic", "staffing"] as StepKey[]
                                ).map(
                                    (stepKey) => {
                                        const hiddenBecauseSkip =
                                            stepKey === "logic" && !data.peakTimeEnabled;
                                        const visibleIndex = visibleSteps.indexOf(stepKey);
                                        const isCompleted =
                                            visibleIndex !== -1 &&
                                            visibleIndex < currentStepIndex;
                                        const isActive = stepKey === currentStep;

                                        return (
                                            <div key={stepKey} className="space-y-2">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        hiddenBecauseSkip
                                                            ? "bg-slate-100 dark:bg-slate-800"
                                                            : isActive || isCompleted
                                                              ? "bg-primary"
                                                              : "bg-slate-200 dark:bg-slate-700"
                                                    }`}
                                                />
                                                <p
                                                    className={`text-xs ${
                                                        hiddenBecauseSkip
                                                            ? "text-slate-300 dark:text-slate-700"
                                                            : isActive
                                                              ? "text-primary font-semibold"
                                                              : "text-slate-500 dark:text-slate-400"
                                                    }`}
                                                >
                                                    {stepTitleByKey[stepKey]}
                                                </p>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            {currentStep === "business" && (
                                <WizardStep0BusinessId data={data} onChange={handlePatch} />
                            )}
                            {currentStep === "store" && (
                                <WizardStep1StoreInfo data={data} onChange={handlePatch} />
                            )}
                            {currentStep === "peak" && (
                                <WizardStep2PeakTime data={data} onChange={handlePatch} />
                            )}
                            {currentStep === "logic" && (
                                <WizardStep3ShiftLogic data={data} onChange={handlePatch} />
                            )}
                            {currentStep === "staffing" && (
                                <WizardStep4Staffing data={data} onChange={handlePatch} />
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <Button variant="secondary" onClick={goPrev}>
                                    <span className="material-icons text-sm">arrow_back</span>
                                    이전
                                </Button>
                                <Button onClick={goNext} disabled={!canProceed}>
                                    {isLastStep ? "완료" : "다음"}
                                    {!isLastStep && (
                                        <span className="material-icons text-sm">
                                            arrow_forward
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}
