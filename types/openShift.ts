export type OpenShiftStatus = "OPEN" | "RECRUITING" | "CLOSED" | "CANCELED";
export type OpenShiftApplyStatus = "WAITING" | "ACCEPTED" | "REJECTED";

// 백엔드 OpenShiftResDto에 id 필드가 있다고 가정합니다.
export interface OpenShiftRes {
  id: number;
  workDate: string;
  startTime: string;
  endTime: string;
  note?: string;
  requestStatus: OpenShiftStatus;
  createdAt: string;
}

export interface OpenShiftApplyRes {
  id: number;
  applicantName: string;
  department: string;
  applyStatus: OpenShiftApplyStatus;
  createdAt: string;
}

export interface CreateOpenShiftReq {
  shiftTemplateId: number;
  workDate: string;
  note?: string;
}
