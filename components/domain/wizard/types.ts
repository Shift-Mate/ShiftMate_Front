export type TemplateType = "COSTSAVER" | "HIGHSERVICE";

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
