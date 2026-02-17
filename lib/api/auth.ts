import { apiClient } from "./client";
import {
    User,
    LoginCredentials,
    SignupData,
    AuthResponse,
} from "@/types/auth";
import { ApiResponse } from "@/types/api";

const getAuthPayload = (data: any): any => {
    if (data && typeof data === "object" && "data" in data) {
        return data.data;
    }
    return data;
};

const getAccessToken = (data: any): string | undefined => {
    if (!data || typeof data !== "object") {
        return undefined;
    }
    if (typeof data.accessToken === "string") {
        return data.accessToken;
    }
    if (typeof data.token === "string") {
        return data.token;
    }
    return undefined;
};

const getUserDisplayName = (data: unknown): string | undefined => {
    if (!data || typeof data !== "object") {
        return undefined;
    }

    const user = "user" in data ? data.user : undefined;
    if (user && typeof user === "object") {
        if (typeof user.name === "string" && user.name.trim()) {
            return user.name.trim();
        }
        if (typeof user.userName === "string" && user.userName.trim()) {
            return user.userName.trim();
        }
        if (typeof user.firstName === "string" && user.firstName.trim()) {
            if (typeof user.lastName === "string" && user.lastName.trim()) {
                return `${user.lastName.trim()}${user.firstName.trim()}`;
            }
            return user.firstName.trim();
        }
        if (typeof user.email === "string" && user.email.includes("@")) {
            return user.email.split("@")[0];
        }
    }

    if (typeof data.name === "string" && data.name.trim()) {
        return data.name.trim();
    }

    return undefined;
};

export const authApi = {
    async login(
        credentials: LoginCredentials
    ): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<AuthResponse>(
            "/auth/login",
            credentials
        );

        if (response.success && response.data) {
            const payload = getAuthPayload(response.data);
            const accessToken = getAccessToken(payload);

            if (accessToken) {
                apiClient.setToken(accessToken);
            }
            if (typeof window !== "undefined") {
                if (payload?.refreshToken) {
                    localStorage.setItem("refresh_token", payload.refreshToken);
                }
                const displayName = getUserDisplayName(payload);
                if (displayName) {
                    localStorage.setItem("auth_user_name", displayName);
                }
            }
        }

        return response;
    },

    async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<AuthResponse>("/auth/signup", data);

        if (response.success && response.data) {
            const payload = getAuthPayload(response.data);
            const accessToken = getAccessToken(payload);

            if (accessToken) {
                apiClient.setToken(accessToken);
            }
            if (typeof window !== "undefined") {
                if (payload?.refreshToken) {
                    localStorage.setItem("refresh_token", payload.refreshToken);
                }
                const displayName = getUserDisplayName(payload);
                if (displayName) {
                    localStorage.setItem("auth_user_name", displayName);
                }
            }
        }

        return response;
    },

    async logout(): Promise<void> {
        apiClient.clearToken();
        if (typeof window !== "undefined") {
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("auth_user_name");
        }
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
            const payload = getAuthPayload(response.data);
            const accessToken = getAccessToken(payload);

            if (accessToken) {
                apiClient.setToken(accessToken);
            }
        }

        return response;
    },
};
