import { apiClient } from "./client";
import { User, LoginCredentials, SignupData, AuthResponse } from "@/types/auth";
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

export const authApi = {
  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    if (response.success && response.data) {
      const payload = getAuthPayload(response.data);
      const accessToken = getAccessToken(payload);

      if (accessToken) {
        apiClient.setToken(accessToken);
      }
      if (payload?.refreshToken && typeof window !== "undefined") {
        localStorage.setItem("refresh_token", payload.refreshToken);
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
      if (payload?.refreshToken && typeof window !== "undefined") {
        localStorage.setItem("refresh_token", payload.refreshToken);
      }
    }

    return response;
  },

  async logout(): Promise<void> {
    apiClient.clearToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("refresh_token");
    }
    // 서버에 로그아웃 요청 (선택사항)
    await apiClient.post("/auth/logout");
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>("/users/me");
  },

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post<{ token: string }>("/auth/refresh");

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
