"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  attendanceApi,
  TodayAttendanceResponse,
  WeeklyAttendanceItemResponse,
} from "@/lib/api/attendance";
import { storeApi } from "@/lib/api/stores";

type TabKey = "daily" | "weekly";

function MyAttendanceContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";

  const [storeName, setStoreName] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const [todayAttendance, setTodayAttendance] = useState<
    TodayAttendanceResponse[]
  >([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<
    WeeklyAttendanceItemResponse[]
  >([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalWorkTime: "0시간 0분",
    totalMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // 현재 날짜 및 주간 시작일 계산
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  }, [currentDate]);

  const formatDateRange = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  const moveWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  // 매장 정보 불러오기
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      try {
        const res = await storeApi.getStore(storeId);
        if (res.success && res.data) {
          const rawData = res.data as any;
          setStoreName(rawData.name || rawData.data?.name || `매장 ${storeId}`);
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

  // 근태 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        if (activeTab === "daily") {
          // 내 금일 근태 조회
          const res = await attendanceApi.getMyDailyAttendance(storeId);

          if (res.success && res.data) {
            const data = Array.isArray(res.data)
              ? res.data
              : (res.data as any).data || [];

            // 시간순 정렬 (스케줄 시작 시간 시준 오름차순)
            data.sort(
              (a: TodayAttendanceResponse, b: TodayAttendanceResponse) => {
                return (
                  new Date(a.updatedStartTime).getTime() -
                  new Date(b.updatedStartTime).getTime()
                );
              },
            );

            console.log("Sorted Daily Data:", data);
            setTodayAttendance(data);
          }
        } else {
          // 내 주간 근태 조회 
          const res = await attendanceApi.getMyWeeklyAttendance(
            storeId,
            weekStart,
          );
          if (res.success && res.data) {
            const actualData = (res.data as any).data || res.data;
            setWeeklyStats({
              totalWorkTime: actualData.totalWorkTime || "0시간 0분",
              totalMinutes: actualData.totalMinutes || 0,
            });

            const weekly = actualData.weeklyData || [];
            weekly.sort(
              (
                a: WeeklyAttendanceItemResponse,
                b: WeeklyAttendanceItemResponse,
              ) => {
                return (
                  new Date(a.updatedStartTime).getTime() -
                  new Date(b.updatedStartTime).getTime()
                );
              },
            );

            setWeeklyAttendance(weekly);
          }
        }
      } catch (e) {
        console.error("Failed to fetch attendance:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, activeTab, weekStart]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    if (isoString.includes("T")) {
      return isoString.split("T")[1].substring(0, 5);
    }
    return isoString.substring(0, 5);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <StoreSidebar />
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 헤더 */}
            <div>
              <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white">
                {storeName} 내 근태 현황
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                오늘의 근무 상태와 주간 근태 기록을 확인할 수 있습니다.
              </p>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <nav className="-mb-px flex gap-8">
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`py-3 px-1 border-b-2 text-sm font-medium ${
                    activeTab === "daily"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  오늘의 근태
                </button>
                <button
                  onClick={() => setActiveTab("weekly")}
                  className={`py-3 px-1 border-b-2 text-sm font-medium ${
                    activeTab === "weekly"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  주간 기록
                </button>
              </nav>
            </div>

            {/* 일간 조회 */}
            {activeTab === "daily" && (
              <div className="space-y-4">
                {todayAttendance.length > 0 ? (
                  todayAttendance.map((item) => (
                    <Card key={item.assignmentId}>
                      <CardBody>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-sm text-slate-500 block mb-1">
                              근무 시간
                            </span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              {formatTime(item.updatedStartTime)} -{" "}
                              {formatTime(item.updatedEndTime)}
                            </span>
                          </div>
                          <WorkStatusBadge status={item.currentWorkStatus} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div>
                            <span className="text-xs text-slate-500 block">
                              출근 시각
                            </span>
                            <span
                              className={`text-base font-medium ${
                                item.clockInAt
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatTime(item.clockInAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 block">
                              퇴근 시각
                            </span>
                            <span
                              className={`text-base font-medium ${
                                item.clockOutAt
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatTime(item.clockOutAt)}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500">
                    오늘 예정된 근무가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 주간 조회 */}
            {activeTab === "weekly" && (
              <div className="space-y-6">
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveWeek(-1)}
                  >
                    <span className="material-icons">chevron_left</span>
                  </Button>
                  <span className="text-sm font-medium">
                    {formatDateRange(weekStart)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => moveWeek(1)}>
                    <span className="material-icons">chevron_right</span>
                  </Button>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                  <CardBody className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-primary">
                        이번 주 총 근무
                      </h3>
                      <p className="text-sm text-slate-500">
                        {formatDateRange(weekStart)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {weeklyStats.totalWorkTime}
                      </span>
                      <span className="block text-xs text-slate-500">
                        총 {weeklyStats.totalMinutes}분
                      </span>
                    </div>
                  </CardBody>
                </Card>
                <div className="space-y-3">
                  {weeklyAttendance.length > 0 ? (
                    weeklyAttendance.map((item) => (
                      <Card key={item.assignmentId}>
                        <CardBody className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {item.updatedStartTime.split("T")[0]}
                              </span>
                              <AttendanceStatusBadge status={item.status} />
                            </div>
                            <div className="text-sm text-slate-500">
                              계획: {formatTime(item.updatedStartTime)} -{" "}
                              {formatTime(item.updatedEndTime)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm">
                              <span className="text-slate-500 mr-2">
                                실근무:
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {item.clockInAt
                                  ? `${formatTime(item.clockInAt)} - ${formatTime(item.clockOutAt)}`
                                  : "기록 없음"}
                              </span>
                            </div>
                            {item.workedMinutes > 0 && (
                              <div className="text-xs text-primary mt-1 font-medium">
                                {Math.floor(item.workedMinutes / 60)}시간{" "}
                                {item.workedMinutes % 60}분
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      해당 주간의 근무 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkStatusBadge({ status }: { status: string }) {
  if (status === "WORKING") return <Badge variant="success">근무중</Badge>;
  if (status === "OFFWORK") return <Badge variant="default">퇴근완료</Badge>;
  return <Badge variant="warning">출근전</Badge>;
}

function AttendanceStatusBadge({ status }: { status: string | null }) {
  if (status === "LATE") return <Badge variant="error">지각</Badge>;
  if (status === "NORMAL") return <Badge variant="success">정상</Badge>;
  return null;
}

export default function MyAttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyAttendanceContent />
    </Suspense>
  );
}
