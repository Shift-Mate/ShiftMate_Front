import { apiClient } from "./client";
import { Store } from "@/types/store";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const storeApi = {
    async getStores(): Promise<ApiResponse<Store[]>> {
        return apiClient.get<Store[]>("/stores");
    },

    async getStore(id: string): Promise<ApiResponse<Store>> {
        return apiClient.get<Store>(`/stores/${id}`);
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
