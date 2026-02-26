"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WizardStep0BusinessId } from "@/components/domain/wizard/WizardStep0BusinessId";
import { WizardStep1StoreInfo } from "@/components/domain/wizard/WizardStep1StoreInfo";
import { WizardStep2PeakTime } from "@/components/domain/wizard/WizardStep2PeakTime";
import { WizardStep3ShiftLogic } from "@/components/domain/wizard/WizardStep3ShiftLogic";
import { WizardStep4Staffing } from "@/components/domain/wizard/WizardStep4Staffing";
import {
    TemplateType,
    WizardFormData,
    WizardTemplateResDto,
} from "@/components/domain/wizard/types";
import { storeApi } from "@/lib/api/stores";
import { showConfirmAlert, showSuccessAlert, showWarningAlert } from "@/lib/ui/sweetAlert";

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

const isTemplateType = (value: unknown): value is TemplateType =>
    value === "COSTSAVER" || value === "HIGHSERVICE";

const parseTemplateRows = (rawData: unknown): WizardTemplateResDto[] => {
    let rows: unknown[] = [];

    if (Array.isArray(rawData)) {
        rows = rawData;
    } else if (isApiEnvelope<unknown[]>(rawData) && rawData.success && Array.isArray(rawData.data)) {
        rows = rawData.data;
    }

    return rows
        .map((row, index) => {
            if (!row || typeof row !== "object") {
                return null;
            }

            const candidate = row as Record<string, unknown>;
            const startTime = typeof candidate.startTime === "string" ? candidate.startTime : null;
            const endTime = typeof candidate.endTime === "string" ? candidate.endTime : null;

            if (!startTime || !endTime) {
                return null;
            }

            return {
                id: typeof candidate.id === "number" ? candidate.id : index + 1,
                templateType: isTemplateType(candidate.templateType)
                    ? candidate.templateType
                    : null,
                shiftType: candidate.shiftType === "PEAK" ? "PEAK" : "NORMAL",
                name: typeof candidate.name === "string" ? candidate.name : null,
                startTime,
                endTime,
                requiredStaff:
                    typeof candidate.requiredStaff === "number" ? candidate.requiredStaff : null,
            };
        })
        .filter((row): row is WizardTemplateResDto => row !== null);
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

const normalizeTemplateRows = (
    templates: WizardTemplateResDto[]
): Record<TemplateType, WizardTemplateResDto[]> => {
    const grouped: Record<TemplateType, WizardTemplateResDto[]> = {
        COSTSAVER: [],
        HIGHSERVICE: [],
    };

    templates.forEach((template) => {
        if (template.templateType && grouped[template.templateType]) {
            grouped[template.templateType].push(template);
        }
    });

    return {
        COSTSAVER: [...grouped.COSTSAVER].sort(
            (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
        ),
        HIGHSERVICE: [...grouped.HIGHSERVICE].sort(
            (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
        ),
    };
};

const sortTemplatesByStart = (
    templates: WizardTemplateResDto[]
): WizardTemplateResDto[] =>
    [...templates].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

const getDefaultTemplateName = (template: WizardTemplateResDto, index: number): string => {
    const trimmed = template.name?.trim();
    if (trimmed) {
        return trimmed;
    }
    return template.shiftType === "PEAK" ? "Peak" : `Shift ${index + 1}`;
};

const buildInitialStaffingByTemplateId = (
    templates: WizardTemplateResDto[],
    previous: Record<number, number>,
    fallback: WizardFormData["staffing"]
): Record<number, number> => {
    const sorted = sortTemplatesByStart(templates);
    const normalTemplates = sorted.filter((template) => template.shiftType !== "PEAK");
    const firstNormalId = normalTemplates[0]?.id;
    const lastNormalId = normalTemplates[normalTemplates.length - 1]?.id;

    const next: Record<number, number> = {};

    sorted.forEach((template) => {
        const existing = previous[template.id];
        if (typeof existing === "number" && existing >= 1) {
            next[template.id] = existing;
            return;
        }

        if (typeof template.requiredStaff === "number" && template.requiredStaff >= 1) {
            next[template.id] = template.requiredStaff;
            return;
        }

        if (template.shiftType === "PEAK") {
            next[template.id] = fallback.middle;
            return;
        }

        if (template.id === firstNormalId) {
            next[template.id] = fallback.opening;
            return;
        }

        if (template.id === lastNormalId) {
            next[template.id] = fallback.closing;
            return;
        }

        next[template.id] = fallback.middle;
    });

    return next;
};

const buildInitialTemplateNamesById = (
    templates: WizardTemplateResDto[],
    previous: Record<number, string>
): Record<number, string> => {
    const sorted = sortTemplatesByStart(templates);
    const next: Record<number, string> = {};

    sorted.forEach((template, index) => {
        const existing = previous[template.id]?.trim();
        if (existing) {
            next[template.id] = existing;
            return;
        }

        next[template.id] = getDefaultTemplateName(template, index);
    });

    return next;
};

export default function WizardPage() {
    const router = useRouter();
    const [data, setData] = useState<WizardFormData>(initialData);
    const [currentStep, setCurrentStep] = useState<StepKey>("business");
    const [isVerifyingBizno, setIsVerifyingBizno] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [templateRows, setTemplateRows] = useState<WizardTemplateResDto[]>([]);
    const [selectedTypeRows, setSelectedTypeRows] = useState<WizardTemplateResDto[]>([]);
    const [staffingByTemplateId, setStaffingByTemplateId] = useState<Record<number, number>>({});
    const [templateNamesById, setTemplateNamesById] = useState<Record<number, string>>({});
    const [isWizardFinalized, setIsWizardFinalized] = useState(false);

    const storeIdRef = useRef<string | null>(null);
    const isWizardFinalizedRef = useRef(false);
    const isCleanupInFlightRef = useRef(false);

    const visibleSteps: StepKey[] = ["business", "store", "peak", "logic", "staffing"];

    const currentStepIndex = visibleSteps.indexOf(currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === visibleSteps.length - 1;

    const templatesByType = useMemo(() => normalizeTemplateRows(templateRows), [templateRows]);

    useEffect(() => {
        storeIdRef.current = storeId;
    }, [storeId]);

    useEffect(() => {
        isWizardFinalizedRef.current = isWizardFinalized;
    }, [isWizardFinalized]);

    const handlePatch = (patch: Partial<WizardFormData>) => {
        setData((prev) => ({ ...prev, ...patch }));
        setSubmitError(null);
    };

    const handleStaffingChange = (templateId: number, nextCount: number) => {
        const sanitized = Math.max(1, Math.min(20, nextCount));
        setStaffingByTemplateId((prev) => ({
            ...prev,
            [templateId]: sanitized,
        }));
        setSubmitError(null);
    };

    const handleTemplateNameChange = (templateId: number, nextName: string) => {
        setTemplateNamesById((prev) => ({
            ...prev,
            [templateId]: nextName.slice(0, 40),
        }));
        setSubmitError(null);
    };

    const markWizardFinalized = () => {
        isWizardFinalizedRef.current = true;
        setIsWizardFinalized(true);
    };

    const cleanupCreatedStore = useCallback(
        async ({
            resetState = true,
            silent = false,
        }: { resetState?: boolean; silent?: boolean } = {}): Promise<boolean> => {
            const targetStoreId = storeIdRef.current;
            if (!targetStoreId || isWizardFinalizedRef.current) {
                return true;
            }

            if (isCleanupInFlightRef.current) {
                return false;
            }

            isCleanupInFlightRef.current = true;

            const tryDeleteStore = async (): Promise<boolean> => {
                const deleteStoreResponse = await storeApi.deleteStore(targetStoreId);
                const deletedStore = parseApiResult<null>(deleteStoreResponse);
                if (deletedStore.success) {
                    return true;
                }
                const code = deletedStore.error?.code ?? "";
                if (code === "STORE_NOT_FOUND" || code === "404") {
                    return true;
                }
                return false;
            };

            let deleted = await tryDeleteStore();
            if (!deleted) {
                const deleteTemplateResponse = await storeApi.deleteShiftTemplate(targetStoreId);
                const deletedTemplate = parseApiResult<null>(deleteTemplateResponse);
                if (!deletedTemplate.success) {
                    const code = deletedTemplate.error?.code ?? "";
                    if (code !== "TEMPLATE_NOT_FOUND" && code !== "404") {
                        if (!silent) {
                            setSubmitError(
                                deletedTemplate.error?.message ??
                                    "생성 중 데이터 삭제에 실패했습니다."
                            );
                        }
                        isCleanupInFlightRef.current = false;
                        return false;
                    }
                }

                deleted = await tryDeleteStore();
            }

            isCleanupInFlightRef.current = false;
            if (!deleted) {
                if (!silent) {
                    setSubmitError("생성 중 데이터 삭제에 실패했습니다.");
                }
                return false;
            }

            storeIdRef.current = null;
            if (resetState) {
                setStoreId(null);
                setTemplateRows([]);
                setSelectedTypeRows([]);
                setStaffingByTemplateId({});
                setTemplateNamesById({});
            }
            return true;
        },
        []
    );

    const confirmExitAndCleanup = useCallback(async (): Promise<boolean> => {
        if (!storeIdRef.current || isWizardFinalizedRef.current) {
            return true;
        }

        const shouldLeave = await showConfirmAlert({
            title: "매장 생성 중단",
            text: "이동하면 기존 데이터는 삭제됩니다. 계속하시겠습니까?",
            confirmButtonText: "이동",
            cancelButtonText: "취소",
        });

        if (!shouldLeave) {
            return false;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        const cleaned = await cleanupCreatedStore();
        setIsSubmitting(false);
        return cleaned;
    }, [cleanupCreatedStore]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!storeIdRef.current || isWizardFinalizedRef.current) {
                return;
            }
            event.preventDefault();
            event.returnValue = "이동하면 기존 데이터는 삭제됩니다.";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (!storeIdRef.current || isWizardFinalizedRef.current) {
                return;
            }
            void cleanupCreatedStore({ resetState: false, silent: true });
        };
    }, [cleanupCreatedStore]);

    useEffect(() => {
        const handleInternalLinkClick = (event: MouseEvent) => {
            if (!storeIdRef.current || isWizardFinalizedRef.current) {
                return;
            }
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const target = event.target as HTMLElement | null;
            const anchor = target?.closest("a[href]");
            if (!anchor) {
                return;
            }

            const rawHref = anchor.getAttribute("href");
            if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
                return;
            }

            const url = new URL(rawHref, window.location.origin);
            if (url.origin !== window.location.origin) {
                return;
            }

            const nextPath = `${url.pathname}${url.search}${url.hash}`;
            const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (nextPath === currentPath) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            void (async () => {
                const canLeave = await confirmExitAndCleanup();
                if (canLeave) {
                    router.push(nextPath);
                }
            })();
        };

        document.addEventListener("click", handleInternalLinkClick, true);
        return () => {
            document.removeEventListener("click", handleInternalLinkClick, true);
        };
    }, [confirmExitAndCleanup, router]);

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

    const ensureStoreCreated = async (): Promise<string | null> => {
        if (storeId) {
            return storeId;
        }

        const createStoreResponse = await storeApi.createWizardStore({
            name: data.storeName.trim(),
            location: data.location.trim() || undefined,
            openTime: data.openTime,
            closeTime: data.closeTime,
            nShifts: data.shiftsPerDay,
            brn: formatBizno(data.businessId),
            alias: data.alias.trim() || undefined,
            monthlySales: data.monthlySales.trim() ? Number(data.monthlySales) : undefined,
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
            return null;
        }

        const createdStoreId = String(createdStore.data.id);
        setStoreId(createdStoreId);
        return createdStoreId;
    };

    const loadTemplateRows = async (targetStoreId: string): Promise<boolean> => {
        const templateResponse = await storeApi.getShiftTemplate(targetStoreId);
        const templateResult = parseApiResult<unknown>(templateResponse);

        if (!templateResult.success) {
            setSubmitError(templateResult.error?.message ?? "템플릿 조회에 실패했습니다.");
            return false;
        }

        setTemplateRows(parseTemplateRows(templateResult.data));
        return true;
    };

    const loadSelectedTypeRows = async (targetStoreId: string): Promise<boolean> => {
        const templateByTypeResponse = await storeApi.getShiftTemplateByType(targetStoreId);
        const templateByTypeResult = parseApiResult<unknown>(templateByTypeResponse);

        if (!templateByTypeResult.success) {
            setSubmitError(
                templateByTypeResult.error?.message ?? "선택된 타입의 템플릿 조회에 실패했습니다."
            );
            return false;
        }

        const parsedRows = sortTemplatesByStart(parseTemplateRows(templateByTypeResult.data));
        setSelectedTypeRows(parsedRows);
        setStaffingByTemplateId((prev) =>
            buildInitialStaffingByTemplateId(parsedRows, prev, data.staffing)
        );
        setTemplateNamesById((prev) => buildInitialTemplateNamesById(parsedRows, prev));
        return true;
    };

    const submitWizard = async () => {
        if (!storeId) {
            setSubmitError("매장 정보가 없습니다. 3단계부터 다시 진행해 주세요.");
            return;
        }

        if (selectedTypeRows.length === 0) {
            setSubmitError("선택된 타입의 시프트가 없습니다. 4단계에서 다시 선택해 주세요.");
            return;
        }

        const invalidTemplate = selectedTypeRows.find((template) => {
            const count = staffingByTemplateId[template.id];
            return !Number.isFinite(count) || count < 1;
        });
        if (invalidTemplate) {
            setSubmitError("모든 시프트의 선호 인원을 1명 이상 입력해 주세요.");
            return;
        }

        const invalidNameTemplate = selectedTypeRows.find((template, index) => {
            const name = templateNamesById[template.id] ?? getDefaultTemplateName(template, index);
            return name.trim().length === 0;
        });
        if (invalidNameTemplate) {
            setSubmitError("모든 시프트의 이름을 입력해 주세요.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        for (const [index, template] of selectedTypeRows.entries()) {
            const candidateName =
                templateNamesById[template.id] ?? getDefaultTemplateName(template, index);
            const shiftName = candidateName.trim();

            const response = await storeApi.updateTemplateStaff(storeId, template.id, {
                requiredStaff: staffingByTemplateId[template.id],
                name: shiftName,
            });
            const updated = parseApiResult<unknown>(response);
            if (!updated.success) {
                setSubmitError(updated.error?.message ?? "시프트 인원 설정에 실패했습니다.");
                setIsSubmitting(false);
                return;
            }
        }

        const cleanupResponse = await storeApi.deleteOtherTemplateTypes(storeId);
        const cleanup = parseApiResult<null>(cleanupResponse);

        if (!cleanup.success) {
            const code = cleanup.error?.code ?? "";

            if (code === "500" || code === "INTERNAL_SERVER_ERROR") {
                await showWarningAlert(
                    "일부 처리 실패",
                    "매장은 생성되었지만 템플릿 정리 중 오류가 발생했습니다. 관리자에게 문의해 주세요."
                );
                markWizardFinalized();
                router.push("/dashboard");
                return;
            }

            setSubmitError(cleanup.error?.message ?? "템플릿 정리에 실패했습니다.");
            setIsSubmitting(false);
            return;
        }

        await showSuccessAlert("생성 완료", "매장과 시프트 템플릿이 생성되었습니다.");
        markWizardFinalized();
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

        if (currentStep === "logic") {
            return data.templateType === "COSTSAVER" || data.templateType === "HIGHSERVICE";
        }

        if (currentStep === "staffing") {
            return (
                selectedTypeRows.length > 0 &&
                selectedTypeRows.every((template, index) => {
                    const count = staffingByTemplateId[template.id];
                    const name =
                        templateNamesById[template.id] ?? getDefaultTemplateName(template, index);
                    return Number.isFinite(count) && count >= 1 && Boolean(name?.trim());
                })
            );
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
        data.templateType,
        selectedTypeRows,
        staffingByTemplateId,
        templateNamesById,
    ]);

    const goPrev = async () => {
        if (isSubmitting) {
            return;
        }

        if (isFirstStep) {
            const canLeave = await confirmExitAndCleanup();
            if (!canLeave) {
                return;
            }
            router.push("/dashboard");
            return;
        }

        setCurrentStep(visibleSteps[currentStepIndex - 1]);
    };

    const goNext = async () => {
        if (isSubmitting) {
            return;
        }

        if (currentStep === "peak") {
            setIsSubmitting(true);
            setSubmitError(null);

            const createdStoreId = await ensureStoreCreated();
            if (!createdStoreId) {
                setIsSubmitting(false);
                return;
            }

            const deleteTemplateResponse = await storeApi.deleteShiftTemplate(createdStoreId);
            const deletedTemplate = parseApiResult<null>(deleteTemplateResponse);
            if (!deletedTemplate.success) {
                const code = deletedTemplate.error?.code ?? "";
                if (code !== "TEMPLATE_NOT_FOUND" && code !== "404") {
                    setSubmitError(
                        deletedTemplate.error?.message ??
                            "기존 템플릿 정리 중 오류가 발생했습니다."
                    );
                    setIsSubmitting(false);
                    return;
                }
            }

            const templateCreateResponse = await storeApi.createShiftTemplate(createdStoreId, {
                peak: data.peakTimeEnabled,
                peakStartTime: data.peakTimeEnabled ? data.peakStart : undefined,
                peakEndTime: data.peakTimeEnabled ? data.peakEnd : undefined,
            });

            const templateCreated = parseApiResult<null>(templateCreateResponse);
            if (!templateCreated.success) {
                const code = templateCreated.error?.code ?? "";
                if (code === "INVALID_TIME_RANGE") {
                    setSubmitError("피크 시작 시간은 종료 시간보다 빨라야 합니다.");
                } else {
                    setSubmitError(
                        templateCreated.error?.message ?? "템플릿 생성 중 오류가 발생했습니다."
                    );
                }
                setIsSubmitting(false);
                return;
            }

            const loaded = await loadTemplateRows(createdStoreId);
            if (!loaded) {
                setIsSubmitting(false);
                return;
            }

            setCurrentStep("logic");
            setIsSubmitting(false);
            return;
        }

        if (currentStep === "logic") {
            setIsSubmitting(true);
            setSubmitError(null);

            const createdStoreId = await ensureStoreCreated();
            if (!createdStoreId) {
                setIsSubmitting(false);
                return;
            }

            const typeUpdateResponse = await storeApi.updateTemplateType(createdStoreId, {
                templateType: data.templateType,
            });
            const typeUpdated = parseApiResult<null>(typeUpdateResponse);

            if (!typeUpdated.success) {
                setSubmitError(typeUpdated.error?.message ?? "템플릿 타입 설정에 실패했습니다.");
                setIsSubmitting(false);
                return;
            }

            const loaded = await loadSelectedTypeRows(createdStoreId);
            if (!loaded) {
                setIsSubmitting(false);
                return;
            }

            setCurrentStep("staffing");
            setIsSubmitting(false);
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
                                <WizardStep3ShiftLogic
                                    data={data}
                                    onChange={handlePatch}
                                    templatesByType={templatesByType}
                                />
                            )}
                            {currentStep === "staffing" && (
                                <WizardStep4Staffing
                                    templates={selectedTypeRows}
                                    selectedTemplateType={data.templateType}
                                    staffingByTemplateId={staffingByTemplateId}
                                    onStaffingChange={handleStaffingChange}
                                    templateNamesById={templateNamesById}
                                    onTemplateNameChange={handleTemplateNameChange}
                                />
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
