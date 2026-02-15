"use client";

import { useMemo, useState } from "react";
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
import { storeApi } from "@/lib/api/stores";

type StepKey = "business" | "store" | "peak" | "logic" | "staffing";

type ApiError = {
    code: string;
    message: string;
    details?: unknown;
};

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error: ApiError | null;
};

type StoreResDto = {
    id: number;
    name: string;
    alias: string | null;
    openTime: string;
    closeTime: string;
    createdAt: string;
    updatedAt: string;
    monthlySales: number | null;
};

const stepTitleByKey: Record<StepKey, string> = {
    business: "사업자 검증",
    store: "매장 정보",
    peak: "피크 타임",
    logic: "타임테이블",
    staffing: "근무 인원",
};

const initialData: WizardFormData = {
    businessId: "",
    businessIdVerified: false,
    storeName: "",
    location: "",
    alias: "",
    monthlySales: "",
    openTime: "09:00",
    closeTime: "22:00",
    shiftsPerDay: 3,
    peakTimeEnabled: true,
    peakStart: "12:00",
    peakEnd: "14:00",
    applyPeakAllDays: true,
    templateType: "HIGHSERVICE",
    staffing: {
        opening: 3,
        middle: 4,
        closing: 3,
    },
};

const isApiEnvelope = <T,>(value: unknown): value is ApiResponse<T> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return typeof (value as { success?: unknown }).success === "boolean";
};

const extractErrorCode = (error: { code: string; details?: unknown }): string => {
    if (error.details && typeof error.details === "object") {
        const details = error.details as Record<string, unknown>;

        if (typeof details.code === "string") {
            return details.code;
        }

        if (details.error && typeof details.error === "object") {
            const nested = details.error as Record<string, unknown>;
            if (typeof nested.code === "string") {
                return nested.code;
            }
        }
    }

    return error.code;
};

const parseApiResult = <T,>(response: {
    success: boolean;
    data?: unknown;
    error?: { code: string; message: string; details?: unknown };
}): ApiResponse<T> => {
    if (!response.success) {
        const code = response.error ? extractErrorCode(response.error) : "UNKNOWN_ERROR";
        return {
            success: false,
            data: null,
            error: {
                code,
                message: response.error?.message ?? "요청 처리 중 오류가 발생했습니다.",
                details: response.error?.details,
            },
        };
    }

    const rawData = response.data as unknown;
    if (isApiEnvelope<T>(rawData)) {
        return rawData;
    }

    return {
        success: true,
        data: rawData as T,
        error: null,
    };
};

const toMinutes = (time: string): number => {
    const [hourText, minuteText] = time.split(":");
    return Number(hourText) * 60 + Number(minuteText);
};

