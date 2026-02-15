import { apiClient } from "./client";
import { Store } from "@/types/store";
import { ApiResponse } from "@/types/api";

export const storeApi = {
    async getStores(): Promise<ApiResponse<Store[]>> {
        return apiClient.get<Store[]>("/stores");
    },

    async getStore(id: string): Promise<ApiResponse<Store>> {
        return apiClient.get<Store>(`/stores/${id}`);
    },

    async getShiftTemplate(storeId: string): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(`/stores/${storeId}/shift-template`);
    },

    async getShiftTemplateByType(storeId: string): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(`/stores/${storeId}/shift-template/type`);
    },

    async getStoreSchedules(
        storeId: string,
        weekStartDate: string
    ): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(
            `/stores/${storeId}/schedules?weekStartDate=${weekStartDate}`
        );
    },

    async verifyBizno(bno: string): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>("/stores/verify-bizno", { bno });
    },

    async createWizardStore(data: {
        name: string;
        location?: string;
        openTime: string;
        closeTime: string;
        nShifts: number;
        brn: string;
        alias?: string;
        monthlySales?: number;
    }): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>("/stores", data);
    },

    async createShiftTemplate(
        storeId: string,
        data: {
            peak: boolean;
            peakStartTime?: string;
            peakEndTime?: string;
        }
    ): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>(`/stores/${storeId}/shift-template`, data);
    },

    async updateTemplateType(
        storeId: string,
        data: { templateType: "COSTSAVER" | "HIGHSERVICE" }
    ): Promise<ApiResponse<unknown>> {
        return apiClient.put<unknown>(`/stores/${storeId}/shift-template`, data);
    },

    async deleteOtherTemplateTypes(storeId: string): Promise<ApiResponse<unknown>> {
        return apiClient.delete<unknown>(`/stores/${storeId}/shift-template/type`);
    },

    async createStore(data: Partial<Store>): Promise<ApiResponse<Store>> {
        return apiClient.post<Store>("/stores", data);
    },

    async updateStore(
        id: string,
        data: Partial<Store>
    ): Promise<ApiResponse<Store>> {
        return apiClient.put<Store>(`/stores/${id}`, data);
    },

    async deleteStore(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`/stores/${id}`);
    },
};
