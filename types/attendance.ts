import { ShiftType } from "./schedule";

// 백엔드: WeeklyAttendanceResDto 대응
export interface WeeklyAttendanceData {
  workerName: string;
  role: string;
  department: string;
  updatedStartTime: string; // ISO String
  updatedEndTime: string; // ISO String
  clockInAt: string | null;
  clockOutAt: string | null;
  status: "NORMAL" | "LATE" | "ABSENT" | "EARLY_LEAVE" | null;
  workedMinutes: number;
}

// 백엔드: MyWeeklyAttendanceResDto 대응
export interface MyWeeklyAttendanceResponse {
  totalWorkTime: string;
  totalMinutes: number;
  weeklyData: WeeklyAttendanceData[];
}