const formatBizno = (value: string): string => {
    const digits = value.replace(/\D/g, "");

    if (digits.length !== 10) {
        return value;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

export default function WizardPage() {
    const router = useRouter();
    const [data, setData] = useState<WizardFormData>(initialData);
    const [currentStep, setCurrentStep] = useState<StepKey>("business");
    const [isVerifyingBizno, setIsVerifyingBizno] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const visibleSteps: StepKey[] = ["business", "store", "peak", "logic", "staffing"];

    const currentStepIndex = visibleSteps.indexOf(currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === visibleSteps.length - 1;

    const handlePatch = (patch: Partial<WizardFormData>) => {
        setData((prev) => ({ ...prev, ...patch }));

        if ("businessId" in patch || "openTime" in patch || "closeTime" in patch) {
            setSubmitError(null);
        }
    };

    const handleVerifyBizno = async () => {
        setIsVerifyingBizno(true);
        setVerifyError(null);

        const normalizedBizno = formatBizno(data.businessId);

        const response = await storeApi.verifyBizno(normalizedBizno);
        const parsed = parseApiResult<unknown>(response);

        if (!parsed.success) {
            const code = parsed.error?.code ?? "";
            if (code === "INVALID_BIZNO") {
                setVerifyError("유효하지 않은 사업자번호입니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                setVerifyError("사업자번호 형식을 확인해 주세요. (123-45-67890)");
            } else {
                setVerifyError(parsed.error?.message ?? "사업자번호 검증에 실패했습니다.");
            }
            setIsVerifyingBizno(false);
            return;
        }

        setData((prev) => ({
            ...prev,
            businessId: normalizedBizno,
            businessIdVerified: true,
        }));
        setIsVerifyingBizno(false);
    };

    const submitWizard = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        const createStoreResponse = await storeApi.createWizardStore({
            name: data.storeName.trim(),
            location: data.location.trim() || undefined,
            openTime: data.openTime,
            closeTime: data.closeTime,
            nShifts: data.shiftsPerDay,
            brn: formatBizno(data.businessId),
            alias: data.alias.trim() || undefined,
            monthlySales: data.monthlySales.trim()
                ? Number(data.monthlySales)
                : undefined,
        });

        const createdStore = parseApiResult<StoreResDto>(createStoreResponse);
        if (!createdStore.success || !createdStore.data?.id) {
            const code = createdStore.error?.code ?? "";
            if (code === "INVALID_TIME_RANGE") {
                setSubmitError("오픈 시간은 마감 시간보다 빨라야 합니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                setSubmitError("입력값을 확인해 주세요.");
            } else {
                setSubmitError(createdStore.error?.message ?? "매장 생성에 실패했습니다.");
            }
            setIsSubmitting(false);
            return;
        }

        const storeId = String(createdStore.data.id);

        const templateCreateResponse = await storeApi.createShiftTemplate(storeId, {
            peak: data.peakTimeEnabled,
            peakStartTime: data.peakTimeEnabled ? data.peakStart : undefined,
            peakEndTime: data.peakTimeEnabled ? data.peakEnd : undefined,
        });

        const templateCreated = parseApiResult<null>(templateCreateResponse);
        if (!templateCreated.success) {
            const code = templateCreated.error?.code ?? "";
            if (code === "INVALID_TIME_RANGE") {
                setSubmitError("피크 시작 시간은 종료 시간보다 빨라야 합니다.");
            } else if (code === "TEMPLATE_ALREADY_EXISTS") {
                setSubmitError("이미 템플릿이 생성된 매장입니다.");
            } else {
                setSubmitError(
                    templateCreated.error?.message ?? "템플릿 생성 중 오류가 발생했습니다."
                );
            }
            setIsSubmitting(false);
            return;
        }

        const typeUpdateResponse = await storeApi.updateTemplateType(storeId, {
            templateType: data.templateType,
        });
        const typeUpdated = parseApiResult<null>(typeUpdateResponse);

        if (!typeUpdated.success) {
            setSubmitError(typeUpdated.error?.message ?? "템플릿 타입 설정에 실패했습니다.");
            setIsSubmitting(false);
            return;
        }

        const cleanupResponse = await storeApi.deleteOtherTemplateTypes(storeId);
        const cleanup = parseApiResult<null>(cleanupResponse);

        if (!cleanup.success) {
            const code = cleanup.error?.code ?? "";

            if (code === "500" || code === "INTERNAL_SERVER_ERROR") {
                window.alert(
                    "매장은 생성되었지만 템플릿 정리 중 오류가 발생했습니다. 관리자에게 문의해 주세요."
                );
                router.push("/dashboard");
                return;
            }

            setSubmitError(cleanup.error?.message ?? "템플릿 정리에 실패했습니다.");
            setIsSubmitting(false);
            return;
        }

        window.alert("매장과 시프트 템플릿이 생성되었습니다.");
        router.push("/dashboard");
    };

    const canProceed = useMemo(() => {
        if (currentStep === "business") {
            return data.businessIdVerified;
        }

        if (currentStep === "store") {
            return (
                data.storeName.trim().length > 0 &&
                data.shiftsPerDay > 0 &&
                toMinutes(data.openTime) < toMinutes(data.closeTime)
            );
        }

        if (currentStep === "peak" && data.peakTimeEnabled) {
            return toMinutes(data.peakStart) < toMinutes(data.peakEnd);
        }

        return true;
    }, [
        currentStep,
        data.businessIdVerified,
        data.storeName,
        data.shiftsPerDay,
        data.openTime,
        data.closeTime,
        data.peakTimeEnabled,
        data.peakStart,
        data.peakEnd,
    ]);

    const goPrev = () => {
        if (isSubmitting) {
            return;
        }

        if (isFirstStep) {
            router.push("/dashboard");
            return;
        }

        setCurrentStep(visibleSteps[currentStepIndex - 1]);
    };

    const goNext = async () => {
        if (isSubmitting) {
            return;
        }

        if (isLastStep) {
            await submitWizard();
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
                                {visibleSteps.map((stepKey) => {
                                    const visibleIndex = visibleSteps.indexOf(stepKey);
                                    const isCompleted = visibleIndex < currentStepIndex;
                                    const isActive = stepKey === currentStep;

                                    return (
                                        <div key={stepKey} className="space-y-2">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    isActive || isCompleted
                                                        ? "bg-primary"
                                                        : "bg-slate-200 dark:bg-slate-700"
                                                }`}
                                            />
                                            <p
                                                className={`text-xs ${
                                                    isActive
                                                        ? "text-primary font-semibold"
                                                        : "text-slate-500 dark:text-slate-400"
                                                }`}
                                            >
                                                {stepTitleByKey[stepKey]}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {currentStep === "business" && (
                                <WizardStep0BusinessId
                                    data={data}
                                    onChange={handlePatch}
                                    onVerify={handleVerifyBizno}
                                    isVerifying={isVerifyingBizno}
                                    verifyError={verifyError}
                                />
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

                            {submitError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                    {submitError}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <Button variant="secondary" onClick={goPrev} disabled={isSubmitting}>
                                    <span className="material-icons text-sm">arrow_back</span>
                                    이전
                                </Button>
                                <Button onClick={goNext} disabled={!canProceed || isSubmitting}>
                                    {isLastStep
                                        ? isSubmitting
                                            ? "생성 중..."
                                            : "완료"
                                        : "다음"}
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
