import { apiClient } from "./client";
import { Attendance, ClockInRequest, ClockOutRequest } from "@/types/attendance";
import { ApiResponse } from "@/types/api";

export const attendanceApi = {
    async clockIn(data: ClockInRequest): Promise<ApiResponse<Attendance>> {
        return apiClient.post<Attendance>("/attendance/clock-in", data);
    },

    async clockOut(data: ClockOutRequest): Promise<ApiResponse<Attendance>> {
        return apiClient.post<Attendance>("/attendance/clock-out", data);
    },

    async getAttendance(
        employeeId?: string,
        date?: string
    ): Promise<ApiResponse<Attendance[]>> {
        const params = new URLSearchParams();
        if (employeeId) params.append("employeeId", employeeId);
        if (date) params.append("date", date);

        const endpoint = `/attendance${params.toString() ? `?${params.toString()}` : ""}`;
        return apiClient.get<Attendance[]>(endpoint);
    },

    async getTodayAttendance(): Promise<ApiResponse<Attendance[]>> {
        return apiClient.get<Attendance[]>("/attendance/today");
    },
};
