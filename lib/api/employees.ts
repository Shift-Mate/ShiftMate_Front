import { apiClient } from "./client";
import { Employee } from "@/types/employee";
import { ApiResponse } from "@/types/api";

export const employeeApi = {
    async getEmployees(storeId?: string): Promise<ApiResponse<Employee[]>> {
        const endpoint = storeId
            ? `/employees?storeId=${storeId}`
            : "/employees";
        return apiClient.get<Employee[]>(endpoint);
    },

    async getEmployee(id: string): Promise<ApiResponse<Employee>> {
        return apiClient.get<Employee>(`/employees/${id}`);
    },

    async inviteEmployee(data: {
        email: string;
        role: string;
        storeId: string;
    }): Promise<ApiResponse<Employee>> {
        return apiClient.post<Employee>("/employees/invite", data);
    },

    async updateEmployee(
        id: string,
        data: Partial<Employee>
    ): Promise<ApiResponse<Employee>> {
        return apiClient.put<Employee>(`/employees/${id}`, data);
    },

    async deleteEmployee(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`/employees/${id}`);
    },
};
