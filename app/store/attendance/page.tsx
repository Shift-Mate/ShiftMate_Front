"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/Button";
import { attendanceApi, TodayAttendanceResponse } from "@/lib/api/attendance";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  // --- State 관리 ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pinCode, setPinCode] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success",
  );
  const [isLoading, setIsLoading] = useState(false);

  // API로 받아온 데이터 저장
  const [todaySchedules, setTodaySchedules] = useState<
    TodayAttendanceResponse[]
  >([]);

  // --- 시계 기능 ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 데이터 불러오기 ---
  const fetchSchedules = async () => {
    if (!storeId) return;
    try {
      // 한국 시간 기준 날짜 계산 (로컬 타임존 사용)
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const todayDate = new Date(now.getTime() - offset)
        .toISOString()
        .split("T")[0];

      const response = await attendanceApi.getDailyAttendance(
        storeId,
        todayDate,
      );

      if (response.success && response.data) {
        // [중요] ApiClient가 백엔드 응답(JSON)을 그대로 data에 담아주는 경우,
        // 백엔드도 ApiResponse 구조라면 데이터가 이중으로 감싸져 있을 수 있습니다.
        const rawData = response.data as any;

        // 1. data가 바로 배열인 경우 (이상적)
        if (Array.isArray(rawData)) {
          setTodaySchedules(rawData);
        }
        // 2. data 안에 또 data가 있고 그게 배열인 경우 (현재 상황 추정)
        else if (rawData.data && Array.isArray(rawData.data)) {
          setTodaySchedules(rawData.data);
        }
        // 3. 그 외의 경우 (빈 배열 등)
        else {
          console.warn("Unexpected response structure:", rawData);
          setTodaySchedules([]);
        }
      }
    } catch (error) {
      console.error("스케줄 로딩 실패:", error);
      setMessage("스케줄 정보를 불러오는데 실패했습니다.");
      setMessageTone("error");
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [storeId]);

  // --- 드롭다운 옵션 가공 (todaySchedules가 배열임을 보장하고 사용) ---
  const shiftOptions = useMemo(() => {
    // 안전 장치: 배열이 아니면 빈 배열 처리
    const schedules = Array.isArray(todaySchedules) ? todaySchedules : [];

    return schedules.map((schedule) => {
      // 시간 포맷팅 (09:00 형태로 자르기)
      const startTime =
        schedule.updatedStartTime?.split("T")[1]?.substring(0, 5) || "";
      const endTime =
        schedule.updatedEndTime?.split("T")[1]?.substring(0, 5) || "";

      // 상태별 라벨 및 비활성화 처리
      let statusLabel = "";
      let isDisabled = false;

      switch (schedule.currentWorkStatus) {
        case "WORKING":
        case "OFFWORK":
          statusLabel = " (퇴근완료)";
          isDisabled = true; // 이미 퇴근한 경우 선택 불가
          break;
        default: // BEFORE_WORK 등
          statusLabel = "";
      }

      return {
        id: String(schedule.assignmentId),
        label: `${schedule.workerName} [${startTime} - ${endTime}]${statusLabel}`,
        isDisabled,
        original: schedule,
      };
    });
  }, [todaySchedules]);

  const hasShiftOptions = shiftOptions.length > 0;

  // --- 이벤트 핸들러 ---
  const handleNumberClick = (num: string) => {
    if (pinCode.length < 4) setPinCode((prev) => prev + num);
    // 입력 시 메시지 초기화
    if (message) setMessage("");
  };

  const handleClear = () => {
    setPinCode("");
    setMessage("");
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setMessage("");
  };

  const handleAttendanceAction = async () => {
    if (!selectedAssignmentId) {
      setMessageTone("error");
      setMessage("근무자를 먼저 선택해 주세요.");
      return;
    }
    if (pinCode.length !== 4) {
      setMessageTone("error");
      setMessage("PIN 4자리를 입력해 주세요.");
      return;
    }

    if (!storeId) return;

    setIsLoading(true);
    try {
      // 요청 보내기
      const response = await attendanceApi.clock(storeId, {
        assignmentId: Number(selectedAssignmentId),
        pinCode: pinCode,
      });

      // ApiClient 처리 방식에 따라 성공 여부 판단
      // 백엔드가 성공 시 200 OK와 함께 ApiResponse를 주므로 success체크
      if (response.success) {
        // 이중 포장 문제 대응: response.data 안에 message가 있을 수 있음
        const resultData = response.data as any;
        const successMessage =
          resultData?.message || resultData?.data?.message || "처리되었습니다.";

        setMessageTone("success");
        setMessage(successMessage);

        // 성공 후 초기화 및 데이터 갱신
        setPinCode("");
        setSelectedAssignmentId("");
        await fetchSchedules(); // 상태 업데이트 반영
      } else {
        setMessageTone("error");
        // 에러 메시지 추출
        const errorMsg =
          response.error?.message ||
          (response.data as any)?.message ||
          "처리 중 오류가 발생했습니다.";
        setMessage(errorMsg);
      }
    } catch (e: any) {
      setMessageTone("error");
      setMessage("서버 통신 오류가 발생했습니다.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // storeName 표시를 위한 로직 (mock 데이터 대신 실제 데이터 활용 가능하면 좋으나, 현재는 storeId만 있으므로 단순 표시)
  const storeNameDisplay = `매장 ${storeId}`;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <StoreSidebar />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />

        <main className="flex-1 overflow-hidden p-6">
          <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* 왼쪽 섹션: 시계 및 근무자 선택 */}
            <section className="p-8 bg-gradient-to-br from-white to-primary/5 dark:from-[#15232b] dark:to-[#101c22] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
              <div className="max-w-lg mx-auto w-full">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                  Current Time
                </p>
                <div className="text-6xl leading-none font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {storeNameDisplay} •{" "}
                  {currentTime.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </p>

                <div className="mt-8 bg-white/80 dark:bg-[#1a2c36] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Shift
                  </label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => {
                      setSelectedAssignmentId(e.target.value);
                      setMessage("");
                    }}
                    disabled={!hasShiftOptions || isLoading}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-[#101c22] border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                  >
                    <option value="" disabled>
                      {hasShiftOptions
                        ? "예정된 근무 shift를 선택해 주세요"
                        : "오늘 예정된 근무가 없습니다"}
                    </option>
                    {shiftOptions.map((shift) => (
                      <option
                        key={shift.id}
                        value={shift.id}
                        disabled={shift.isDisabled}
                      >
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </div>

                {message && (
                  <div
                    className={`mt-6 p-4 rounded-xl border text-sm font-medium text-center ${
                      messageTone === "success"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </section>

            {/* 오른쪽 섹션: PIN 입력 */}
            <section className="p-8 bg-white dark:bg-[#15232b] flex flex-col justify-center">
              <div className="w-full max-w-md mx-auto">
                <div className="mb-6 text-center">
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                    Enter Staff PIN
                  </label>
                  <div className="flex justify-center gap-4 mb-2 h-10 items-center">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                          pinCode.length > index
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumberClick(num.toString())}
                      disabled={isLoading}
                      className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-2xl font-semibold text-slate-900 dark:text-white shadow-sm border-b-4 border-slate-200 dark:border-[#101c22] active:border-b-0 active:translate-y-1 transition-all"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={isLoading}
                    className="h-16 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center shadow-sm border-b-4 border-red-100 dark:border-red-900/40 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    <span className="material-icons">backspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNumberClick("0")}
                    disabled={isLoading}
                    className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-2xl font-semibold text-slate-900 dark:text-white shadow-sm border-b-4 border-slate-200 dark:border-[#101c22] active:border-b-0 active:translate-y-1 transition-all"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading}
                    className="h-16 rounded-xl bg-slate-50 dark:bg-[#1e2f3a] hover:bg-slate-100 dark:hover:bg-[#253844] text-sm font-semibold text-slate-500 dark:text-slate-300 shadow-sm border-b-4 border-slate-200 dark:border-[#101c22] active:border-b-0 active:translate-y-1 transition-all"
                  >
                    Clear
                  </button>
                </div>

                <Button
                  className="w-full h-20 text-xl font-bold"
                  onClick={handleAttendanceAction}
                  disabled={
                    !selectedAssignmentId || pinCode.length !== 4 || isLoading
                  }
                >
                  {isLoading ? "처리중..." : "출근 / 퇴근 처리"}
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
