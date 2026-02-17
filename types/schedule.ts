// 스케줄 및 시프트 관련 타입
export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  status: ShiftStatus;
  attendanceStatus?: AttendanceStatusType;
}

export type ShiftType = "opening" | "middle" | "closing";
export type ShiftStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "substitute_requested";
export type AttendanceStatusType = "NORMAL" | "LATE" | null;

export interface Schedule {
  weekStart: string;
  weekEnd: string;
  shifts: Shift[];
}

export interface SubstituteRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  requesterName: string;
  date: string;
  shiftTime: string;
  reason?: string;
  status: SubstituteStatus;
  createdAt: string;
}

export type SubstituteStatus = "pending" | "approved" | "rejected" | "filled";
