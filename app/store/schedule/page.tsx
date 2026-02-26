"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storeApi } from "@/lib/api/stores";
import {
  attendanceApi,
  WeeklyAttendanceItemResponse,
} from "@/lib/api/attendance";

// --- 타입 정의 ---

// 직원 목록 API 응답 (StoreMemberListResDto)
interface StoreMember {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  memberRank: string;
  department: string;
  hourlyWage: number;
  minHoursPerWeek: number;
  status: string;
}

// 화면 표시용 테이블 행 데이터
type StaffWorkCostRow = {
  id: string;
  name: string;
  role: string; // role + department 조합
  hourlyWage: number;
  actualMinutes: number; // 분 단위
  minHours: number; // 최소 보장 시간 (시간 단위)
  estimatedPay: number; // 예상 급여
};

const formatWon = (value: number) =>
  `₩${Math.floor(value).toLocaleString("ko-KR")}`;

function StoreLaborCostPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") ?? "";

  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 데이터 상태
  const [tableData, setTableData] = useState<StaffWorkCostRow[]>([]);
  const [stats, setStats] = useState({
    activeStaffCount: 0,
    totalWorkHours: 0, // 시간 단위
    totalEstimatedCost: 0,
  });

  // --- 날짜 계산 (주간 시작일) ---
  const weekStartStr = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
    const monday = new Date(d.setDate(diff));

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  }, [currentDate]);

  // 주간 범위 표시용
  const weekRangeLabel = useMemo(() => {
    const start = new Date(weekStartStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  }, [weekStartStr]);

  // --- 매장 정보 불러오기 ---
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      try {
        const res = await storeApi.getStore(storeId);
        if (res.success && res.data) {
          const rawData = res.data as any;
          setStoreName(rawData.name || rawData.data?.name || `매장 ${storeId}`);
        }
      } catch (error) {
        console.error("Failed to fetch store info:", error);
        setStoreName(`매장 ${storeId}`);
      }
    };
    fetchStoreInfo();
  }, [storeId]);

  // --- 데이터 불러오기 및 병합 ---
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        // 직원 목록 조회 
        const membersRes = await storeApi.getStoreMembers(storeId);

        // 주간 근태 조회
        const attendanceRes = await attendanceApi.getWeeklyAttendance(
          storeId,
          weekStartStr,
        );

        if (membersRes.success && attendanceRes.success) {
          const membersRaw =
            (membersRes.data as any).data || (membersRes.data as any) || [];
          const attendanceRaw =
            (attendanceRes.data as any).data ||
            (attendanceRes.data as any) ||
            [];

          const members: StoreMember[] = Array.isArray(membersRaw)
            ? membersRaw
            : [];

          const attendances: WeeklyAttendanceItemResponse[] = Array.isArray(
            attendanceRaw,
          )
            ? attendanceRaw
            : [];

          // 활성 직원 필터링
          const activeMembers = members.filter((m) => m.status !== "INACTIVE");

          // 데이터 병합 및 계산
          const processedData: StaffWorkCostRow[] = activeMembers.map(
            (member) => {
              const memberAttendances = attendances.filter(
                (att: WeeklyAttendanceItemResponse) =>
                  att.workerName === member.userName,
              );

              // 주간 총 근무 분(minute) 합산
              const totalMinutes = memberAttendances.reduce(
                (sum, att) => sum + (att.workedMinutes || 0),
                0,
              );

              // 예상 급여 계산: (분 / 60) * 시급
              const hourlyWage = member.hourlyWage || 0;
              const estimatedPay = (totalMinutes / 60) * hourlyWage;

              // 직급 표시 (memberRank가 없으면 role 사용)
              const displayRank = member.memberRank || member.role || "-";

              return {
                id: String(member.id),
                name: member.userName,
                role: `${displayRank} / ${member.department}`, // 직급 + 부서 표시
                hourlyWage: hourlyWage,
                actualMinutes: totalMinutes,
                minHours: member.minHoursPerWeek || 0,
                estimatedPay: estimatedPay,
              };
            },
          );

          // 통계 집계
          const totalActiveStaff = processedData.length;
          const totalWorkHours =
            processedData.reduce((sum, row) => sum + row.actualMinutes, 0) / 60;
          const totalCost = processedData.reduce(
            (sum, row) => sum + row.estimatedPay,
            0,
          );

          setTableData(processedData);
          setStats({
            activeStaffCount: totalActiveStaff,
            totalWorkHours: Math.round(totalWorkHours * 10) / 10, // 소수점 1자리
            totalEstimatedCost: totalCost,
          });
        }
      } catch (error) {
        console.error("Failed to fetch labor cost data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, weekStartStr]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="md:flex md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {storeName} 인건비 현황
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  총 직원 근무기록 기반 주간 인건비 코스트 대시보드
                </p>
              </div>

              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-1">
                <button
                  onClick={handlePrevWeek}
                  disabled={isLoading}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[160px] justify-center">
                  <span className="material-icons text-primary text-base">
                    date_range
                  </span>
                  {weekRangeLabel}
                </div>
                <button
                  onClick={handleNextWeek}
                  disabled={isLoading}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    활성 직원 수
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.activeStaffCount}명
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    총 근무시간
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.totalWorkHours}
                    <span className="text-lg font-medium text-slate-500 ml-1">
                      h
                    </span>
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    예상 인건비
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatWon(stats.totalEstimatedCost)}
                  </p>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  직원별 주간 근무/급여 상세
                </h3>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        직원 (이름/직급/부서)
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        시급
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/3">
                        주간 근무 (실제 / 최소보장)
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                        예상 급여
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {tableData.length > 0 ? (
                      tableData.map((row) => {
                        const actualHours =
                          Math.round((row.actualMinutes / 60) * 10) / 10;
                        const ratio =
                          row.minHours > 0
                            ? Math.min(100, (actualHours / row.minHours) * 100)
                            : 0;

                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                  {row.name[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {row.name}
                                  </p>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    {row.role}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {formatWon(row.hourlyWage)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {actualHours}h
                                </span>
                                <span className="text-xs text-slate-500">
                                  최소 {row.minHours}h
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    ratio >= 100
                                      ? "bg-green-500" // 목표 달성 시 녹색
                                      : "bg-primary"
                                  }`}
                                  style={{ width: `${Math.max(5, ratio)}%` }} // 최소 너비 보장
                                />
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatWon(row.estimatedPay)}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-500"
                        >
                          등록된 직원이 없거나 데이터를 불러오는 중입니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function StoreLaborCostPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StoreLaborCostPageContent />
    </Suspense>
  );
}
