import { apiClient } from "./client";
import { User, LoginCredentials, SignupData, AuthResponse, SignupResponse } from "@/types/auth";
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

  // [수정] data를 any로 캐스팅하여 안전하게 user 속성에 접근
  const user = "user" in data ? (data as any).user : undefined;

  if (user && typeof user === "object") {
    // [수정] user를 any로 캐스팅하여 내부 속성 접근 허용
    const u = user as any;

    if (typeof u.name === "string" && u.name.trim()) {
      return u.name.trim();
    }
    if (typeof u.userName === "string" && u.userName.trim()) {
      return u.userName.trim();
    }
    if (typeof u.firstName === "string" && u.firstName.trim()) {
      if (typeof u.lastName === "string" && u.lastName.trim()) {
        return `${u.lastName.trim()}${u.firstName.trim()}`;
      }
      return u.firstName.trim();
    }
    if (typeof u.email === "string" && u.email.includes("@")) {
      return u.email.split("@")[0];
    }
  }

  // [수정] data 자체에 name이 있는 경우 처리 (any 캐스팅)
  const rootData = data as any;
  if (typeof rootData.name === "string" && rootData.name.trim()) {
    return rootData.name.trim();
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

  async signup(data: SignupData): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse>("/auth/signup", data);
  },

  // async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
  //   const response = await apiClient.post<AuthResponse>("/auth/signup", data);

  //   if (response.success && response.data) {
  //     const payload = getAuthPayload(response.data);
  //     const accessToken = getAccessToken(payload);

  //     if (accessToken) {
  //       apiClient.setToken(accessToken);
  //     }
  //     if (typeof window !== "undefined") {
  //       if (payload?.refreshToken) {
  //         localStorage.setItem("refresh_token", payload.refreshToken);
  //       }
  //       const displayName = getUserDisplayName(payload);
  //       if (displayName) {
  //         localStorage.setItem("auth_user_name", displayName);
  //       }
  //     }
  //   }

  //   return response;
  // },

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
