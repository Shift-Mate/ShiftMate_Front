export type ShiftLogic = "fixed" | "demand";

export type StaffingByShift = {
    opening: number;
    middle: number;
    closing: number;
};

export type WizardFormData = {
    businessId: string;
    businessIdVerified: boolean;
    storeName: string;
    openTime: string;
    closeTime: string;
    shiftsPerDay: number;
    peakTimeEnabled: boolean;
    peakStart: string;
    peakEnd: string;
    applyPeakAllDays: boolean;
    shiftLogic: ShiftLogic;
    staffing: StaffingByShift;
};
