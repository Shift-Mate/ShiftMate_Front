import { apiClient } from "./client";
import {
    User,
    LoginCredentials,
    SignupData,
    AuthResponse,
} from "@/types/auth";
import { ApiResponse } from "@/types/api";

export const authApi = {
    async login(
        credentials: LoginCredentials
    ): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<AuthResponse>(
            "/auth/login",
            credentials
        );

        if (response.success && response.data) {
            apiClient.setToken(response.data.token);
        }

        return response;
    },

    async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<AuthResponse>("/auth/signup", data);

        if (response.success && response.data) {
            apiClient.setToken(response.data.token);
        }

        return response;
    },

    async logout(): Promise<void> {
        apiClient.clearToken();
        // 서버에 로그아웃 요청 (선택사항)
        await apiClient.post("/auth/logout");
    },

    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiClient.get<User>("/auth/me");
    },

    async refreshToken(): Promise<ApiResponse<{ token: string }>> {
        const response = await apiClient.post<{ token: string }>(
            "/auth/refresh"
        );

        if (response.success && response.data) {
            apiClient.setToken(response.data.token);
        }

        return response;
    },
};
