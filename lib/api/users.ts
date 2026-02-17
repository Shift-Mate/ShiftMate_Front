import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";

export const userApi = {
    async getUserInfoByEmail(email: string): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(
            `/users/admin/user-info?email=${encodeURIComponent(email)}`
        );
    },
};
