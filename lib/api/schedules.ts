import { apiClient } from "./client";
import { Shift, Schedule, SubstituteRequest } from "@/types/schedule";
import { ApiResponse } from "@/types/api";

// [추가] 대타 요청 모달 등에서 사용할 사용자 스케줄 타입 (백엔드 DTO 매핑)
export interface UserScheduleRes {
  id: number; // shiftAssignmentId
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  role?: string;
}

// [추가] 백엔드 응답 데이터의 가능한 필드명들을 모두 포함한 타입 (유연한 대응)
interface RawScheduleData {
  id?: number;
  shiftAssignmentId?: number; // 백엔드 필드명 후보 1
  date?: string;
  workDate?: string; // 백엔드 필드명 후보 2
  startTime?: string;
  endTime?: string;
  role?: string;
}

export const scheduleApi = {
  getUserSchedules: async (
    storeId: string,
    userId: string | number,
  ): Promise<ApiResponse<UserScheduleRes[]>> => {
    return apiClient.get<UserScheduleRes[]>(
      `/stores/${storeId}/schedules/users/${userId}`,
    );
  },
  // 스케줄 관련
  async getSchedule(
    storeId: string,
    weekStart: string,
  ): Promise<ApiResponse<Schedule>> {
    return apiClient.get<Schedule>(
      `/schedules?storeId=${storeId}&weekStart=${weekStart}`,
    );
  },

  async getMyShifts(weekStart?: string): Promise<ApiResponse<Shift[]>> {
    const endpoint = weekStart
      ? `/schedules/my-shifts?weekStart=${weekStart}`
      : "/schedules/my-shifts";
    return apiClient.get<Shift[]>(endpoint);
  },

  async createShift(data: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>("/schedules/shifts", data);
  },

  async updateShift(
    id: string,
    data: Partial<Shift>,
  ): Promise<ApiResponse<Shift>> {
    return apiClient.put<Shift>(`/schedules/shifts/${id}`, data);
  },

  async deleteShift(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/schedules/shifts/${id}`);
  },

  // 대체 근무 요청 관련
  async getSubstituteRequests(): Promise<ApiResponse<SubstituteRequest[]>> {
    return apiClient.get<SubstituteRequest[]>("/schedules/substitute-requests");
  },

  async createSubstituteRequest(
    storeId: string,
    data: {
      shiftId: string;
      reason?: string;
    },
  ): Promise<ApiResponse<SubstituteRequest>> {
    return apiClient.post<SubstituteRequest>(
      `/stores/${storeId}/substitute-requests`, // URL 경로 수정
      {
        assignmentId: Number(data.shiftId), // 필드명 매핑 및 타입 변환
        reason: data.reason,
      },
    );
  },

  async approveSubstituteRequest(
    id: string,
  ): Promise<ApiResponse<SubstituteRequest>> {
    return apiClient.post<SubstituteRequest>(
      `/schedules/substitute-requests/${id}/approve`,
    );
  },

  async rejectSubstituteRequest(
    id: string,
  ): Promise<ApiResponse<SubstituteRequest>> {
    return apiClient.post<SubstituteRequest>(
      `/schedules/substitute-requests/${id}/reject`,
    );
  },

  // 오픈 시프트 관련
  async getOpenShifts(): Promise<ApiResponse<Shift[]>> {
    return apiClient.get<Shift[]>("/schedules/open-shifts");
  },

  async claimOpenShift(shiftId: string): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>(`/schedules/open-shifts/${shiftId}/claim`);
  },
};
