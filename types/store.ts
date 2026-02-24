// 매장 관련 타입
export interface Store {
    id: string;
    name: string;
    code: string;
    location: string;
    status: StoreStatus;
    activeStaff: number;
    shiftCoverage: number;
    openTime?: string;
    closeTime?: string;
    image?: string;
}

export type StoreStatus = "open" | "closed" | "opening_soon";

export interface StoreStats {
    totalStaff: number;
    scheduledToday: number;
    avgHourlyWage: number;
}
