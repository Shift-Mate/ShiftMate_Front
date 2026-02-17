"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { ScheduleGrid } from "@/components/ui/ScheduleGrid";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Shift, ShiftType } from "@/types/schedule";
import {
  attendanceApi,
  WeeklyAttendanceItemResponse,
} from "@/lib/api/attendance";
import { scheduleApi } from "@/lib/api/schedules";
import { storeApi } from "@/lib/api/stores";

// 임시 시급
const HOURLY_WAGE = 10000;

export default function MySchedulePage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";

  // 상태 관리
  const [storeName, setStoreName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState({
    totalWorkTime: "0시간 0분",
    totalMinutes: 0,
    days: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [requestReason, setRequestReason] = useState("");

  // [수정] 매장 정보 불러오기
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      try {
        const res = await storeApi.getStore(storeId);
        console.log("MySchedule Store Info:", res);

        if (res.success && res.data) {
          // [수정] API 응답이 중첩된 구조({ success: true, data: { ... } })일 수 있으므로 처리
          const rawData = res.data as any;

          // Case 1: 데이터가 중첩된 경우 (res.data.data.name) -> 로그상 이 케이스에 해당함
          if (rawData.data && rawData.data.name) {
            setStoreName(rawData.data.name);
          }
          // Case 2: 데이터가 바로 있는 경우 (res.data.name)
          else if (rawData.name) {
            setStoreName(rawData.name);
          }
          // Case 3: 이름을 찾을 수 없는 경우
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

  // weekStart 계산 (월요일 기준) - Timezone Issue 해결
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    // 로컬 시간 기준으로 날짜 문자열 생성
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
  }, [currentDate]);

  // 날짜 포맷터
  const formatDateRange = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  // 스케줄 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const response = await attendanceApi.getMyWeeklyAttendance(
          storeId,
          weekStart,
        );

        if (response.success && response.data) {
          const rawData = response.data as any;
          const realData = rawData.data ? rawData.data : rawData;

          const totalWorkTime = realData.totalWorkTime || "0시간 0분";
          const totalMinutes = realData.totalMinutes || 0;
          const weeklyData: WeeklyAttendanceItemResponse[] = Array.isArray(
            realData.weeklyData,
          )
            ? realData.weeklyData
            : [];

          setStats({
            totalWorkTime,
            totalMinutes,
            days: weeklyData.filter((d) => d.workedMinutes > 0).length,
          });

          // id에 assignmentId 매핑 (대타 요청 식별용)
          const mappedShifts: Shift[] = weeklyData.map((item) => {
            const startObj = new Date(item.updatedStartTime);
            const endObj = new Date(item.updatedEndTime);

            const dateStr =
              startObj.getFullYear() +
              "-" +
              String(startObj.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(startObj.getDate()).padStart(2, "0");

            const startTimeStr = startObj.toTimeString().substring(0, 5);
            const endTimeStr = endObj.toTimeString().substring(0, 5);

            const hour = startObj.getHours();
            let type: ShiftType = "middle";
            if (hour < 12) type = "opening";
            else if (hour >= 17) type = "closing";

            return {
              id: String(item.assignmentId),
              employeeId: "me",
              employeeName: item.workerName,
              date: dateStr,
              startTime: startTimeStr,
              endTime: endTimeStr,
              type: type,
              status: item.workedMinutes > 0 ? "completed" : "scheduled",
              attendanceStatus: item.status,
            };
          });

          setShifts(mappedShifts);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, weekStart]);

  const moveWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 모달 핸들러
  const handleOpenModal = () => {
    setIsModalOpen(true);
    const now = new Date();
    const futureShifts = shifts.filter(
      (s) => new Date(`${s.date}T${s.endTime}`) > now,
    );
    if (futureShifts.length > 0) {
      setSelectedShiftId(futureShifts[0].id);
    } else {
      setSelectedShiftId("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRequestReason("");
    setSelectedShiftId("");
  };

  // 대타 요청 등록 핸들러
  const handleSubmitRequest = async () => {
    if (!selectedShiftId) return;

    try {
      const res = await scheduleApi.createSubstituteRequest(storeId, {
        shiftId: selectedShiftId,
        reason: requestReason,
      });

      if (res.success) {
        alert("대체 근무 요청이 등록되었습니다.");
        handleCloseModal();
      } else {
        alert(res.error?.message || "요청 등록에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <StoreSidebar />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                  {storeName} 내 근무 일정
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  이번 주 개인 근무 스케줄을 확인하세요.
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                <Button variant="secondary" className="gap-2">
                  <span className="material-icons text-sm">download</span>
                  내보내기
                </Button>
                <Button className="gap-2" onClick={handleOpenModal}>
                  <span className="material-icons text-sm">add</span>
                  대체 근무 요청
                </Button>
              </div>
            </div>

            {/* 날짜 네비게이션 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveWeek(-1)}
                    disabled={isLoading}
                  >
                    <span className="material-icons">chevron_left</span>
                  </Button>
                  <div className="text-center min-w-[200px]">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {formatDateRange(weekStart)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isLoading ? "로딩중..." : "주간 스케줄"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveWeek(1)}
                    disabled={isLoading}
                  >
                    <span className="material-icons">chevron_right</span>
                  </Button>
                </div>
                <Button variant="secondary" size="sm" onClick={goToToday}>
                  오늘
                </Button>
              </CardHeader>
            </Card>

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      이번 주 근무
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {shifts.length}일
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-icons">event_available</span>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      총 근무 시간
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {stats.totalWorkTime}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <span className="material-icons">schedule</span>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      예상 급여 (₩{HOURLY_WAGE.toLocaleString()}/시)
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      ₩
                      {Math.floor(
                        (stats.totalMinutes / 60) * HOURLY_WAGE,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <span className="material-icons">payments</span>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* 스케줄 그리드 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    주간 스케줄
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        오픈
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        미들
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        마감
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <ScheduleGrid shifts={shifts} weekStart={weekStart} />
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* 대타 요청 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="대체 근무 요청 등록"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            대타가 필요한 근무(현재 조회된 주간 스케줄)를 선택하세요.
          </p>

          <select
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
          >
            <option value="">근무 선택</option>
            {shifts.map((shift) => {
              const shiftDate = new Date(`${shift.date}T${shift.endTime}`);
              const isPast = shiftDate < new Date();

              return (
                <option
                  key={shift.id}
                  value={shift.id}
                  disabled={isPast}
                  className={isPast ? "text-slate-400 bg-slate-100" : ""}
                >
                  {shift.date} ({shift.startTime} - {shift.endTime}){" "}
                  {isPast ? "(종료)" : ""}
                </option>
              );
            })}
          </select>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              사유 (선택)
            </label>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              rows={4}
              placeholder="대타 요청 사유를 입력하세요."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleCloseModal}>
              취소
            </Button>
            <Button onClick={handleSubmitRequest} disabled={!selectedShiftId}>
              등록
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
