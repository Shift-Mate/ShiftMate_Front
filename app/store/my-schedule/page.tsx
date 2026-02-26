"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { userApi, storeMemberApi } from "@/lib/api/users";
import { showErrorAlert, showSuccessAlert } from "@/lib/ui/sweetAlert";

// Shift 타입 확장을 위해 인터페이스 보강
interface ExtendedShift extends Shift {
  isRequested?: boolean;
}

function MySchedulePageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";

  // 상태 관리
  const [storeName, setStoreName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [shifts, setShifts] = useState<ExtendedShift[]>([]);

  // 시급은 별도 상태로 관리
  const [hourlyWage, setHourlyWage] = useState(0);

  // 통계 상태 (총 시간, 분, 일수)
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

  // 1. 매장 정보 및 내 프로필(시급) 불러오기
  useEffect(() => {
    const fetchStoreAndProfile = async () => {
      if (!storeId) return;
      try {
        // [1] 매장 정보 조회
        const storeRes = await storeApi.getStore(storeId);
        if (storeRes.success && storeRes.data) {
          const rawData = storeRes.data as any;
          setStoreName(rawData.name || rawData.data?.name || `매장 ${storeId}`);
        }

        // [2] 내 유저 정보 조회 (userId 획득)
        const meRes = await userApi.getMyInfo();
        const meData = (meRes as any).data?.data || (meRes as any).data;
        const myUserId = meData?.userId;

        if (!myUserId) return; // 내 정보를 못 불러오면 중단

        // [3] 매장의 전체 직원 목록 조회
        const membersRes = await storeMemberApi.getStoreMembers(storeId);
        const membersData =
          (membersRes as any).data?.data || (membersRes as any).data || [];

        // [4] 전체 직원 목록에서 내 userId와 일치하는 스토어 멤버 찾기
        const myStoreMember = membersData.find(
          (member: any) => member.userId === myUserId,
        );

        if (myStoreMember) {
          console.log(
            "✅ 내 스토어 멤버 정보 매칭 완료! 시급:",
            myStoreMember.hourlyWage,
          );
          // 시급 업데이트 (데이터가 없거나 null이면 0)
          setHourlyWage(myStoreMember.hourlyWage || 0);
        } else {
          console.warn(
            "⚠️ 현재 매장에 해당 유저가 직원으로 등록되어 있지 않습니다.",
          );
        }
      } catch (error) {
        console.error("Failed to fetch store info or profile:", error);
        setStoreName(`매장 ${storeId}`);
      }
    };
    fetchStoreAndProfile();
  }, [storeId]);

  // weekStart 계산 (월요일 기준)
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

  // 날짜 포맷터
  const formatDateRange = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  // 2. 스케줄 데이터 불러오기 및 총 근무시간 계산
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

          const weeklyData: WeeklyAttendanceItemResponse[] = Array.isArray(
            realData.weeklyData,
          )
            ? realData.weeklyData
            : [];

          // 총 근무 시간 계산 로직 (화면에 보이는 스케줄 기준 직접 합산)
          let calculatedTotalMinutes = 0;

          // 데이터 매핑
          const mappedShifts: ExtendedShift[] = weeklyData.map((item) => {
            const startObj = new Date(item.updatedStartTime);
            const endObj = new Date(item.updatedEndTime);

            // 근무 시간 차이 계산
            const diffMs = endObj.getTime() - startObj.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));

            // 유효한 근무 시간인 경우 합산
            if (diffMins > 0) {
              calculatedTotalMinutes += diffMins;
            }

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
              isRequested: (item as any).hasSubstituteRequest,
            };
          });

          // 분 -> "X시간 Y분" 포맷팅
          const hours = Math.floor(calculatedTotalMinutes / 60);
          const minutes = calculatedTotalMinutes % 60;
          const formattedWorkTime = `${hours}시간 ${minutes}분`;

          setStats({
            totalWorkTime: formattedWorkTime,
            totalMinutes: calculatedTotalMinutes,
            days: weeklyData.length,
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
    const availableShifts = shifts.filter((s) => {
      const shiftDate = new Date(`${s.date}T${s.endTime}`);
      const after24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return shiftDate > after24Hours && !s.isRequested;
    });

    if (availableShifts.length > 0) {
      setSelectedShiftId(availableShifts[0].id);
    } else {
      setSelectedShiftId("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRequestReason("");
    setSelectedShiftId("");
  };

  const handleSubmitRequest = async () => {
    if (!selectedShiftId) return;
    try {
      const res = await scheduleApi.createSubstituteRequest(storeId, {
        shiftId: selectedShiftId,
        reason: requestReason,
      });

      if (res.success) {
        await showSuccessAlert("등록 완료", "대체 근무 요청이 등록되었습니다.");
        handleCloseModal();
        window.location.reload();
      } else {
        await showErrorAlert(
          "등록 실패",
          res.error?.message || "요청 등록에 실패했습니다.",
        );
      }
    } catch (e) {
      console.error(e);
      await showErrorAlert("오류 발생", "오류가 발생했습니다.");
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
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  이번 주 개인 근무 스케줄을 확인하세요.
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
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
                      예상 급여 (₩{hourlyWage.toLocaleString()}/시)
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      ₩{/* 예상 급여 계산: (총 분 / 60) * 시급 */}
                      {Math.floor(
                        (stats.totalMinutes / 60) * hourlyWage,
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
                </div>
              </CardHeader>
              <CardBody>
                <ScheduleGrid shifts={shifts} weekStart={weekStart} />
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* 모달 컴포넌트는 기존과 동일 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="대체 근무 요청 등록"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            대타가 필요한 근무(현재 조회된 주간 스케줄)를 선택하세요.
            <br />
            <span className="text-xs text-rose-500">
              * 근무 시작 24시간 전까지만 요청 가능합니다.
            </span>
          </p>

          <select
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
          >
            <option value="">근무 선택</option>
            {shifts.map((shift) => {
              const shiftDate = new Date(`${shift.date}T${shift.endTime}`);
              const now = new Date();
              const after24Hours = new Date(
                now.getTime() + 24 * 60 * 60 * 1000,
              );

              const isPast = shiftDate <= after24Hours;
              const isRequested = shift.isRequested;
              const isDisabled = isPast || isRequested;

              let statusText = "";
              if (isPast) statusText = "(종료)";
              else if (isRequested) statusText = "(신청됨)";

              return (
                <option
                  key={shift.id}
                  value={shift.id}
                  disabled={isDisabled}
                  className={isDisabled ? "text-slate-400 bg-slate-100" : ""}
                >
                  {shift.date} ({shift.startTime} - {shift.endTime}){" "}
                  {statusText}
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

export default function MySchedulePage() {
  return (
    <Suspense fallback={null}>
      <MySchedulePageContent />
    </Suspense>
  );
}
