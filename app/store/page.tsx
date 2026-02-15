"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storeApi } from "@/lib/api/stores";

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

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return typeof (value as { success?: unknown }).success === "boolean";
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

export default function StoreMainPage() {
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
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    }, [storeId, weekStartDate, weekDays]);

    const totalSchedules = scheduleItems.length;
    const uniqueMembers = useMemo(
        () => new Set(scheduleItems.map((item) => item.memberName)).size,
        [scheduleItems]
    );
    const peakTemplates = rosterRows.filter((row) => row.shiftType === "PEAK").length;

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
                                    {storeName} 주간 시간표
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    storeId: {storeId} 기준 매장 메인 화면 (주간 시간표)
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
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
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="w-full h-full border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <span className="material-icons text-sm">
                                                                        add
                                                                    </span>
                                                                </button>
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
        </div>
    );
}
