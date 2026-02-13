"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

const storeNavItems = [
    { label: "매장 대시보드", href: "/store", icon: "dashboard" },
    { label: "스케줄", href: "/store/schedule", icon: "calendar_today" },
    { label: "내 근무기록", href: "/store/my-schedule", icon: "event_note" },
    { label: "출퇴근", href: "/store/attendance", icon: "schedule" },
    { label: "근무 상태", href: "/store/status", icon: "assessment" },
    { label: "대체 근무", href: "/store/substitutes", icon: "swap_horiz" },
    { label: "대체 요청 관리", href: "/store/requests", icon: "approval" },
    { label: "오픈 시프트", href: "/store/open-shifts", icon: "work_outline" },
    { label: "직원", href: "/store/staff", icon: "people" },
];

export const StoreSidebar: React.FC = () => {
    return <Sidebar navItems={storeNavItems} userRole="manager" />;
};
