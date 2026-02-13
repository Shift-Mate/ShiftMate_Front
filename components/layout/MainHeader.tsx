"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";

export const MainHeader: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("auth_token"));
    }, []);

    const handleLogout = async () => {
        await authApi.logout();
        setIsLoggedIn(false);
        setIsProfileMenuOpen(false);
    };

    const roleParam = searchParams.get("role");
    const roleLabel =
        roleParam === "manager" ? "관리자" : roleParam === "employee" ? "직원" : null;
    const shouldShowRole = isLoggedIn && pathname.startsWith("/store") && !!roleLabel;

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
                                                사용자
                                            </p>
                                            {shouldShowRole && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {roleLabel}
                                                </p>
                                            )}
                                        </div>
                                        <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:border-slate-600">
                                            <img
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                                src="https://ui-avatars.com/api/?name=User&background=13a4ec&color=fff"
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
