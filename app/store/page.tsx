"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { storeApi } from "@/lib/api/stores";
import Swal from "sweetalert2";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ApiError = {
    code: string;
    message: string;
    details: unknown[];
};

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error: ApiError | null;
};

type TemplateType = "COSTSAVER" | "HIGHSERVICE";
type ShiftType = "NORMAL" | "PEAK";

type TemplateResDto = {
    templateType: TemplateType | null;
    shiftType: ShiftType;
    name: string | null;
    startTime: string;
    endTime: string;
};

type ScheduleResDto = {
    memberName: string;
    workDate: string;
    startTime: string;
    endTime: string;
    templateName: string | null;
};

type StoreMemberListResDto = {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    role: string;
};

type StoreDetailResDto = {
    id: number;
    name: string;
    imageUrl: string | null;
};

type ShiftTone = "emerald" | "amber" | "sky";

type WeekDay = {
    label: string;
    date: string;
    dateKey: string;
    highlight: boolean;
};

type RosterRow = {
    key: string;
    name: string;
    shiftType: ShiftType | null;
    templateType: TemplateType | null;
    startTime: string;
    endTime: string;
    time: string;
    tone: ShiftTone;
    cells: string[][];
};

const badgeStyleByTone: Record<ShiftTone, string> = {
    emerald:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50",
    amber:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50",
    sky:
        "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800/50",
};

const dotStyleByTone: Record<ShiftTone, string> = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
};

const isTemplateResDto = (value: unknown): value is TemplateResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<TemplateResDto>;

    return (
        (candidate.templateType === "COSTSAVER" ||
            candidate.templateType === "HIGHSERVICE" ||
            candidate.templateType === null) &&
        (candidate.shiftType === "NORMAL" || candidate.shiftType === "PEAK") &&
        (typeof candidate.name === "string" || candidate.name === null) &&
        typeof candidate.startTime === "string" &&
        typeof candidate.endTime === "string"
    );
};

const isScheduleResDto = (value: unknown): value is ScheduleResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ScheduleResDto>;

    return (
        typeof candidate.memberName === "string" &&
        typeof candidate.workDate === "string" &&
        typeof candidate.startTime === "string" &&
        typeof candidate.endTime === "string" &&
        (typeof candidate.templateName === "string" || candidate.templateName === null)
    );
};

const isStoreMemberListResDto = (value: unknown): value is StoreMemberListResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<StoreMemberListResDto>;

    return (
        typeof candidate.id === "number" &&
        typeof candidate.userId === "number" &&
        typeof candidate.userName === "string" &&
        typeof candidate.userEmail === "string" &&
        typeof candidate.role === "string"
    );
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return typeof (value as { success?: unknown }).success === "boolean";
};

const parseStoreMemberData = (rawData: unknown): StoreMemberListResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isStoreMemberListResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isStoreMemberListResDto);
    }

    return [];
};

const parseStoreDetailData = (rawData: unknown): StoreDetailResDto | null => {
    const payload =
        rawData && typeof rawData === "object" && "data" in rawData
            ? (rawData as { data: unknown }).data
            : rawData;

    if (!payload || typeof payload !== "object") {
        return null;
    }

    const candidate = payload as Partial<StoreDetailResDto>;
    if (typeof candidate.id !== "number" || typeof candidate.name !== "string") {
        return null;
    }

    return {
        id: candidate.id,
        name: candidate.name,
        imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : null,
    };
};

const MAX_STORE_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_STORE_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg"];

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    const parts = token.split(".");
    if (parts.length < 2) {
        return null;
    }

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        return JSON.parse(atob(normalized)) as Record<string, unknown>;
    } catch {
        return null;
    }
};

const getIdentityFromToken = (token: string): { userId: string | null; email: string | null } => {
    const payload = decodeJwtPayload(token);
    if (!payload) {
        return { userId: null, email: null };
    }

    const idKeys = ["userId", "id", "uid", "memberId"];
    for (const key of idKeys) {
        const value = payload[key];
        if (typeof value === "number") {
            return { userId: String(value), email: null };
        }
        if (typeof value === "string" && /^\d+$/.test(value.trim())) {
            return { userId: value.trim(), email: null };
        }
    }

    const sub = payload.sub;
    if (typeof sub === "string" && /^\d+$/.test(sub.trim())) {
        return { userId: sub.trim(), email: null };
    }

    const emailKeys = ["email", "userEmail", "sub"];
    for (const key of emailKeys) {
        const value = payload[key];
        if (typeof value === "string" && value.includes("@")) {
            return { userId: null, email: value.toLowerCase() };
        }
    }

    return { userId: null, email: null };
};

