"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { storeApi } from "@/lib/api/stores";

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error?: {
        code: string;
        message: string;
    } | null;
};

type StoreMemberListResDto = {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    role: string;
    memberRank: string | null;
    department: string;
    hourlyWage: number;
    minHoursPerWeek: number;
    status: string;
    createdAt: string;
    updatedAt: string;
};

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
        if (typeof value === "string" && value.trim()) {
            if (/^\d+$/.test(value.trim())) {
                return { userId: value.trim(), email: null };
            }
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

const getDisplayNameFromToken = (token: string): string | null => {
    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    const fullNameKeys = ["name", "userName", "username", "nickname"];
    for (const key of fullNameKeys) {
        const value = payload[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    const firstName = payload.firstName;
    const lastName = payload.lastName;
    if (
        typeof firstName === "string" &&
        firstName.trim() &&
        typeof lastName === "string" &&
        lastName.trim()
    ) {
        return `${lastName.trim()}${firstName.trim()}`;
    }
    if (typeof firstName === "string" && firstName.trim()) {
        return firstName.trim();
    }
    if (typeof lastName === "string" && lastName.trim()) {
        return lastName.trim();
    }

    const email = payload.email ?? payload.sub;
    if (typeof email === "string" && email.includes("@")) {
        return email.split("@")[0] || email;
    }

    return null;
};

const getRoleLabel = (role: string): string => {
    switch (role.toUpperCase()) {
        case "OWNER":
            return "사장";
        case "MANAGER":
            return "관리자";
        case "EMPLOYEE":
        case "STAFF":
        case "PART_TIMER":
            return "직원";
        default:
            return role;
    }
};

export const MainHeader: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [storeRoleLabel, setStoreRoleLabel] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState("사용자");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const storeId = searchParams.get("storeId");

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        setIsLoggedIn(!!token);

        if (token) {
            const cachedDisplayName = localStorage.getItem("auth_user_name");
            if (cachedDisplayName && cachedDisplayName.trim()) {
                setDisplayName(cachedDisplayName.trim());
                return;
            }

            const tokenDisplayName = getDisplayNameFromToken(token);
            if (tokenDisplayName) {
                setDisplayName(tokenDisplayName);
                localStorage.setItem("auth_user_name", tokenDisplayName);
            }
        } else {
            setDisplayName("사용자");
        }
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } finally {
            setIsLoggedIn(false);
            setStoreRoleLabel(null);
            setDisplayName("사용자");
            setIsProfileMenuOpen(false);
            window.alert("로그아웃되었습니다.");
            router.push("/");
        }
    };

    useEffect(() => {
        let cancelled = false;

        const fetchStoreRole = async () => {
            if (!isLoggedIn || !pathname.startsWith("/store") || !storeId || !/^\d+$/.test(storeId)) {
                setStoreRoleLabel(null);
                return;
            }

            const token = localStorage.getItem("auth_token");
            if (!token) {
                setStoreRoleLabel(null);
                return;
            }

            const identity = getIdentityFromToken(token);
            if (!identity.userId && !identity.email) {
                setStoreRoleLabel(null);
                return;
            }

            const response = await storeApi.getStoreMembers(storeId);
            if (cancelled || !response.success) {
                if (!cancelled) {
                    setStoreRoleLabel(null);
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
                setStoreRoleLabel(me ? getRoleLabel(me.role) : null);
                if (me?.userName?.trim()) {
                    const name = me.userName.trim();
                    setDisplayName(name);
                    localStorage.setItem("auth_user_name", name);
                }
            }
        };

        void fetchStoreRole();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, pathname, storeId]);

    const shouldShowRole = isLoggedIn && pathname.startsWith("/store") && !!storeRoleLabel;

    useEffect(() => {
        if (!isProfileMenuOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isProfileMenuOpen]);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-lg bg-surface-light/80 dark:bg-surface-dark/80 border-b border-primary/10 dark:border-primary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                                <span className="material-icons text-xl">schedule</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                                ShiftMate
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-4">
                            {!isLoggedIn && (
                                <Link
                                    href="/auth/login"
                                    className="text-slate-900 dark:text-white hover:text-primary font-medium px-4 py-2"
                                >
                                    로그인
                                </Link>
                            )}

                            {isLoggedIn && (
                                <div className="ml-3 relative" ref={profileMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="hidden md:block text-right">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {displayName}
                                            </p>
                                            {shouldShowRole && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {storeRoleLabel}
                                                </p>
                                            )}
                                        </div>
                                        <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:border-slate-600">
                                            <img
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=13a4ec&color=fff`}
                                            />
                                        </div>
                                    </button>

                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 py-1">
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                내 계정 프로필
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                로그아웃
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="md:hidden flex items-center">
                            {isLoggedIn ? (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-slate-900 dark:text-white hover:text-primary focus:outline-none"
                                >
                                    <span className="material-icons text-2xl">logout</span>
                                </button>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="text-slate-900 dark:text-white hover:text-primary focus:outline-none"
                                >
                                    <span className="material-icons text-2xl">login</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <div className="h-20 shrink-0" />
        </>
    );
};
