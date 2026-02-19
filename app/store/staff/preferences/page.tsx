"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/Button";
import { storeApi } from "@/lib/api/stores";

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    } | null;
};

type TemplateType = "COSTSAVER" | "HIGHSERVICE";
type ShiftType = "NORMAL" | "PEAK";

type TemplateResDto = {
    id?: number;
    templateId?: number;
    templateType: TemplateType | null;
    shiftType: ShiftType;
    name: string | null;
    startTime: string;
    endTime: string;
};

type ExistingPreferenceResDto = {
    id?: number;
    preferenceId?: number;
    dayOfWeek: DayOfWeek;
    name?: string;
    preferenceType?: PreferenceType;
    type?: PreferenceType;
    startTime?: string;
    endTime?: string;
    templateId?: number;
};

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

type PreferenceType = "UNAVAILABLE" | "NATURAL" | "PREFERRED";

type PreferenceValue = PreferenceType | null;

type ShiftTemplate = {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    icon: string;
    iconTone: string;
};

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

const DAY_META: Array<{ dayOfWeek: DayOfWeek; label: string; dateLabel: string }> = [
    { dayOfWeek: "MONDAY", label: "월요일", dateLabel: "MON" },
    { dayOfWeek: "TUESDAY", label: "화요일", dateLabel: "TUE" },
    { dayOfWeek: "WEDNESDAY", label: "수요일", dateLabel: "WED" },
    { dayOfWeek: "THURSDAY", label: "목요일", dateLabel: "THU" },
    { dayOfWeek: "FRIDAY", label: "금요일", dateLabel: "FRI" },
    { dayOfWeek: "SATURDAY", label: "토요일", dateLabel: "SAT" },
    { dayOfWeek: "SUNDAY", label: "일요일", dateLabel: "SUN" },
];

const optionMeta: {
    value: PreferenceType;
    label: string;
    icon: string;
    iconTone: string;
}[] = [
    { value: "UNAVAILABLE", label: "No", icon: "block", iconTone: "text-red-500" },
    {
        value: "NATURAL",
        label: "Neutral",
        icon: "sentiment_neutral",
        iconTone: "text-slate-500",
    },
    {
        value: "PREFERRED",
        label: "Love",
        icon: "star",
        iconTone: "text-green-500",
    },
];

const selectedStyleByValue: Record<PreferenceType, string> = {
    UNAVAILABLE: "bg-red-500 text-white shadow-sm",
    NATURAL: "bg-slate-500 text-white shadow-sm",
    PREFERRED: "bg-green-500 text-white shadow-sm",
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    }
    return typeof (value as { success?: unknown }).success === "boolean";
};

const isTemplateResDto = (value: unknown): value is TemplateResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<TemplateResDto>;

    return (
        (typeof candidate.id === "number" ||
            typeof candidate.templateId === "number" ||
            candidate.id === undefined) &&
        (candidate.templateType === "COSTSAVER" ||
            candidate.templateType === "HIGHSERVICE" ||
            candidate.templateType === null) &&
        (candidate.shiftType === "NORMAL" || candidate.shiftType === "PEAK") &&
        (typeof candidate.name === "string" || candidate.name === null) &&
        typeof candidate.startTime === "string" &&
        typeof candidate.endTime === "string"
    );
};

const isExistingPreferenceResDto = (
    value: unknown
): value is ExistingPreferenceResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ExistingPreferenceResDto>;

    return (
        (typeof candidate.id === "number" ||
            typeof candidate.preferenceId === "number" ||
            candidate.id === undefined) &&
        (candidate.dayOfWeek === "MONDAY" ||
            candidate.dayOfWeek === "TUESDAY" ||
            candidate.dayOfWeek === "WEDNESDAY" ||
            candidate.dayOfWeek === "THURSDAY" ||
            candidate.dayOfWeek === "FRIDAY" ||
            candidate.dayOfWeek === "SATURDAY" ||
            candidate.dayOfWeek === "SUNDAY") &&
        (typeof candidate.name === "string" || candidate.name === undefined) &&
        (typeof candidate.startTime === "string" || candidate.startTime === undefined) &&
        (typeof candidate.endTime === "string" || candidate.endTime === undefined)
    );
};

