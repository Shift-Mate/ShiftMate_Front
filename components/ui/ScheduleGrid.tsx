import React from "react";
import { Shift } from "@/types/schedule";
import { cn } from "@/lib/utils";

interface ScheduleGridProps {
    shifts: Shift[];
    weekStart: string;
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const TIME_SLOTS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
];

const getShiftTypeColor = (type: string) => {
    switch (type) {
        case "opening":
            return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300";
        case "middle":
            return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300";
        case "closing":
            return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300";
        default:
            return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-300";
    }
};

const parseMinutes = (time: string): number => {
    const [hour = "0", minute = "0"] = time.split(":");
    return Number(hour) * 60 + Number(minute);
};

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    shifts,
    weekStart,
}) => {
    const getShiftForDayAndTime = (dayIndex: number, time: string) => {
        return shifts.find((shift) => {
            const shiftDate = new Date(shift.date);
            const weekStartDate = new Date(weekStart);
            const daysDiff = Math.floor(
                (shiftDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysDiff === dayIndex && shift.startTime <= time && shift.endTime > time;
        });
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-t-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">
                        시간
                    </div>
                    {DAYS.map((day) => (
                        <div
                            key={day}
                            className="bg-slate-50 dark:bg-slate-800 p-3 text-center font-semibold text-sm text-slate-900 dark:text-white"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Time Slots */}
                <div className="border-x border-b border-slate-200 dark:border-slate-700 rounded-b-lg overflow-hidden">
                    {TIME_SLOTS.map((time) => (
                        <div
                            key={time}
                            className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700"
                        >
                            <div className="bg-white dark:bg-surface-dark p-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                {time}
                            </div>
                            {DAYS.map((_, dayIndex) => {
                                const shift = getShiftForDayAndTime(dayIndex, time);
                                const slotStartMinutes = parseMinutes(time);
                                const slotEndMinutes = slotStartMinutes + 60;
                                const shiftStartMinutes = shift
                                    ? parseMinutes(shift.startTime)
                                    : 0;
                                const shiftEndMinutes = shift
                                    ? parseMinutes(shift.endTime)
                                    : 0;
                                const isShiftStart =
                                    !!shift && shiftStartMinutes === slotStartMinutes;
                                const isShiftEnd =
                                    !!shift && shiftEndMinutes <= slotEndMinutes;
                                const isSingleSlotShift = isShiftStart && isShiftEnd;
                                return (
                                    <div
                                        key={`${dayIndex}-${time}`}
                                        className="bg-white dark:bg-surface-dark p-2 min-h-[60px] relative"
                                    >
                                        {shift && (
                                            <div
                                                className={cn(
                                                    "absolute left-1 right-1 border-2 text-xs font-medium shadow-sm",
                                                    isSingleSlotShift &&
                                                        "top-1 bottom-1 rounded-md p-2",
                                                    !isSingleSlotShift &&
                                                        isShiftStart &&
                                                        "top-1 bottom-0 rounded-t-md rounded-b-none border-b-0 p-2",
                                                    !isSingleSlotShift &&
                                                        !isShiftStart &&
                                                        !isShiftEnd &&
                                                        "top-0 bottom-0 rounded-none border-y-0 p-0",
                                                    !isSingleSlotShift &&
                                                        isShiftEnd &&
                                                        "top-0 bottom-1 rounded-b-md rounded-t-none border-t-0 p-0",
                                                    getShiftTypeColor(shift.type)
                                                )}
                                            >
                                                {isShiftStart ? (
                                                    <>
                                                        <div className="font-semibold truncate">
                                                            {shift.employeeName}
                                                        </div>
                                                        <div className="text-[10px] opacity-80">
                                                            {shift.startTime} - {shift.endTime}
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
