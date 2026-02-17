// types/substitute.ts

export type RequestStatus =
  | "OPEN" // 모집중
  | "PENDING" // 승인 대기 (지원자 있음)
  | "APPROVED" // 승인 완료
  | "FILLED" // (UI용) 매칭 완료
  | "REQUESTER_CANCELED" // 요청자 취소
  | "MANAGER_CANCELED" // 관리자 취소
  | "REJECTED"; // (UI용) 거절됨

export type ApplicationStatus =
  | "WAITING" // 승인 대기
  | "SELECTED" // 선발됨
  | "REJECTED" // 거절됨
  | "CANCELED"; // 지원 취소

// 대타 요청 정보 (공통)
export interface SubstituteRequestRes {
  id: number;
  shiftId: number;
  requesterId: number;
  requesterName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

// 내 대타 지원 내역 (My Applications)
export interface MySubstituteApplicationRes {
  applicationId: number;
  requestId: number; // 어떤 요청에 지원했는지
  requesterName: string; // 요청자 이름
  date: string;
  startTime: string;
  endTime: string;
  status: ApplicationStatus; // 나의 지원 상태
  createdAt: string;
}

// (관리자용) 지원자 정보 - 기존 유지
export interface SubstituteApplicationRes {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  applicantPhone: string;
  status: ApplicationStatus;
  createdAt: string;
}

// 대타 요청 생성 바디
export interface CreateSubstituteReq {
  shiftAssignmentId: number; // 대타를 요청할 내 근무 ID
  reason: string;
}
