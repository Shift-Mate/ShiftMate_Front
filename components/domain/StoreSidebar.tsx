"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { storeApi } from "@/lib/api/stores";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
};

type StoreMemberListResDto = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
};

const managerNavItems = [
  { label: "매장 대시보드", href: "/store", icon: "dashboard" },
  { label: "스케줄", href: "/store/schedule", icon: "calendar_today" },
  { label: "출퇴근", href: "/store/attendance", icon: "schedule" },
  { label: "근무 상태", href: "/store/status", icon: "assessment" },
  { label: "대체 요청 관리", href: "/store/requests", icon: "approval" },
  { label: "직원 목록", href: "/store/staff", icon: "people" },
];

const employeeNavItems = [
  { label: "매장 대시보드", href: "/store", icon: "dashboard" },
  { label: "내 근무기록", href: "/store/my-schedule", icon: "event_note" },
  { label: "내 근태 현황", href: "/store/my-attendance", icon: "fact_check" },
  { label: "대체 근무", href: "/store/substitutes", icon: "swap_horiz" },
];

const isStoreMemberListResDto = (value: unknown): value is StoreMemberListResDto => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoreMemberListResDto>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.userId === "number" &&
    typeof candidate.userName === "string" &&
    typeof candidate.userEmail === "string" &&
    typeof candidate.role === "string"
  );
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as { success?: unknown }).success === "boolean";
};

const parseStoreMembers = (rawData: unknown): StoreMemberListResDto[] => {
  if (Array.isArray(rawData)) {
    return rawData.filter(isStoreMemberListResDto);
  }

  if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
    return rawData.data.filter(isStoreMemberListResDto);
  }

  return [];
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(normalized);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getIdentityFromToken = (token: string): { userId: string | null; email: string | null } => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { userId: null, email: null };
  }

  const idKeys = ["userId", "id", "uid", "memberId"];
  for (const key of idKeys) {
    const value = payload[key];
    if (typeof value === "number") {
      return { userId: String(value), email: null };
    }
    if (typeof value === "string" && value.trim() && /^\d+$/.test(value.trim())) {
      return { userId: value.trim(), email: null };
    }
  }

  const sub = payload.sub;
  if (typeof sub === "string" && /^\d+$/.test(sub.trim())) {
    return { userId: sub.trim(), email: null };
  }

  const emailKeys = ["email", "userEmail", "sub"];
  for (const key of emailKeys) {
    const value = payload[key];
    if (typeof value === "string" && value.includes("@")) {
      return { userId: null, email: value.toLowerCase() };
    }
  }

  return { userId: null, email: null };
};

const isManagerRole = (role: string): boolean => {
  const normalizedRole = role.trim().toUpperCase();
  return normalizedRole === "OWNER" || normalizedRole === "MANAGER" || normalizedRole === "ADMIN";
};

export const StoreSidebar: React.FC = () => {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [userRole, setUserRole] = useState<"employee" | "manager">("employee");

  useEffect(() => {
    let cancelled = false;

    const fetchStoreRole = async () => {
      if (!storeId || !/^\d+$/.test(storeId)) {
        setUserRole("employee");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUserRole("employee");
        return;
      }

      const identity = getIdentityFromToken(token);
      if (!identity.userId && !identity.email) {
        setUserRole("employee");
        return;
      }

      const response = await storeApi.getStoreMembers(storeId);
      if (cancelled || !response.success) {
        if (!cancelled) {
          setUserRole("employee");
        }
        return;
      }

      const members = parseStoreMembers(response.data as unknown);
      const me = members.find((member) => {
        if (identity.userId && String(member.userId) === identity.userId) {
          return true;
        }

        if (identity.email && member.userEmail.toLowerCase() === identity.email) {
          return true;
        }

        return false;
      });

      if (!cancelled) {
        setUserRole(me && isManagerRole(me.role) ? "manager" : "employee");
      }
    };

    void fetchStoreRole();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const navItems = userRole === "manager" ? managerNavItems : employeeNavItems;

  return <Sidebar navItems={navItems} userRole={userRole} />;
};
