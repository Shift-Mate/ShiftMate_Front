export type TemplateType = "COSTSAVER" | "HIGHSERVICE";
export type ShiftType = "NORMAL" | "PEAK";

export type WizardTemplateResDto = {
    id: number;
    templateType: TemplateType | null;
    shiftType: ShiftType;
    name: string | null;
    startTime: string;
    endTime: string;
    requiredStaff: number | null;
};

export type StaffingByShift = {
    opening: number;
    middle: number;
    closing: number;
};

export type WizardFormData = {
    businessId: string;
    businessIdVerified: boolean;
    storeName: string;
    location: string;
    alias: string;
    monthlySales: string;
    openTime: string;
    closeTime: string;
    shiftsPerDay: number;
    peakTimeEnabled: boolean;
    peakStart: string;
    peakEnd: string;
    applyPeakAllDays: boolean;
    templateType: TemplateType;
    staffing: StaffingByShift;
};
