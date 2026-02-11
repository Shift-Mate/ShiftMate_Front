import { apiClient } from "./client";
import { Shift, Schedule, SubstituteRequest } from "@/types/schedule";
import { ApiResponse } from "@/types/api";

export const scheduleApi = {
    // 스케줄 관련
    async getSchedule(
        storeId: string,
        weekStart: string
    ): Promise<ApiResponse<Schedule>> {
        return apiClient.get<Schedule>(
            `/schedules?storeId=${storeId}&weekStart=${weekStart}`
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
        data: Partial<Shift>
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

    async createSubstituteRequest(data: {
        shiftId: string;
        reason?: string;
    }): Promise<ApiResponse<SubstituteRequest>> {
        return apiClient.post<SubstituteRequest>(
            "/schedules/substitute-requests",
            data
        );
    },

    async approveSubstituteRequest(
        id: string
    ): Promise<ApiResponse<SubstituteRequest>> {
        return apiClient.post<SubstituteRequest>(
            `/schedules/substitute-requests/${id}/approve`
        );
    },

    async rejectSubstituteRequest(
        id: string
    ): Promise<ApiResponse<SubstituteRequest>> {
        return apiClient.post<SubstituteRequest>(
            `/schedules/substitute-requests/${id}/reject`
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
