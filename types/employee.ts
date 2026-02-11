// 직원 관련 타입
export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: EmployeeRole;
    department: Department;
    hourlyWage: number;
    status: EmployeeStatus;
    avatar?: string;
    availability?: string[];
}

export type EmployeeRole = "staff" | "manager" | "admin";
export type Department = "kitchen" | "front_of_house" | "delivery" | "management";
export type EmployeeStatus = "active" | "invited" | "inactive";
