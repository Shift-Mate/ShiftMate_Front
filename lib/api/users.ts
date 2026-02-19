import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";

export interface MyStoreProfileResDto {
  storeId: number;
  storeName: string;
  storeAlias: string;
  role: string;      
  department: string; 
  hourlyWage: number; 
  minHoursPerWeek: number;
  status: string;   
  weeklyWorkedMinutes: number;
}

export const userApi = {
    async getUserInfoByEmail(email: string): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(
            `/users/admin/user-info?email=${encodeURIComponent(email)}`
        );
    },

    // 내 매장 프로필 조회
    async getMyStoreProfile(storeId: string): Promise<ApiResponse<MyStoreProfileResDto>> {
        return apiClient.get<MyStoreProfileResDto>(
            `/users/me/stores/${storeId}/profile`
        );
    },
};