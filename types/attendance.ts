// 출퇴근 관련 타입
export interface Attendance {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status: AttendanceStatus;
    location?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "early_leave";

export interface ClockInRequest {
    pin: string;
    location?: string;
}

export interface ClockOutRequest {
    pin: string;
}
