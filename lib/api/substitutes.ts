import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import {
  SubstituteRequestRes,
  MySubstituteApplicationRes,
  SubstituteApplicationRes,
  CreateSubstituteReq,
  RequestStatus,
  ApplicationStatus,
} from "@/types/substitute";

// --- Raw Interface Definitions (백엔드 응답 형태) ---
interface RawSubstituteRequest {
  requestId: number;
  shiftAssignmentId: number;
  requesterId: number;
  requesterName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: RequestStatus;
  reason: string;
  createdAt: string;
}

interface RawMyApplication {
  applicationId: number;
  requestId: number;
  requesterName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
}

interface RawManagerApplication {
  applicationId: number;
  requestId: number;
  applicantId: number;
  applicantName: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
}

// --- API Client ---

export const substituteApi = {
  // ============================================================
  // 1. 대타 요청 (Requests) - 일반 직원 기능
  // ============================================================

  // [등록] 대타 요청 생성
  createRequest: async (
    storeId: string,
    data: CreateSubstituteReq,
  ): Promise<ApiResponse<void>> => {
    return apiClient.post(`/stores/${storeId}/substitute-requests`, data);
  },

  // [조회] 다른 직원들의 대타 요청 조회 (정렬/필터 추가)
  getOtherRequests: async (
    storeId: string,
    sort?: string,
    status?: string,
  ): Promise<ApiResponse<SubstituteRequestRes[]>> => {
    const params = new URLSearchParams();
    if (sort) params.append("sort", sort);
    if (status && status !== "ALL") params.append("status", status);

    const response = await apiClient.get<RawSubstituteRequest[]>(
      `/stores/${storeId}/substitute-requests/others?${params.toString()}`,
    );
    return mapRequestResponse(response);
  },

  // [조회] 내 대타 요청 조회 (정렬/필터 추가)
  getMyRequests: async (
    storeId: string,
    sort?: string,
    status?: string,
  ): Promise<ApiResponse<SubstituteRequestRes[]>> => {
    const params = new URLSearchParams();
    if (sort) params.append("sort", sort);
    if (status && status !== "ALL") params.append("status", status);

    const response = await apiClient.get<RawSubstituteRequest[]>(
      `/stores/${storeId}/substitute-requests/my?${params.toString()}`,
    );
    return mapRequestResponse(response);
  },

  // [취소] 내 대타 요청 취소
  cancelRequest: async (
    storeId: string,
    requestId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(
      `/stores/${storeId}/substitute-requests/${requestId}`,
    );
  },

  // ============================================================
  // 2. 대타 지원 (Applications) - 일반 직원 기능
  // ============================================================

  // [생성] 대타 지원하기
  applySubstitute: async (
    storeId: string,
    requestId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.post(
      `/stores/${storeId}/substitute-requests/${requestId}/apply`,
      {},
    );
  },

  // [조회] 내 지원 내역 조회 (정렬/필터 추가)
  getMyApplications: async (
    storeId: string,
    sort?: string,
    status?: string,
  ): Promise<ApiResponse<MySubstituteApplicationRes[]>> => {
    const params = new URLSearchParams();
    if (sort) params.append("sort", sort);
    if (status && status !== "ALL") params.append("status", status);

    const response = await apiClient.get<RawMyApplication[]>(
      `/stores/${storeId}/substitute-requests/applications/my?${params.toString()}`,
    );

    if (response.success && response.data) {
      const rawData = response.data as any;
      const rawList: RawMyApplication[] = Array.isArray(rawData)
        ? rawData
        : rawData.data || [];

      // 백엔드 데이터 -> 프론트엔드 모델 변환
      const mappedList: MySubstituteApplicationRes[] = rawList.map((raw) => ({
        applicationId: raw.applicationId,
        requestId: raw.requestId,
        requesterName: raw.requesterName,
        date: raw.workDate,
        startTime: raw.startTime,
        endTime: raw.endTime,
        status: raw.applicationStatus,
        createdAt: raw.createdAt,
      }));

      // 중복 제거
      const uniqueList = Array.from(
        new Map(mappedList.map((item) => [item.applicationId, item])).values(),
      );
      return { ...response, data: uniqueList };
    }
    return { ...response, data: [] } as ApiResponse<
      MySubstituteApplicationRes[]
    >;
  },

  // [취소] 지원 취소
  cancelApplication: async (
    storeId: string,
    applicationId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(
      `/stores/${storeId}/substitute-requests/applications/${applicationId}`,
    );
  },

  // ============================================================
  // 3. 관리자 기능 (Manager)
  // ============================================================

  // [조회] 전체 대타 요청 조회
  getAllRequests: async (
    storeId: string,
    sort?: string,
    status?: string,
  ): Promise<ApiResponse<SubstituteRequestRes[]>> => {
    const params = new URLSearchParams();
    if (sort) params.append("sort", sort);
    if (status && status !== "ALL") params.append("status", status);

    const response = await apiClient.get<RawSubstituteRequest[]>(
      `/stores/${storeId}/substitute-requests/all?${params.toString()}`,
    );
    return mapRequestResponse(response);
  },

  // [조회] 특정 요청의 지원자 목록 조회
  getApplicants: async (
    storeId: string,
    requestId: number,
    sort?: string,
    status?: string,
  ): Promise<ApiResponse<SubstituteApplicationRes[]>> => {
    const params = new URLSearchParams();
    if (sort) params.append("sort", sort);
    if (status && status !== "ALL") params.append("status", status);

    const response = await apiClient.get<RawManagerApplication[]>(
      `/stores/${storeId}/substitute-requests/${requestId}/applications?${params.toString()}`,
    );

    if (response.success && response.data) {
      const rawData = response.data as any;
      const rawList: RawManagerApplication[] = Array.isArray(rawData)
        ? rawData
        : rawData.data || [];

      const mappedList: SubstituteApplicationRes[] = rawList.map((raw) => ({
        applicationId: raw.applicationId,
        applicantId: raw.applicantId,
        applicantName: raw.applicantName,
        applicantPhone: "연락처 미제공",
        status: raw.applicationStatus,
        createdAt: raw.createdAt,
      }));

      const uniqueList = Array.from(
        new Map(mappedList.map((item) => [item.applicationId, item])).values(),
      );
      return { ...response, data: uniqueList };
    }
    return { ...response, data: [] } as ApiResponse<SubstituteApplicationRes[]>;
  },

  // [승인] 지원 승인
  approveApplication: async (
    storeId: string,
    requestId: number,
    applicationId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.patch(
      `/stores/${storeId}/substitute-requests/${requestId}/applications/${applicationId}/approve`,
      {},
    );
  },

  // [거절] 지원 거절
  rejectApplication: async (
    storeId: string,
    requestId: number,
    applicationId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.patch(
      `/stores/${storeId}/substitute-requests/${requestId}/applications/${applicationId}/reject`,
      {},
    );
  },

  // [취소] 관리자 권한으로 요청 취소
  managerCancelRequest: async (
    storeId: string,
    requestId: number,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(
      `/stores/${storeId}/substitute-requests/${requestId}/manager-cancel`,
    );
  },
};

// --- Helper Functions ---
function mapRequestResponse(
  response: ApiResponse<RawSubstituteRequest[]>,
): ApiResponse<SubstituteRequestRes[]> {
  if (response.success && response.data) {
    const rawData = response.data as any;
    const rawList: RawSubstituteRequest[] = Array.isArray(rawData)
      ? rawData
      : rawData.data || [];

    const mappedList: SubstituteRequestRes[] = rawList.map((raw) => ({
      id: raw.requestId,
      shiftId: raw.shiftAssignmentId,
      requesterId: raw.requesterId,
      requesterName: raw.requesterName,
      date: raw.workDate,
      startTime: raw.startTime,
      endTime: raw.endTime,
      reason: raw.reason,
      status: raw.status,
      createdAt: raw.createdAt,
    }));

    const uniqueList = Array.from(
      new Map(mappedList.map((item) => [item.id, item])).values(),
    );
    return { ...response, data: uniqueList };
  }
  return { ...response, data: [] } as ApiResponse<SubstituteRequestRes[]>;
}
