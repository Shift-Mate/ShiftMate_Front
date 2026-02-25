import { ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;
    private refreshPromise: Promise<boolean> | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // 클라이언트 사이드에서만 localStorage 접근
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("auth_token");
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
        }
    }

    private clearAuthStorage() {
        this.clearToken();
        if (typeof window !== "undefined") {
            localStorage.removeItem("refresh_token");
        }
    }

    private redirectToLogin() {
        if (typeof window === "undefined") {
            return;
        }
        if (window.location.pathname === "/auth/login") {
            return;
        }
        window.location.href = "/auth/login";
    }

    private getEnvelopePayload(data: unknown): unknown {
        if (data && typeof data === "object" && "data" in data) {
            return (data as { data: unknown }).data;
        }
        return data;
    }

    private getErrorCode(data: unknown): string | null {
        if (!data || typeof data !== "object") {
            return null;
        }

        const record = data as Record<string, unknown>;
        const nestedError = record.error;
        if (nestedError && typeof nestedError === "object") {
            const code = (nestedError as Record<string, unknown>).code;
            if (typeof code === "string" && code.trim()) {
                return code.trim();
            }
        }

        const code = record.code;
        if (typeof code === "string" && code.trim()) {
            return code.trim();
        }

        return null;
    }

    private getErrorMessage(data: unknown): string {
        if (!data || typeof data !== "object") {
            return "An error occurred";
        }

        const record = data as Record<string, unknown>;
        const nestedError = record.error;
        if (nestedError && typeof nestedError === "object") {
            const message = (nestedError as Record<string, unknown>).message;
            if (typeof message === "string" && message.trim()) {
                return message.trim();
            }
        }

        const message = record.message;
        if (typeof message === "string" && message.trim()) {
            return message.trim();
        }

        return "An error occurred";
    }

    private shouldTryRefresh(endpoint: string, status: number, data: unknown): boolean {
        if (endpoint.startsWith("/auth/")) {
            return false;
        }

        const errorCode = this.getErrorCode(data);
        return status === 401 || errorCode === "EXPIRED_TOKEN";
    }

    private getAccessTokenFromPayload(payload: unknown): string | null {
        if (!payload || typeof payload !== "object") {
            return null;
        }

        const record = payload as Record<string, unknown>;
        const accessToken = record.accessToken ?? record.token;
        if (typeof accessToken === "string" && accessToken.trim()) {
            return accessToken.trim();
        }
        return null;
    }

    private getRefreshTokenFromPayload(payload: unknown): string | null {
        if (!payload || typeof payload !== "object") {
            return null;
        }

        const refreshToken = (payload as Record<string, unknown>).refreshToken;
        if (typeof refreshToken === "string" && refreshToken.trim()) {
            return refreshToken.trim();
        }
        return null;
    }

    private async refreshAccessToken(): Promise<boolean> {
        if (typeof window === "undefined") {
            return false;
        }

        const storedRefreshToken = localStorage.getItem("refresh_token");
        if (!storedRefreshToken) {
            return false;
        }

        if (!this.refreshPromise) {
            this.refreshPromise = (async () => {
                try {
                    const response = await fetch(`${this.baseUrl}/auth/reissue`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ refreshToken: storedRefreshToken }),
                    });

                    const contentType = response.headers.get("content-type") || "";
                    const isJson = contentType.includes("application/json");
                    const data =
                        response.status === 204
                            ? null
                            : isJson
                              ? await response.json()
                              : await response.text();

                    if (!response.ok) {
                        this.clearAuthStorage();
                        return false;
                    }

                    const payload = this.getEnvelopePayload(data);
                    const newAccessToken = this.getAccessTokenFromPayload(payload);
                    const newRefreshToken = this.getRefreshTokenFromPayload(payload);

                    if (!newAccessToken) {
                        this.clearAuthStorage();
                        return false;
                    }

                    this.setToken(newAccessToken);
                    if (newRefreshToken) {
                        localStorage.setItem("refresh_token", newRefreshToken);
                    }
                    return true;
                } catch {
                    this.clearAuthStorage();
                    return false;
                } finally {
                    this.refreshPromise = null;
                }
            })();
        }

        return this.refreshPromise;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retryAfterRefresh = true
    ): Promise<ApiResponse<T>> {
        if (typeof window !== "undefined") {
            const latestToken = localStorage.getItem("auth_token");
            if (latestToken !== this.token) {
                this.token = latestToken;
            }
        }

        // access token이 비어 있고 refresh token이 남아있다면
        // 인증 API 요청 전에 먼저 재발급을 시도한다.
        if (retryAfterRefresh && !endpoint.startsWith("/auth/") && !this.token) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                this.clearAuthStorage();
                this.redirectToLogin();
                return {
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "로그인이 필요합니다.",
                    },
                };
            }
        }

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        if (options.body && !(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const data =
                response.status === 204
                    ? null
                    : isJson
                      ? await response.json()
                      : await response.text();

            if (!response.ok) {
                if (retryAfterRefresh && this.shouldTryRefresh(endpoint, response.status, data)) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        return this.request<T>(endpoint, options, false);
                    }
                    this.clearAuthStorage();
                    this.redirectToLogin();
                }

                return {
                    success: false,
                    error: {
                        code: this.getErrorCode(data) ?? response.status.toString(),
                        message: this.getErrorMessage(data),
                        details:
                            typeof data === "object" && data !== null
                                ? (data as Record<string, any>)
                                : { raw: data },
                    },
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: "NETWORK_ERROR",
                    message: error instanceof Error ? error.message : "Network error",
                },
            };
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: formData,
        });
    }

    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
