import { apiClient } from "./client";
import { Store } from "@/types/store";
import { ApiResponse } from "@/types/api";

export type UserDocumentType = "HEALTH_CERTIFICATE" | "IDENTIFICATION";

export type UserDocumentResDto = {
    id: number;
    type: UserDocumentType;
    originalFileName: string;
    contentType: string;
    size: number;
    fileUrl: string;
};

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

    async deleteStoreSchedules(
        storeId: string,
        weekStartDate: string
    ): Promise<ApiResponse<unknown>> {
        return apiClient.delete<unknown>(
            `/stores/${storeId}/schedules?weekStartDate=${weekStartDate}`
        );
    },

    async autoGenerateStoreSchedules(
        storeId: string,
        weekStartDate: string
    ): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>(
            `/stores/${storeId}/schedules/auto-generate`,
            { weekStartDate }
        );
    },

    async getUserSchedules(
        storeId: string,
        userId: string
    ): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(
            `/stores/${storeId}/schedules/users/${userId}`
        );
    },

    async getMySchedules(storeId: string): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(`/stores/${storeId}/schedules/me`);
    },

    async getStoreMembers(
        storeId: string,
        filters?: {
            status?: string;
            role?: string;
            department?: string;
        }
    ): Promise<ApiResponse<unknown>> {
        const query = new URLSearchParams();
        if (filters?.status) query.set("status", filters.status);
        if (filters?.role) query.set("role", filters.role);
        if (filters?.department) query.set("department", filters.department);

        const queryString = query.toString();
        const endpoint = queryString
            ? `/stores/${storeId}/store-members?${queryString}`
            : `/stores/${storeId}/store-members`;

        return apiClient.get<unknown>(endpoint);
    },

    async createStoreMember(
        storeId: string,
        userId: number,
        data: {
            email: string;
            role: string;
            department: string;
            minHoursPerWeek: number;
            memberRank?: string;
            hourlyWage?: number;
            status?: string;
            pinCode?: string;
        }
    ): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>(
            `/stores/${storeId}/store-members/${userId}`,
            data
        );
    },

    async getMemberDocuments(
        storeId: string,
        memberUserId: string
    ): Promise<ApiResponse<UserDocumentResDto[]>> {
        return apiClient.get<UserDocumentResDto[]>(
            `/stores/${storeId}/store-members/${memberUserId}/documents`
        );
    },

    async getMemberPreferences(
        storeId: string,
        memberId: string
    ): Promise<ApiResponse<unknown>> {
        return apiClient.get<unknown>(
            `/stores/${storeId}/members/${memberId}/preferences`
        );
    },

    async createMemberPreferences(
        storeId: string,
        memberId: string,
        data: {
            preference: Array<{
                dayOfWeek: string;
                type: "UNAVAILABLE" | "NATURAL" | "PREFERRED";
                templateId: number;
            }>;
        }
    ): Promise<ApiResponse<unknown>> {
        return apiClient.post<unknown>(
            `/stores/${storeId}/members/${memberId}/preferences`,
            data
        );
    },

    async updateMemberPreference(
        storeId: string,
        memberId: string,
        preferenceId: number,
        data: {
            preferenceType: "UNAVAILABLE" | "NATURAL" | "PREFERRED";
        }
    ): Promise<ApiResponse<unknown>> {
        return apiClient.put<unknown>(
            `/stores/${storeId}/members/${memberId}/preferences/${preferenceId}`,
            data
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
