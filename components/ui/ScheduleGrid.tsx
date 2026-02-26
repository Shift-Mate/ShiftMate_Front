import React, { useMemo } from "react";
import { Shift } from "@/types/schedule";
import { diffDateKeys, getTodayDateKeyInKst, parseDateOnly } from "@/lib/datetime";
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
  // 1. 날짜 계산 로직 추가
  const weekDays = useMemo(() => {
    const start = parseDateOnly(weekStart);
    const todayStr = getTodayDateKeyInKst();

    return DAYS.map((dayName, index) => {
      const current = new Date(start);
      current.setDate(start.getDate() + index);

      const month = current.getMonth() + 1;
      const date = current.getDate();
      const dateStr = `${current.getFullYear()}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

      return {
        dayName,
        dateFormatted: `${month}/${date}`,
        fullDate: dateStr,
        isToday: dateStr === todayStr,
      };
    });
  }, [weekStart]);

  const getShiftForDayAndTime = (dayIndex: number, time: string) => {
    return shifts.find((shift) => {
      const daysDiff = diffDateKeys(weekStart, shift.date);

      return (
        daysDiff === dayIndex && shift.startTime <= time && shift.endTime > time
      );
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-t-lg overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 font-semibold text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center">
            시간
          </div>
          {weekDays.map((day) => (
            <div
              key={day.dayName}
              className={cn(
                "p-3 text-center flex flex-col items-center justify-center gap-1 transition-colors",
                // 오늘 날짜 강조 스타일
                day.isToday
                  ? "bg-primary/5 dark:bg-primary/20"
                  : "bg-slate-50 dark:bg-slate-800",
              )}
            >
              <span
                className={cn(
                  "font-semibold text-sm",
                  // 요일 색상 (토: 파랑, 일: 빨강, 평일: 기본)
                  day.dayName === "토"
                    ? "text-blue-500"
                    : day.dayName === "일"
                      ? "text-rose-500"
                      : "text-slate-900 dark:text-white",
                )}
              >
                {day.dayName}
              </span>
              <span
                className={cn(
                  "text-xs",
                  day.isToday
                    ? "text-primary font-bold"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {day.dateFormatted}
              </span>
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
              <div className="bg-white dark:bg-surface-dark p-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center">
                {time}
              </div>
              {DAYS.map((_, dayIndex) => {
                const shift = getShiftForDayAndTime(dayIndex, time);
                const slotStartMinutes = parseMinutes(time);
                const slotEndMinutes = slotStartMinutes + 60;
                const shiftStartMinutes = shift
                  ? parseMinutes(shift.startTime)
                  : 0;
                const shiftEndMinutes = shift ? parseMinutes(shift.endTime) : 0;
                const isShiftStart =
                  !!shift && shiftStartMinutes === slotStartMinutes;
                const isShiftEnd = !!shift && shiftEndMinutes <= slotEndMinutes;
                const isSingleSlotShift = isShiftStart && isShiftEnd;

                // 오늘 날짜인 경우 body 셀의 배경색도 살짝 변경하려면 아래 weekDays[dayIndex].isToday 사용
                const isTodayColumn = weekDays[dayIndex].isToday;

                return (
                  <div
                    key={`${dayIndex}-${time}`}
                    className={cn(
                      "p-2 min-h-[60px] relative",
                      // 오늘인 경우 배경색 살짝 변경
                      isTodayColumn
                        ? "bg-primary/5 dark:bg-primary/10"
                        : "bg-white dark:bg-surface-dark",
                    )}
                  >
                    {shift && (
                      <div
                        className={cn(
                          "absolute left-1 right-1 border-2 text-xs font-medium shadow-sm z-10",
                          isSingleSlotShift && "top-1 bottom-1 rounded-md p-2",
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
                          getShiftTypeColor(shift.type),
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
