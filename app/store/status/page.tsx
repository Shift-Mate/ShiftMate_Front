"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  attendanceApi,
  TodayAttendanceResponse,
  WeeklyAttendanceItemResponse,
} from "@/lib/api/attendance";
import { storeApi } from "@/lib/api/stores";

type ViewMode = "daily" | "weekly";

interface DailyTableRow extends TodayAttendanceResponse {
  id: string;
}

// --- 프론트엔드 표시용 타입 정의 ---
type WeeklyDay = {
  label: string;
  status: "NORMAL" | "LATE" | "scheduled" | "off";
  time?: string;
};

type WeeklyEmployee = {
  id: string;
  name: string;
  role: string;
  days: WeeklyDay[];
  totalMinutes: number;
};

// --- 유틸리티 함수 (일간) ---
const getDailyStatusVariant = (
  status: TodayAttendanceResponse["currentWorkStatus"],
): "success" | "warning" | "error" | "default" | "info" => {
  switch (status) {
    case "WORKING":
      return "success"; // 근무중 -> 초록색
    case "OFFWORK":
      return "default"; // 퇴근 -> 회색
    case "BEFORE_WORK":
      return "info"; // 출근전 -> 파란색/기본
    default:
      return "default";
  }
};

const getDailyStatusLabel = (
  status: TodayAttendanceResponse["currentWorkStatus"],
): string => {
  const labels: Record<string, string> = {
    BEFORE_WORK: "출근전",
    WORKING: "근무중",
    OFFWORK: "퇴근",
    LATE: "지각",
    ABSENT: "결근",
  };
  return labels[status] || status;
};

// --- 유틸리티 함수 (주간) ---
const getWeeklyStatusChip = (status: WeeklyDay["status"]) => {
  switch (status) {
    case "NORMAL":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    case "LATE":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    case "scheduled":
      return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
  }
};

const getWeeklyStatusText = (day: WeeklyDay) => {
  if (day.status === "off") return "-";
  return day.time || "-";
};

function WorkStatusPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";
  const [storeName, setStoreName] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // State
  const [dailyData, setDailyData] = useState<DailyTableRow[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyEmployee[]>([]);

  // --- 날짜 계산 ---
  const offset = currentDate.getTimezoneOffset() * 60000;
  const dateStr = new Date(currentDate.getTime() - offset)
    .toISOString()
    .split("T")[0];

  // 주간 날짜 범위 계산
  const weekRange = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - dOffset).toISOString().split("T")[0];
    });

    const mondayOffset = monday.getTimezoneOffset() * 60000;
    const startStr = new Date(monday.getTime() - mondayOffset)
      .toISOString()
      .split("T")[0];

    return {
      start: monday,
      end: sunday,
      startStr: startStr,
      days: days,
    };
  }, [currentDate]);

  // --- 데이터 불러오기 ---
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      setIsLoading(true);

      try {
        if (viewMode === "daily") {
          const res = await attendanceApi.getDailyAttendance(storeId, dateStr);
          if (res.success && res.data) {
            const rawData = res.data as any;
            const data: TodayAttendanceResponse[] = Array.isArray(rawData)
              ? rawData
              : rawData.data || [];

            // assignmentId를 문자열 id로 변환하여 매핑
            const mappedData: DailyTableRow[] = data.map((item) => ({
              ...item,
              id: String(item.assignmentId),
            }));
            setDailyData(mappedData);
          }
        } else {
          const res = await attendanceApi.getWeeklyAttendance(
            storeId,
            weekRange.startStr,
          );
          if (res.success && res.data) {
            const rawData = res.data as any;
            const flatList: WeeklyAttendanceItemResponse[] = Array.isArray(
              rawData,
            )
              ? rawData
              : rawData.data || [];

            const grouped = new Map<string, WeeklyEmployee>();

            flatList.forEach((item) => {
              if (!grouped.has(item.workerName)) {
                grouped.set(item.workerName, {
                  id: item.workerName,
                  name: item.workerName,
                  role: item.role,
                  days: Array(7)
                    .fill(null)
                    .map(() => ({ label: "", status: "off" })),
                  totalMinutes: 0,
                });
              }

              const emp = grouped.get(item.workerName)!;
              const itemDate = item.updatedStartTime.split("T")[0];
              const dayIndex = weekRange.days.indexOf(itemDate);

              if (dayIndex !== -1) {
                const start = item.updatedStartTime
                  .split("T")[1]
                  ?.substring(0, 5);
                const end = item.updatedEndTime.split("T")[1]?.substring(0, 5);

                const rawStatus = item.status as string | null;
                let status: WeeklyDay["status"] = "scheduled";

                if (rawStatus === "NORMAL") status = "NORMAL";
                else if (rawStatus === "LATE") status = "LATE";
                else if (!rawStatus) status = "scheduled";

                emp.days[dayIndex] = {
                  label: ["월", "화", "수", "목", "금", "토", "일"][dayIndex],
                  status: status,
                  time: `${start}-${end}`,
                };
                emp.totalMinutes += item.workedMinutes || 0;
              }
            });

            setWeeklyData(Array.from(grouped.values()));
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, viewMode, dateStr, weekRange.startStr, weekRange.days]);

  // --- 매장 정보 불러오기 ---
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      try {
        const res = await storeApi.getStore(storeId);

        if (res.success && res.data) {
          const rawData = res.data as any;

          // Case 1: 중첩된 데이터 (res.data.data.name)
          if (rawData.data && rawData.data.name) {
            setStoreName(rawData.data.name);
          }
          // Case 2: 평탄한 데이터 (res.data.name)
          else if (rawData.name) {
            setStoreName(rawData.name);
          }
          // Case 3: 실패/없음
          else {
            setStoreName(`매장 ${storeId}`);
          }
        } else {
          setStoreName(`매장 ${storeId}`);
        }
      } catch (error) {
        console.error("Failed to fetch store info:", error);
        setStoreName(`매장 ${storeId}`);
      }
    };
    fetchStoreInfo();
  }, [storeId]);

  // --- 통계 계산 ---
  const workingCount = dailyData.filter(
    (d) => d.currentWorkStatus === "WORKING",
  ).length;
  const offWorkCount = dailyData.filter(
    (d) => d.currentWorkStatus === "OFFWORK",
  ).length;
  const beforeWorkCount = dailyData.filter(
    (d) => d.currentWorkStatus === "BEFORE_WORK",
  ).length;
  const totalCount = dailyData.length;

  // --- 날짜 이동 핸들러 ---
  const handlePrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === "daily" ? 1 : 7));
    setCurrentDate(d);
  };
  const handleNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === "daily" ? 1 : 7));
    setCurrentDate(d);
  };

  // --- 일간 테이블 컬럼 ---
  const dailyColumns = [
    {
      key: "workerName",
      header: "직원명",
      render: (item: DailyTableRow) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {item.workerName[0]}
          </div>
          <div>
            <span className="font-medium block">{item.workerName}</span>
            <span className="text-xs text-slate-500">{item.role}</span>
          </div>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "예정 시간",
      render: (item: DailyTableRow) => {
        const s = item.updatedStartTime.split("T")[1]?.substring(0, 5);
        const e = item.updatedEndTime.split("T")[1]?.substring(0, 5);
        return (
          <span className="text-slate-500">
            {s} - {e}
          </span>
        );
      },
    },
    {
      key: "clockIn",
      header: "출근 시간",
      render: (item: DailyTableRow) =>
        item.clockInAt ? item.clockInAt.split("T")[1]?.substring(0, 5) : "-",
    },
    {
      key: "clockOut",
      header: "퇴근 시간",
      render: (item: DailyTableRow) =>
        item.clockOutAt ? item.clockOutAt.split("T")[1]?.substring(0, 5) : "-",
    },
    {
      key: "status",
      header: "상태",
      render: (item: DailyTableRow) => (
        <Badge variant={getDailyStatusVariant(item.currentWorkStatus)}>
          {getDailyStatusLabel(item.currentWorkStatus)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <StoreSidebar />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 헤더 & 날짜 네비게이션 */}
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                  {storeName} 근태 현황
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  일간/주간 단위로 근무 기록을 확인할 수 있습니다.
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 items-center gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={isLoading}
                  >
                    <span className="material-icons">chevron_left</span>
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center">
                    {viewMode === "daily"
                      ? `${currentDate.getFullYear()}.${currentDate.getMonth() + 1}.${currentDate.getDate()}`
                      : `${weekRange.start.getMonth() + 1}.${weekRange.start.getDate()} - ${weekRange.end.getMonth() + 1}.${weekRange.end.getDate()}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    <span className="material-icons">chevron_right</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 뷰 모드 전환 버튼 */}
            <div className="flex items-center gap-4">
              <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg w-fit">
                <button
                  onClick={() => setViewMode("daily")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "daily"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  일간
                </button>
                <button
                  onClick={() => setViewMode("weekly")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "weekly"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  주간
                </button>
              </div>
            </div>

            {/* 일간 뷰: 통계 카드 및 테이블 */}
            {viewMode === "daily" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          총 스케줄
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {totalCount}명
                        </p>
                      </div>
                      <span className="material-icons text-primary">
                        people
                      </span>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          현재 근무중
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {workingCount}명
                        </p>
                      </div>
                      <span className="material-icons text-green-500">
                        work
                      </span>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          퇴근 완료
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {offWorkCount}명
                        </p>
                      </div>
                      <span className="material-icons text-slate-500">
                        check_circle
                      </span>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          출근 전
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {beforeWorkCount}명
                        </p>
                      </div>
                      <span className="material-icons text-amber-500">
                        schedule
                      </span>
                    </CardBody>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      오늘의 출퇴근 현황
                    </h3>
                  </CardHeader>
                  <Table data={dailyData} columns={dailyColumns} />
                </Card>
              </>
            )}

            {/* 주간 뷰: 그리드 테이블 */}
            {viewMode === "weekly" && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    주간 근태 그리드
                  </h3>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
                            직원
                          </th>
                          {["월", "화", "수", "목", "금", "토", "일"].map(
                            (d, i) => (
                              <th
                                key={d}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                              >
                                <div>{d}</div>
                                <div className="text-[10px] font-normal">
                                  {weekRange.days[i].substring(5)}
                                </div>
                              </th>
                            ),
                          )}
                          <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                            총 근무
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {weeklyData.map((employee) => (
                          <tr
                            key={employee.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 sticky left-0 bg-white dark:bg-surface-dark z-10 border-r border-slate-100 dark:border-slate-800">
                              <p className="font-medium text-slate-900 dark:text-white">
                                {employee.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {employee.role}
                              </p>
                            </td>
                            {employee.days.map((day, idx) => (
                              <td key={idx} className="px-3 py-3">
                                <span
                                  className={`inline-flex flex-col items-center justify-center px-2 py-1 rounded min-w-[60px] text-[11px] font-medium ${getWeeklyStatusChip(day.status)}`}
                                >
                                  <span>{getWeeklyStatusText(day)}</span>
                                  {day.status === "LATE" && (
                                    <span className="text-[9px] opacity-80 mt-0.5">
                                      지각
                                    </span>
                                  )}
                                </span>
                              </td>
                            ))}
                            <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">
                              {Math.floor(employee.totalMinutes / 60)}h{" "}
                              {employee.totalMinutes % 60}m
                            </td>
                          </tr>
                        ))}
                        {weeklyData.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="py-8 text-center text-slate-500"
                            >
                              해당 주간에 근무 기록이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WorkStatusPage() {
  return (
    <Suspense fallback={null}>
      <WorkStatusPageContent />
    </Suspense>
  );
}
