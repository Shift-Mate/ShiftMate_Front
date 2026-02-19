import { ApiResponse } from "@/types/api";
import { apiClient } from "./client";

export type SalaryMonth = {
    year: number;
    month: number;
};

export type StoreMonthlySalary = {
    storeId: number;
    storeName: string;
    storeAlias: string | null;
    hourlyWage: number;
    workedMinutes: number;
    workedHours: number;
    estimatedPay: number;
};

export type MonthlySalarySummary = {
    year: number;
    month: number;
    totalEstimatedPay: number;
    stores: StoreMonthlySalary[];
};

const getPayload = (data: unknown): unknown => {
    if (data && typeof data === "object" && "data" in data) {
        return (data as { data: unknown }).data;
    }
    return data;
};

export const salaryApi = {
    async getSalaryMonths(): Promise<ApiResponse<SalaryMonth[]>> {
        const response = await apiClient.get<unknown>("/users/me/salary/months");
        if (!response.success) {
            return { success: false, error: response.error };
        }

        const payload = getPayload(response.data);
        if (!Array.isArray(payload)) {
            return {
                success: false,
                error: {
                    code: "INVALID_RESPONSE",
                    message: "급여 월 목록 응답 형식이 올바르지 않습니다.",
                },
            };
        }

        const months = payload
            .map((item) => {
                if (!item || typeof item !== "object") {
                    return null;
                }
                const row = item as { year?: unknown; month?: unknown };
                const year = Number(row.year);
                const month = Number(row.month);
                if (!Number.isInteger(year) || !Number.isInteger(month)) {
                    return null;
                }
                return { year, month };
            })
            .filter((item): item is SalaryMonth => item !== null);

        return { success: true, data: months };
    },

    async getMonthlySalary(year: number, month: number): Promise<ApiResponse<MonthlySalarySummary>> {
        const response = await apiClient.get<unknown>(
            `/users/me/salary/monthly?year=${year}&month=${month}`
        );
        if (!response.success) {
            return { success: false, error: response.error };
        }

        const payload = getPayload(response.data);
        if (!payload || typeof payload !== "object") {
            return {
                success: false,
                error: {
                    code: "INVALID_RESPONSE",
                    message: "월별 급여 응답 형식이 올바르지 않습니다.",
                },
            };
        }

        const parsed = payload as {
            year?: unknown;
            month?: unknown;
            totalEstimatedPay?: unknown;
            stores?: unknown;
        };

        const storesRaw = Array.isArray(parsed.stores) ? parsed.stores : [];
        const stores = storesRaw
            .map((item) => {
                if (!item || typeof item !== "object") {
                    return null;
                }

                const row = item as {
                    storeId?: unknown;
                    storeName?: unknown;
                    storeAlias?: unknown;
                    hourlyWage?: unknown;
                    workedMinutes?: unknown;
                    workedHours?: unknown;
                    estimatedPay?: unknown;
                };

                return {
                    storeId: Number(row.storeId) || 0,
                    storeName: typeof row.storeName === "string" ? row.storeName : "매장",
                    storeAlias: typeof row.storeAlias === "string" ? row.storeAlias : null,
                    hourlyWage: Number(row.hourlyWage) || 0,
                    workedMinutes: Number(row.workedMinutes) || 0,
                    workedHours: Number(row.workedHours) || 0,
                    estimatedPay: Number(row.estimatedPay) || 0,
                };
            })
            .filter((item): item is StoreMonthlySalary => item !== null);

        return {
            success: true,
            data: {
                year: Number(parsed.year) || year,
                month: Number(parsed.month) || month,
                totalEstimatedPay: Number(parsed.totalEstimatedPay) || 0,
                stores,
            },
        };
    },
};
