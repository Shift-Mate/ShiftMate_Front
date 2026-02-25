import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";

// --- Type Definitions ---

// 1. 출퇴근 요청 (AttendanceReqDto)
export interface AttendanceRequest {
  assignmentId: number;
  otp: string;
}

// 2. 일간/오늘 근태 응답 (TodayAttendanceResDto)
// 용도: 키오스크 드롭다운, 관리자 일간 현황 페이지
export interface TodayAttendanceResponse {
  assignmentId: number;
  updatedStartTime: string; // ISO string (YYYY-MM-DDTHH:mm:ss)
  updatedEndTime: string;
  workerName: string;
  role: string;
  department: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  currentWorkStatus: "BEFORE_WORK" | "WORKING" | "OFFWORK";
}

// 3. 주간 근태 아이템 응답 (WeeklyAttendanceResDto)
// 용도: 관리자 주간 현황 리스트, 내 주간 스케줄의 상세 데이터
export interface WeeklyAttendanceItemResponse {
  assignmentId: number; // [추가] 대타 요청 시 특정 근무를 식별하기 위해 필요
  workerName: string;
  role: string;
  department: string;
  updatedStartTime: string;
  updatedEndTime: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  status: "NORMAL" | "LATE" | null;
  workedMinutes: number;
}

// 4. 내 주간 근태 전체 응답 (MyWeeklyAttendanceResDto)
// 용도: 내 스케줄 페이지
export interface MyWeeklyAttendanceResponse {
  totalWorkTime: string;
  totalMinutes: number;
  weeklyData: WeeklyAttendanceItemResponse[];
}

// 호환성을 위한 타입 별칭 (이전 코드에서 WeeklyAttendanceData를 사용한 경우 대비)
export type WeeklyAttendanceData = WeeklyAttendanceItemResponse;

// --- API Client ---

export const attendanceApi = {
  // 1. 출퇴근 처리 (통합 엔드포인트)
  clock: async (
    storeId: string,
    data: AttendanceRequest,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/stores/${storeId}/attendance/clock`, data);
  },

  // 2. 일간 근태 현황 조회
  // (키오스크의 드롭다운 목록 및 관리자 페이지의 일간 탭에서 사용)
  getDailyAttendance: async (
    storeId: string,
    date: string, // YYYY-MM-DD
  ): Promise<ApiResponse<TodayAttendanceResponse[]>> => {
    return apiClient.get<TodayAttendanceResponse[]>(
      `/stores/${storeId}/attendance/daily?date=${date}`,
    );
  },

  // 3. 주간 근태 현황 조회
  // (관리자 페이지의 주간 탭에서 사용)
  getWeeklyAttendance: async (
    storeId: string,
    date: string, // YYYY-MM-DD (조회 기준 날짜)
  ): Promise<ApiResponse<WeeklyAttendanceItemResponse[]>> => {
    return apiClient.get<WeeklyAttendanceItemResponse[]>(
      `/stores/${storeId}/attendance/weekly?date=${date}`,
    );
  },

  // 4. 내 주간 스케줄 및 근태 조회
  // (마이 페이지/내 스케줄에서 사용)
  getMyWeeklyAttendance: async (
    storeId: string,
    date: string, // YYYY-MM-DD
  ): Promise<ApiResponse<MyWeeklyAttendanceResponse>> => {
    return apiClient.get<MyWeeklyAttendanceResponse>(
      `/stores/${storeId}/attendance/weekly/my?date=${date}`,
    );
  },

  getMyDailyAttendance: async (
    storeId: string,
  ): Promise<ApiResponse<TodayAttendanceResponse[]>> => {
    return apiClient.get<TodayAttendanceResponse[]>(
      `/stores/${storeId}/attendance/daily/my`,
    );
  },
};
