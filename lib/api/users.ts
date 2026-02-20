import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";

export interface StoreMemberResDto {
  id: number;
  storeId: number;
  userId: number;
  role: string;
  memberRank: string;
  department: string;
  hourlyWage: number;
  minHoursPerWeek: number;
  status: string;
  pinCode: string;
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  async getUserInfoByEmail(email: string): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(
      `/users/admin/user-info?email=${encodeURIComponent(email)}`,
    );
  },

  async getMyInfo(): Promise<ApiResponse<any>> {
    return apiClient.get(`/users/me`);
  },
};

export const storeMemberApi = {
  // 2. 해당 매장의 전체 직원 목록 조회
  async getStoreMembers(storeId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/stores/${storeId}/store-members`);
  },
};
