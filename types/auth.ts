// 인증 관련 타입
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
}

export type UserRole = "employee" | "manager" | "admin";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

export interface AuthResponse {
    user: User;
    token: string;
}
