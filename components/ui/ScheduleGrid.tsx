import React from "react";
import { Shift, AttendanceStatusType } from "@/types/schedule";

interface ScheduleGridProps {
  shifts: Shift[];
  weekStart: string;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 ~ 22:00
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const CELL_HEIGHT = 60; // 1시간당 높이 (px)

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  shifts,
  weekStart,
}) => {
  // 날짜 계산 헬퍼
  const getDayDate = (dayIndex: number) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split("T")[0];
  };

  // 시간 차이를 구해 높이(px) 계산하는 함수
  const getDurationHeight = (start: string, end: string) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const durationHours = endH + endM / 60 - (startH + startM / 60);
    // 높이 = (시간 * 60px) - 여백(8px 정도)
    return Math.max(durationHours * CELL_HEIGHT - 8, 40); // 최소 높이 보장
  };

  // 상태별 라벨 및 색상
  const getStatusBadge = (status?: AttendanceStatusType) => {
    switch (status) {
      case "NORMAL":
        return {
          label: "정상",
          color:
            "text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400",
        };
      case "LATE":
        return {
          label: "지각",
          color:
            "text-yellow-700 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400",
        };
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* 헤더 (요일) */}
        {/* [수정] border-t, border-x 추가하여 아래쪽 바디와 너비/정렬 일치시킴 */}
        <div className="grid grid-cols-8 border-t border-x border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
          <div className="p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
            Time
          </div>
          {DAYS.map((day, i) => (
            <div
              key={day}
              className="p-3 text-center border-l border-slate-200 dark:border-slate-700"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                {day}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {getDayDate(i).substring(5)}
              </div>
            </div>
          ))}
        </div>

        {/* 그리드 바디 (시간표) */}
        <div className="relative bg-white dark:bg-surface-dark rounded-b-lg border-x border-b border-slate-200 dark:border-slate-700">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
            >
              {/* 시간 라벨 */}
              <div className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 flex items-start justify-center pt-2">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* 요일별 셀 */}
              {DAYS.map((_, dayIndex) => {
                const currentDate = getDayDate(dayIndex);

                // 현재 셀(날짜+시간)에 시작하는 스케줄 찾기
                const cellShift = shifts.find((s) => {
                  const shiftHour = parseInt(s.startTime.split(":")[0]);
                  return s.date === currentDate && shiftHour === hour;
                });

                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="relative border-l border-slate-100 dark:border-slate-800"
                    style={{ height: `${CELL_HEIGHT}px` }}
                  >
                    {cellShift && (
                      <div
                        className={`absolute inset-x-1 top-1 rounded-md border-2 p-2 shadow-sm z-10 overflow-hidden flex flex-col justify-between
                                                    ${
                                                      cellShift.type ===
                                                      "opening"
                                                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                                        : cellShift.type ===
                                                            "middle"
                                                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                                          : "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                                                    }`}
                        style={{
                          height: `${getDurationHeight(cellShift.startTime, cellShift.endTime)}px`,
                        }}
                      >
                        <div>
                          {/* 근무자 이름 */}
                          <div className="font-semibold text-xs truncate text-slate-900 dark:text-white mb-0.5">
                            {cellShift.employeeName}
                          </div>

                          {/* 시간 정보 */}
                          <div className="text-[10px] opacity-80 text-slate-600 dark:text-slate-300">
                            {cellShift.startTime} - {cellShift.endTime}
                          </div>
                        </div>

                        {/* 근태 상태 배지 */}
                        {(() => {
                          const statusInfo = getStatusBadge(
                            cellShift.attendanceStatus,
                          );
                          if (statusInfo) {
                            return (
                              <div
                                className={`mt-1 inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold border w-fit ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </div>
                            );
                          }
                          return null;
                        })()}
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