const parseTemplateData = (rawData: unknown): TemplateResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isTemplateResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isTemplateResDto);
    }

    return [];
};

const parseExistingPreferenceData = (rawData: unknown): ExistingPreferenceResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isExistingPreferenceResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isExistingPreferenceResDto);
    }

    return [];
};

const formatTime = (value: string): string => {
    const [hour, minute] = value.split(":");
    if (!hour || !minute) {
        return value;
    }
    return `${hour}:${minute}`;
};

const parseTimeToMinutes = (value: string): number => {
    const [hourText = "0", minuteText = "0"] = value.split(":");
    return Number(hourText) * 60 + Number(minuteText);
};

const getShiftIcon = (startTime: string): { icon: string; iconTone: string } => {
    const hour = Number(startTime.split(":")[0]);
    if (hour < 12) {
        return {
            icon: "light_mode",
            iconTone: "bg-orange-100 text-orange-600",
        };
    }
    if (hour < 17) {
        return {
            icon: "wb_sunny",
            iconTone: "bg-blue-100 text-blue-600",
        };
    }
    return {
        icon: "dark_mode",
        iconTone: "bg-indigo-100 text-indigo-600",
    };
};

const getErrorCode = (error: {
    code: string;
    details?: Record<string, unknown>;
}): string => {
    if (error.details && typeof error.details.code === "string") {
        return error.details.code;
    }

    if (
        error.details &&
        typeof error.details.error === "object" &&
        error.details.error !== null &&
        "code" in error.details.error &&
        typeof (error.details.error as { code?: unknown }).code === "string"
    ) {
        return (error.details.error as { code: string }).code;
    }

    return error.code;
};

const getKey = (dayOfWeek: DayOfWeek, templateId: number): string =>
    `${dayOfWeek}-${templateId}`;

