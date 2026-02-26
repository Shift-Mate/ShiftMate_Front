import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import {
  CreateOpenShiftReq,
  OpenShiftRes,
  OpenShiftApplyRes,
} from "@/types/openShift";

/** 백엔드 envelope { success, data: T } 또는 배열을 unwrap */
function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const envelope = raw as Record<string, unknown>;
    if (Array.isArray(envelope.data)) return envelope.data as T[];
  }
  return [];
}

export const openShiftApi = {
  // 오픈시프트 생성
  create: (storeId: string, data: CreateOpenShiftReq) =>
    apiClient.post<void>(`/stores/${storeId}/open-shift`, data),

  // 오픈시프트 목록 조회 — envelope unwrap 처리
  getList: async (storeId: string): Promise<ApiResponse<OpenShiftRes[]>> => {
    const res = await apiClient.get<unknown>(`/stores/${storeId}/open-shift`);
    if (!res.success) return res as ApiResponse<OpenShiftRes[]>;
    return { success: true, data: unwrapList<OpenShiftRes>(res.data) };
  },

  // 오픈시프트 지원
  apply: (storeId: string, openShiftId: number) =>
    apiClient.post<void>(`/stores/${storeId}/open-shift/${openShiftId}/apply`),

  // 지원자 목록 조회 — envelope unwrap 처리
  getApplicants: async (
    storeId: string,
    openShiftId: number,
  ): Promise<ApiResponse<OpenShiftApplyRes[]>> => {
    const res = await apiClient.get<unknown>(
      `/stores/${storeId}/open-shift/${openShiftId}/applies`,
    );
    if (!res.success) return res as ApiResponse<OpenShiftApplyRes[]>;
    return { success: true, data: unwrapList<OpenShiftApplyRes>(res.data) };
  },

  // 지원 승인
  approve: (storeId: string, openShiftId: number, applyId: number) =>
    apiClient.patch<void>(
      `/stores/${storeId}/open-shift/${openShiftId}/${applyId}/approve`,
    ),
};