const isManagerRole = (role: string): boolean => {
    const normalized = role.toUpperCase();
    return normalized === "OWNER" || normalized === "MANAGER" || normalized === "ADMIN";
};

const formatTime = (value: string): string => {
    const [hour, minute] = value.split(":");
    if (!hour || !minute) {
        return value;
    }
    return `${hour}:${minute}`;
};

const getTone = (
    templateType: TemplateType | null,
    shiftType: ShiftType | null
): ShiftTone => {
    if (shiftType === "PEAK") {
        return "sky";
    }
    if (templateType === "HIGHSERVICE") {
        return "amber";
    }
    return "emerald";
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

const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string): Date => {
    return new Date(`${dateKey}T00:00:00`);
};

const getWeekStartDate = (baseDate: Date): string => {
    const date = new Date(baseDate);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset);
    return formatDateKey(date);
};

const addDays = (dateKey: string, amount: number): string => {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + amount);
    return formatDateKey(date);
};

const parseTimeToMinutes = (value: string): number => {
    const [hourText, minuteText] = value.split(":");
    return Number(hourText) * 60 + Number(minuteText);
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

const parseScheduleData = (rawData: unknown): ScheduleResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isScheduleResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isScheduleResDto);
    }

    return [];
};

function StoreMainPageContent() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [weekStartDate, setWeekStartDate] = useState(() =>
        getWeekStartDate(new Date())
    );
    const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
    const [scheduleItems, setScheduleItems] = useState<ScheduleResDto[]>([]);
    const [canManageSchedule, setCanManageSchedule] = useState(false);
    const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
    const [isAutoGeneratingSchedule, setIsAutoGeneratingSchedule] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [displayStoreName, setDisplayStoreName] = useState(storeName);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [storeImageUrl, setStoreImageUrl] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [isImageDeleting, setIsImageDeleting] = useState(false);
    const [isImageDragOver, setIsImageDragOver] = useState(false);

    const weekDays = useMemo<WeekDay[]>(() => {
        const start = parseDateKey(weekStartDate);
        const todayKey = formatDateKey(new Date());

        return DAY_LABELS.map((label, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);

            const dateKey = formatDateKey(date);

            return {
                label,
                date: String(date.getDate()).padStart(2, "0"),
                dateKey,
                highlight: dateKey === todayKey,
            };
        });
    }, [weekStartDate]);

    const weekRangeLabel = useMemo(() => {
        const weekEndDate = addDays(weekStartDate, 6);
        return `${weekStartDate} (월) ~ ${weekEndDate} (일)`;
    }, [weekStartDate]);

    useEffect(() => {
        setDisplayStoreName(storeName);
    }, [storeName]);

    useEffect(() => {
        let cancelled = false;

        const fetchStoreDetail = async () => {
            if (!/^\d+$/.test(storeId)) {
                return;
            }

            const response = await storeApi.getStore(storeId);
            if (!response.success) {
                return;
            }

            const storeDetail = parseStoreDetailData(response.data as unknown);
            if (!storeDetail || cancelled) {
                return;
            }

            setDisplayStoreName(storeDetail.name);
            setStoreImageUrl(storeDetail.imageUrl);
            setImagePreviewUrl((prev) => {
                if (prev && prev.startsWith("blob:")) {
                    URL.revokeObjectURL(prev);
                }
                return storeDetail.imageUrl;
            });
        };

        void fetchStoreDetail();
        return () => {
            cancelled = true;
        };
    }, [storeId, reloadKey]);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    useEffect(() => {
        const fetchRoster = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            if (!/^\d+$/.test(storeId)) {
                setErrorMessage("유효하지 않은 매장 ID입니다.");
                setIsLoading(false);
                return;
            }

            const [templateResponse, scheduleResponse] = await Promise.all([
                storeApi.getShiftTemplate(storeId),
                storeApi.getStoreSchedules(storeId, weekStartDate),
            ]);

            let templates: TemplateResDto[] = [];
            let schedules: ScheduleResDto[] = [];

            if (!templateResponse.success) {
                const code = templateResponse.error ? getErrorCode(templateResponse.error) : "";

                if (code !== "TEMPLATE_NOT_FOUND" && code !== "404") {
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
            } else {
                templates = parseTemplateData(templateResponse.data as unknown);
            }

            if (!scheduleResponse.success) {
                const code = scheduleResponse.error ? getErrorCode(scheduleResponse.error) : "";

                if (code === "SHIFT_ASSIGNMENT_NOT_FOUND" || code === "404") {
                    schedules = [];
                } else if (code === "STORE_NOT_FOUND") {
                    setErrorMessage("매장을 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                } else if (code === "INVALID_REQUEST" || code === "400") {
                    setErrorMessage("요청 값이 올바르지 않습니다.");
                    setIsLoading(false);
                    return;
                } else {
                    setErrorMessage(
                        scheduleResponse.error?.message ??
                            "근무 스케줄 정보를 불러오지 못했습니다."
                    );
                    setIsLoading(false);
                    return;
                }
            } else {
                schedules = parseScheduleData(scheduleResponse.data as unknown);
            }

            const dayKeyToIndex = new Map(
                weekDays.map((day, index) => [day.dateKey, index] as const)
            );

            const rows: RosterRow[] = templates.map((template, index) => {
                const name =
                    template.name?.trim() ||
                    (template.shiftType === "PEAK" ? "Peak" : `Shift ${index + 1}`);

                return {
                    key: `${name}-${template.startTime}-${template.endTime}-${index}`,
                    name,
                    shiftType: template.shiftType,
                    templateType: template.templateType,
                    startTime: template.startTime,
                    endTime: template.endTime,
                    time: `${formatTime(template.startTime)} - ${formatTime(template.endTime)}`,
                    tone: getTone(template.templateType, template.shiftType),
                    cells: weekDays.map(() => []),
                };
            });

            schedules.forEach((schedule, index) => {
                const dayIndex = dayKeyToIndex.get(schedule.workDate);
                if (dayIndex === undefined) {
                    return;
                }

                const normalizedTemplateName = schedule.templateName?.trim() ?? null;

                let row = rows.find((candidate) => {
                    const isSameTime =
                        candidate.startTime === schedule.startTime &&
                        candidate.endTime === schedule.endTime;

                    if (!isSameTime) {
                        return false;
                    }

                    if (normalizedTemplateName) {
                        return candidate.name === normalizedTemplateName;
                    }

                    return true;
                });

                if (!row) {
                    const fallbackName =
                        normalizedTemplateName || `Shift ${rows.length + 1}`;

                    row = {
                        key: `schedule-${fallbackName}-${schedule.startTime}-${schedule.endTime}-${index}`,
                        name: fallbackName,
                        shiftType: null,
                        templateType: null,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime,
                        time: `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`,
                        tone: getTone(null, null),
                        cells: weekDays.map(() => []),
                    };

                    rows.push(row);
                }

                if (!row.cells[dayIndex].includes(schedule.memberName)) {
                    row.cells[dayIndex].push(schedule.memberName);
                }
            });

            rows.sort((a, b) => {
                const minuteGap =
                    parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
                if (minuteGap !== 0) {
                    return minuteGap;
                }
                return parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime);
            });

            setRosterRows(rows);
            setScheduleItems(schedules);
            setIsLoading(false);
        };

        void fetchRoster();
    }, [storeId, weekStartDate, weekDays, reloadKey]);

    useEffect(() => {
        let cancelled = false;

        const fetchMyRole = async () => {
            if (!/^\d+$/.test(storeId)) {
                setCanManageSchedule(false);
                return;
            }

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("auth_token")
                    : null;
            if (!token) {
                setCanManageSchedule(false);
                return;
            }

            const identity = getIdentityFromToken(token);
            if (!identity.userId && !identity.email) {
                setCanManageSchedule(false);
                return;
            }

            const response = await storeApi.getStoreMembers(storeId);
            if (!response.success) {
                if (!cancelled) {
                    setCanManageSchedule(false);
                }
                return;
            }

            const members = parseStoreMemberData(response.data as unknown);
            const myMember = members.find((member) => {
                if (identity.userId && String(member.userId) === identity.userId) {
                    return true;
                }

                if (identity.email && member.userEmail.toLowerCase() === identity.email) {
                    return true;
                }

                return false;
            });

            if (!cancelled) {
                setCanManageSchedule(myMember ? isManagerRole(myMember.role) : false);
            }
        };

        void fetchMyRole();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    const totalSchedules = scheduleItems.length;
    const uniqueMembers = useMemo(
        () => new Set(scheduleItems.map((item) => item.memberName)).size,
        [scheduleItems]
    );
    const peakTemplates = rosterRows.filter((row) => row.shiftType === "PEAK").length;

    const handleDeleteWeekSchedules = async () => {
        if (!/^\d+$/.test(storeId)) {
            window.alert("유효하지 않은 매장 ID입니다.");
            return;
        }

        const ok = window.confirm(
            `${weekStartDate} 주차 스케줄을 모두 삭제하시겠습니까?`
        );
        if (!ok) {
            return;
        }

        setIsDeletingSchedule(true);

        const response = await storeApi.deleteStoreSchedules(storeId, weekStartDate);

        if (!response.success) {
            const code = response.error ? getErrorCode(response.error) : "";
            if (code === "NOT_AUTHORIZED" || code === "403") {
                window.alert("관리자 권한이 필요합니다.");
            } else if (code === "STORE_NOT_FOUND") {
                window.alert("매장을 찾을 수 없습니다.");
            } else if (code === "SHIFT_ASSIGNMENT_NOT_FOUND" || code === "404") {
                window.alert("해당 주차의 배정된 스케줄이 없습니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                window.alert("요청 값이 올바르지 않습니다.");
            } else {
                window.alert(
                    response.error?.message ?? "스케줄 삭제 중 오류가 발생했습니다."
                );
            }
            setIsDeletingSchedule(false);
            return;
        }

        setReloadKey((prev) => prev + 1);
        setIsDeletingSchedule(false);
        window.alert("해당 주차 스케줄을 삭제했습니다.");
    };

    const handleAutoGenerateWeekSchedules = async () => {
        if (!/^\d+$/.test(storeId)) {
            window.alert("유효하지 않은 매장 ID입니다.");
            return;
        }

        setIsAutoGeneratingSchedule(true);

        const response = await storeApi.autoGenerateStoreSchedules(
            storeId,
            weekStartDate
        );

        if (!response.success) {
            const code = response.error ? getErrorCode(response.error) : "";
            if (code === "NOT_AUTHORIZED" || code === "403") {
                window.alert("관리자 권한이 필요합니다.");
            } else if (code === "WEEK_ALREADY_EXISTS" || code === "409") {
                window.alert("해당 주차 스케줄은 이미 생성되어 있습니다.");
            } else if (code === "NOT_MONDAY_START_DATE") {
                window.alert("주 시작일은 월요일이어야 합니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                window.alert("요청 값이 올바르지 않습니다.");
            } else {
                window.alert(
                    response.error?.message ??
                        "시간표 자동 생성 중 오류가 발생했습니다."
                );
            }
            setIsAutoGeneratingSchedule(false);
            return;
        }

        setReloadKey((prev) => prev + 1);
        setIsAutoGeneratingSchedule(false);
        window.alert("해당 주차 시간표를 자동 생성했습니다.");
    };

    const validateStoreImageFile = (file: File): string | null => {
        if (file.size > MAX_STORE_IMAGE_SIZE) {
            return "파일 크기는 10MB 이하만 업로드할 수 있습니다.";
        }
        if (!ALLOWED_STORE_IMAGE_TYPES.includes(file.type.toLowerCase())) {
            return "PNG, JPG, JPEG 이미지 파일만 업로드할 수 있습니다.";
        }
        return null;
    };

    const handleUploadStoreImage = async (file: File) => {
        if (!canManageSchedule || !/^\d+$/.test(storeId) || isImageUploading) {
            return;
        }

        const validationMessage = validateStoreImageFile(file);
        if (validationMessage) {
            await Swal.fire({
                icon: "warning",
                title: "업로드 불가",
                text: validationMessage,
                confirmButtonText: "확인",
            });
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setImagePreviewUrl((prev) => {
            if (prev && prev.startsWith("blob:")) {
                URL.revokeObjectURL(prev);
            }
            return localPreview;
        });

        setIsImageUploading(true);
        try {
            const response = await storeApi.uploadStoreImage(storeId, file);
            if (!response.success) {
                throw new Error(response.error?.message ?? "가게 이미지 업로드에 실패했습니다.");
            }

            const storeDetail = parseStoreDetailData(response.data as unknown);
            if (storeDetail) {
                setDisplayStoreName(storeDetail.name);
                setStoreImageUrl(storeDetail.imageUrl);
                setImagePreviewUrl((prev) => {
                    if (prev && prev.startsWith("blob:")) {
                        URL.revokeObjectURL(prev);
                    }
                    return storeDetail.imageUrl;
                });
            }

            setReloadKey((prev) => prev + 1);
            await Swal.fire({
                icon: "success",
                title: "업로드 완료",
                text: "가게 이미지가 저장되었습니다.",
                timer: 1200,
                showConfirmButton: false,
            });
        } catch (error) {
            setImagePreviewUrl((prev) => {
                if (prev && prev.startsWith("blob:")) {
                    URL.revokeObjectURL(prev);
                }
                return storeImageUrl;
            });
            await Swal.fire({
                icon: "error",
                title: "업로드 실패",
                text:
                    error instanceof Error
                        ? error.message
                        : "가게 이미지 업로드 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
            });
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleDeleteStoreImage = async () => {
        if (!canManageSchedule || !/^\d+$/.test(storeId) || isImageDeleting || !storeImageUrl) {
            return;
        }

        const confirmed = await Swal.fire({
            icon: "warning",
            title: "가게 이미지 삭제",
            text: "삭제하면 대시보드에서 기본 아이콘으로 표시됩니다. 계속할까요?",
            showCancelButton: true,
            confirmButtonText: "삭제",
            cancelButtonText: "취소",
        });
        if (!confirmed.isConfirmed) {
            return;
        }

        setIsImageDeleting(true);
        try {
            const response = await storeApi.deleteStoreImage(storeId);
            if (!response.success) {
                throw new Error(response.error?.message ?? "가게 이미지 삭제에 실패했습니다.");
            }

            setStoreImageUrl(null);
            setImagePreviewUrl((prev) => {
                if (prev && prev.startsWith("blob:")) {
                    URL.revokeObjectURL(prev);
                }
                return null;
            });
            setReloadKey((prev) => prev + 1);
            await Swal.fire({
                icon: "success",
                title: "삭제 완료",
                text: "가게 이미지가 삭제되었습니다.",
                confirmButtonText: "확인",
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "삭제 실패",
                text:
                    error instanceof Error
                        ? error.message
                        : "가게 이미지 삭제 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
            });
        } finally {
            setIsImageDeleting(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    {displayStoreName} 주간 시간표
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    storeId: {storeId} 기준 매장 메인 화면 (주간 시간표)
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                {canManageSchedule && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            className="gap-2"
                                            onClick={() => setIsImageModalOpen(true)}
                                        >
                                            <span className="material-icons text-sm">image</span>
                                            가게 이미지
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="gap-2"
                                            onClick={handleDeleteWeekSchedules}
                                            disabled={isDeletingSchedule}
                                        >
                                            <span className="material-icons text-sm">delete</span>
                                            {isDeletingSchedule
                                                ? "삭제 중..."
                                                : "시간표 삭제"}
                                        </Button>
                                        <Button
                                            className="gap-2"
                                            onClick={handleAutoGenerateWeekSchedules}
                                            disabled={isAutoGeneratingSchedule}
                                        >
                                            <span className="material-icons text-sm">auto_awesome</span>
                                            {isAutoGeneratingSchedule
                                                ? "생성 중..."
                                                : "시간표 자동 생성"}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="secondary"
                                    className="gap-2"
                                    onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}
                                >
                                    <span className="material-icons text-sm">chevron_left</span>
                                    이전 주
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="gap-2"
                                    onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}
                                >
                                    <span className="material-icons text-sm">chevron_right</span>
                                    다음 주
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            주간 근무 건수
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {totalSchedules}건
                                        </p>
                                    </div>
                                    <span className="material-icons text-primary">groups</span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            근무 인원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {uniqueMembers}명
                                        </p>
                                    </div>
                                    <span className="material-icons text-green-500">person</span>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            피크 시프트
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {peakTemplates}개
                                        </p>
                                    </div>
                                    <span className="material-icons text-amber-500">wb_sunny</span>
                                </CardBody>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Weekly Roster
                                    </h3>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {weekRangeLabel}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardBody>
                                {isLoading && (
                                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                                        근무 정보를 불러오는 중입니다...
                                    </div>
                                )}

                                {!isLoading && errorMessage && (
                                    <div className="py-10 text-center text-red-600 dark:text-red-400">
                                        {errorMessage}
                                    </div>
                                )}

                                {!isLoading && !errorMessage && rosterRows.length === 0 && (
                                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                                        해당 주차의 시프트 정보가 없습니다.
                                    </div>
                                )}

                                {!isLoading && !errorMessage && rosterRows.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[1100px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#15232d]">
                                            <div className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700">
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        Shift / Day
                                                    </span>
                                                </div>
                                                {weekDays.map((day) => (
                                                    <div
                                                        key={day.dateKey}
                                                        className={`p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${day.highlight ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                                                    >
                                                        <span
                                                            className={`block text-xs font-semibold uppercase ${day.highlight ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}
                                                        >
                                                            {day.label}
                                                        </span>
                                                        <span
                                                            className={`block text-lg font-bold ${day.highlight ? "text-primary" : "text-slate-900 dark:text-white"}`}
                                                        >
                                                            {day.date}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {rosterRows.map((row) => (
                                                <div
                                                    key={row.key}
                                                    className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                                                >
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`w-2 h-2 rounded-full ${dotStyleByTone[row.tone]}`}
                                                            />
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {row.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                                                            {row.time}
                                                        </span>
                                                    </div>

                                                    {row.cells.map((names, idx) => (
                                                        <div
                                                            key={`${row.key}-${idx}`}
                                                            className={`p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[110px] flex flex-col gap-2 ${idx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-800/20" : ""}`}
                                                        >
                                                            {names.length > 0 ? (
                                                                names.map((name) => (
                                                                    <div
                                                                        key={`${row.key}-${idx}-${name}`}
                                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium ${badgeStyleByTone[row.tone]}`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-[10px] font-bold">
                                                                            {name[0]}
                                                                        </div>
                                                                        {name}
                                                                    </div>
                                                                ))
                                                            ) : canManageSchedule ? (
                                                                <button
                                                                    type="button"
                                                                    className="w-full h-full border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <span className="material-icons text-sm">
                                                                        add
                                                                    </span>
                                                                </button>
                                                            ) : (
                                                                <div className="w-full h-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </main>
            </div>

            <Modal
                isOpen={isImageModalOpen}
                onClose={() => {
                    if (!isImageUploading && !isImageDeleting) {
                        setIsImageModalOpen(false);
                    }
                }}
                title="가게 이미지 관리"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        대시보드 매장 카드에 표시될 대표 이미지를 설정하세요. (JPG/PNG, 최대 10MB)
                    </p>

                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        {imagePreviewUrl ? (
                            <img
                                src={imagePreviewUrl}
                                alt={`${displayStoreName} 대표 이미지`}
                                className="w-full h-56 object-cover"
                            />
                        ) : (
                            <div className="h-56 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                아직 등록된 가게 이미지가 없습니다.
                            </div>
                        )}
                    </div>

                    <label
                        htmlFor="store-image-input"
                        onDrop={(event) => {
                            event.preventDefault();
                            setIsImageDragOver(false);
                            const file = event.dataTransfer.files?.[0] ?? null;
                            if (file) {
                                void handleUploadStoreImage(file);
                            }
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsImageDragOver(true);
                        }}
                        onDragLeave={(event) => {
                            event.preventDefault();
                            setIsImageDragOver(false);
                        }}
                        className={`block rounded-xl border-2 border-dashed p-5 transition-colors cursor-pointer ${
                            isImageDragOver
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/30"
                        }`}
                    >
                        <input
                            id="store-image-input"
                            type="file"
                            accept="image/png,image/jpg,image/jpeg"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                if (file) {
                                    void handleUploadStoreImage(file);
                                }
                                event.currentTarget.value = "";
                            }}
                            disabled={isImageUploading || isImageDeleting}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <span className="material-icons text-3xl text-blue-500">
                                cloud_upload
                            </span>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                클릭해서 이미지 선택 또는 드래그앤드롭
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                JPG/PNG, 최대 10MB
                            </p>
                            {isImageUploading && (
                                <p className="text-xs text-blue-600 dark:text-blue-300">
                                    업로드 중...
                                </p>
                            )}
                        </div>
                    </label>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setIsImageModalOpen(false)}
                            disabled={isImageUploading || isImageDeleting}
                        >
                            닫기
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => void handleDeleteStoreImage()}
                            disabled={!storeImageUrl || isImageUploading || isImageDeleting}
                        >
                            {isImageDeleting ? "삭제 중..." : "이미지 삭제"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function StoreMainPage() {
  return (
    <Suspense fallback={null}>
      <StoreMainPageContent />
    </Suspense>
  );
}