function StaffPreferencePageContent() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const memberId =
        searchParams.get("memberId") || searchParams.get("employeeId") || "";
    const employeeName = searchParams.get("employeeName") || "직원";
    const storeName = STORE_NAMES[storeId] || `매장 ${storeId}`;

    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [preferences, setPreferences] = useState<Record<string, PreferenceValue>>({});
    const [existingPreferenceIds, setExistingPreferenceIds] = useState<
        Record<string, number>
    >({});
    const [hasPersistedPreference, setHasPersistedPreference] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchInitialData = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            setNoticeMessage(null);

            if (!/^\d+$/.test(storeId)) {
                setErrorMessage("유효하지 않은 매장 ID입니다.");
                setIsLoading(false);
                return;
            }

            const templateResponse = await storeApi.getShiftTemplate(storeId);
            if (!templateResponse.success) {
                const code = templateResponse.error
                    ? getErrorCode(templateResponse.error)
                    : "";

                if (code === "TEMPLATE_NOT_FOUND" || code === "404") {
                    setTemplates([]);
                    setPreferences({});
                    setExistingPreferenceIds({});
                    setNoticeMessage("해당 매장에 등록된 시프트 템플릿이 없습니다.");
                    setIsLoading(false);
                    return;
                }

                if (code === "INVALID_REQUEST" || code === "400") {
                    setErrorMessage("요청 값이 올바르지 않습니다.");
                } else {
                    setErrorMessage(
                        templateResponse.error?.message ??
                            "시프트 템플릿을 불러오지 못했습니다."
                    );
                }
                setIsLoading(false);
                return;
            }

            const templateData = parseTemplateData(templateResponse.data as unknown)
                .map((template, index) => {
                    const id =
                        typeof template.id === "number"
                            ? template.id
                            : typeof template.templateId === "number"
                              ? template.templateId
                              : index + 1;
                    const icon = getShiftIcon(template.startTime);
                    const start = formatTime(template.startTime);
                    const end = formatTime(template.endTime);

                    return {
                        id,
                        name: template.name?.trim() || `Shift ${index + 1}`,
                        startTime: start,
                        endTime: end,
                        icon: icon.icon,
                        iconTone: icon.iconTone,
                    };
                })
                .sort(
                    (a, b) =>
                        parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
                );

            const initializedPreferences: Record<string, PreferenceValue> = {};
            DAY_META.forEach((day) => {
                templateData.forEach((template) => {
                    initializedPreferences[getKey(day.dayOfWeek, template.id)] = null;
                });
            });

            const idsByKey: Record<string, number> = {};
            const populatedPreferences = { ...initializedPreferences };
            let foundPersistedPreference = false;

            if (/^\d+$/.test(memberId)) {
                const existingResponse = await storeApi.getMemberPreferences(
                    storeId,
                    memberId
                );

                if (existingResponse.success) {
                    const existing = parseExistingPreferenceData(
                        existingResponse.data as unknown
                    );
                    foundPersistedPreference = existing.length > 0;

                    existing.forEach((item) => {
                        const matchedTemplate =
                            typeof item.templateId === "number"
                                ? templateData.find((tpl) => tpl.id === item.templateId) ?? null
                                : templateData.find((tpl) => {
                                      const byName =
                                          typeof item.name === "string" &&
                                          item.name.trim().length > 0 &&
                                          tpl.name.trim() === item.name.trim();
                                      const byTime =
                                          typeof item.startTime === "string" &&
                                          typeof item.endTime === "string" &&
                                          tpl.startTime === formatTime(item.startTime) &&
                                          tpl.endTime === formatTime(item.endTime);
                                      return byName || byTime;
                                  }) ?? null;

                        const templateId = matchedTemplate?.id ?? null;
                        const preferenceId =
                            typeof item.preferenceId === "number"
                                ? item.preferenceId
                                : typeof item.id === "number"
                                  ? item.id
                                  : null;
                        const type = item.preferenceType ?? item.type ?? null;

                        if (!templateId || !type) {
                            return;
                        }

                        const key = getKey(item.dayOfWeek, templateId);
                        if (!(key in populatedPreferences)) {
                            return;
                        }

                        populatedPreferences[key] = type;
                        if (preferenceId) {
                            idsByKey[key] = preferenceId;
                        }
                    });
                }
            }

            if (!cancelled) {
                setTemplates(templateData);
                setPreferences(populatedPreferences);
                setExistingPreferenceIds(idsByKey);
                setHasPersistedPreference(foundPersistedPreference);
                setIsLoading(false);
            }
        };

        void fetchInitialData();

        return () => {
            cancelled = true;
        };
    }, [storeId, memberId]);

    const preferredCount = useMemo(
        () => Object.values(preferences).filter((value) => value === "PREFERRED").length,
        [preferences]
    );

    const totalPreferredHours = useMemo(() => {
        let hours = 0;

        DAY_META.forEach((day) => {
            templates.forEach((template) => {
                const key = getKey(day.dayOfWeek, template.id);
                if (preferences[key] === "PREFERRED") {
                    hours +=
                        (parseTimeToMinutes(template.endTime) -
                            parseTimeToMinutes(template.startTime)) /
                        60;
                }
            });
        });

        return Math.max(0, hours);
    }, [preferences, templates]);

    const setPreference = (
        dayOfWeek: DayOfWeek,
        templateId: number,
        value: PreferenceType
    ) => {
        const key = getKey(dayOfWeek, templateId);

        setPreferences((prev) => ({
            ...prev,
            [key]: prev[key] === value ? null : value,
        }));
    };

    const setDayPreference = (dayOfWeek: DayOfWeek, value: PreferenceType) => {
        setPreferences((prev) => {
            const next = { ...prev };
            templates.forEach((template) => {
                next[getKey(dayOfWeek, template.id)] = value;
            });
            return next;
        });
    };

    const handleSubmit = async () => {
        setErrorMessage(null);
        setNoticeMessage(null);

        if (!/^\d+$/.test(storeId) || !/^\d+$/.test(memberId)) {
            setErrorMessage("매장 또는 멤버 정보가 올바르지 않습니다.");
            return;
        }

        const selectedEntries = DAY_META.flatMap((day) =>
            templates
                .map((template) => {
                    const key = getKey(day.dayOfWeek, template.id);
                    const value = preferences[key];
                    if (!value) {
                        return null;
                    }

                    return {
                        key,
                        dayOfWeek: day.dayOfWeek,
                        templateId: template.id,
                        preferenceType: value,
                    };
                })
                .filter(
                    (
                        item
                    ): item is {
                        key: string;
                        dayOfWeek: DayOfWeek;
                        templateId: number;
                        preferenceType: PreferenceType;
                    } => item !== null
                )
        );

        if (selectedEntries.length === 0) {
            setErrorMessage("최소 1개 이상의 선호도를 선택해 주세요.");
            return;
        }

        setIsSubmitting(true);

        if (hasPersistedPreference) {
            const updateTargets = selectedEntries.filter(
                (entry) => typeof existingPreferenceIds[entry.key] === "number"
            );

            if (updateTargets.length !== selectedEntries.length) {
                setErrorMessage(
                    "기존 선호도 수정에 필요한 preferenceId가 조회되지 않았습니다. 선호 조회 응답에 preferenceId(id) 필드가 필요합니다."
                );
                setIsSubmitting(false);
                return;
            }

            const updateResults = await Promise.all(
                updateTargets.map((entry) =>
                    storeApi.updateMemberPreference(
                        storeId,
                        memberId,
                        existingPreferenceIds[entry.key],
                        { preferenceType: entry.preferenceType }
                    )
                )
            );

            const failed = updateResults.find((result) => !result.success);
            if (failed && failed.error) {
                const code = getErrorCode(failed.error);
                if (code === "NOT_AUTHORIZED" || code === "403") {
                    setErrorMessage("선호도 수정 권한이 없습니다.");
                } else if (code === "PREFERENCE_NOT_FOUND") {
                    setErrorMessage("수정할 선호 정보를 찾을 수 없습니다.");
                } else if (code === "STORE_MEMBER_NOT_FOUND") {
                    setErrorMessage("매장 멤버 정보를 찾을 수 없습니다.");
                } else if (code === "INVALID_REQUEST" || code === "400") {
                    setErrorMessage("선호도 값이 올바르지 않습니다.");
                } else {
                    setErrorMessage(
                        failed.error.message ?? "선호도 수정 중 오류가 발생했습니다."
                    );
                }
                setIsSubmitting(false);
                return;
            }

            setNoticeMessage("기존 선호도를 수정했습니다.");
            setIsSubmitting(false);
            return;
        }

        const createResponse = await storeApi.createMemberPreferences(storeId, memberId, {
            preference: selectedEntries.map((entry) => ({
                dayOfWeek: entry.dayOfWeek,
                type: entry.preferenceType,
                templateId: entry.templateId,
            })),
        });

        if (!createResponse.success) {
            const code = createResponse.error ? getErrorCode(createResponse.error) : "";

            if (code === "NOT_AUTHORIZED" || code === "403") {
                setErrorMessage("선호도 생성 권한이 없습니다.");
            } else if (code === "PREFERENCE_ALREADY_EXISTS" || code === "409") {
                setErrorMessage(
                    "이미 선호정보가 존재합니다. 새로고침 후 다시 수정해 주세요."
                );
            } else if (code === "TEMPLATE_NOT_FOUND") {
                setErrorMessage("요청한 템플릿 정보를 찾을 수 없습니다.");
            } else if (code === "STORE_MEMBER_NOT_FOUND") {
                setErrorMessage("매장 멤버 정보를 찾을 수 없습니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                setErrorMessage("입력한 선호도 값이 올바르지 않습니다.");
            } else {
                setErrorMessage(
                    createResponse.error?.message ?? "선호도 생성 중 오류가 발생했습니다."
                );
            }

            setIsSubmitting(false);
            return;
        }

        setNoticeMessage("선호도를 생성했습니다.");
        setIsSubmitting(false);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6 pb-40">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link
                                href={`/store/staff?storeId=${storeId}`}
                                className="text-primary hover:underline"
                            >
                                직원 관리
                            </Link>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                                선호 시프트 설정
                            </span>
                        </nav>

                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                    {employeeName} 선호 시프트
                                </h2>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {storeName} · 요일별 선호도를 설정하세요.
                                </p>
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
                                    <span className="material-icons text-sm">schedule</span>
                                    {hasPersistedPreference
                                        ? "기존 선호도를 불러왔습니다."
                                        : "아직 선호도가 없습니다. 새로 입력해 주세요."}
                                </div>
                            </div>
                            <Button variant="secondary" className="gap-2">
                                <span className="material-icons text-sm">help_outline</span>
                                Help Guide
                            </Button>
                        </div>

                        {isLoading && (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
                                템플릿/선호 데이터를 불러오는 중입니다...
                            </div>
                        )}

                        {!isLoading && errorMessage && (
                            <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-300">
                                {errorMessage}
                            </div>
                        )}

                        {!isLoading && noticeMessage && (
                            <div className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300">
                                {noticeMessage}
                            </div>
                        )}

                        {!isLoading && templates.length === 0 && !errorMessage && (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
                                등록된 시프트 템플릿이 없습니다.
                            </div>
                        )}

                        {!isLoading && templates.length > 0 && (
                            <div className="space-y-8">
                                {DAY_META.map((day) => (
                                    <section key={day.dayOfWeek}>
                                        <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {day.label}
                                                </h3>
                                                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                                    {day.dateLabel}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {optionMeta.map((option) => (
                                                    <button
                                                        key={`${day.dayOfWeek}-${option.value}-all`}
                                                        type="button"
                                                        onClick={() =>
                                                            setDayPreference(
                                                                day.dayOfWeek,
                                                                option.value
                                                            )
                                                        }
                                                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        {day.label} 전체 {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {templates.map((template) => {
                                                const key = getKey(day.dayOfWeek, template.id);
                                                const selected = preferences[key];
                                                const hours =
                                                    (parseTimeToMinutes(template.endTime) -
                                                        parseTimeToMinutes(template.startTime)) /
                                                    60;

                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`size-10 flex items-center justify-center rounded-lg ${template.iconTone}`}
                                                            >
                                                                <span className="material-icons">
                                                                    {template.icon}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    {template.name}
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    {template.startTime} - {template.endTime} · {hours} Hours
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                                                            {optionMeta.map((option) => {
                                                                const isSelected =
                                                                    selected === option.value;

                                                                return (
                                                                    <button
                                                                        key={option.value}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPreference(
                                                                                day.dayOfWeek,
                                                                                template.id,
                                                                                option.value
                                                                            )
                                                                        }
                                                                        className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                                                                            isSelected
                                                                                ? selectedStyleByValue[
                                                                                      option.value
                                                                                  ]
                                                                                : "hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                        }`}
                                                                    >
                                                                        <span
                                                                            className={`material-icons text-base ${
                                                                                isSelected
                                                                                    ? "text-white"
                                                                                    : option.iconTone
                                                                            }`}
                                                                        >
                                                                            {option.icon}
                                                                        </span>
                                                                        <span className="hidden sm:inline">
                                                                            {option.label}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="fixed bottom-0 right-0 left-0 md:left-64 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                                <span className="material-icons">done_all</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                                    Total Preferred: {preferredCount} Shifts
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    예상 선호 근무시간: {totalPreferredHours}시간
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="secondary" className="w-full md:w-auto">
                                임시 저장
                            </Button>
                            <Button
                                className="w-full md:w-auto gap-2"
                                onClick={() => void handleSubmit()}
                                disabled={isSubmitting || isLoading || templates.length === 0}
                            >
                                {isSubmitting ? "저장 중..." : "선호도 제출"}
                                <span className="material-icons text-sm">send</span>
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default function StaffPreferencePage() {
  return (
    <Suspense fallback={null}>
      <StaffPreferencePageContent />
    </Suspense>
  );
}
