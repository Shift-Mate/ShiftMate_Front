"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

interface SidebarProps {
    navItems: NavItem[];
    userRole?: "employee" | "manager";
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, userRole = "employee" }) => {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white dark:bg-[#15232d] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 fixed h-full z-30 hidden md:flex md:flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">
                        S
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                        ShiftMate
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
                <nav className="mt-2 flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                <span
                                    className={cn(
                                        "material-icons mr-3",
                                        isActive
                                            ? "text-primary"
                                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                                    )}
                                >
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile */}
            <div className="flex-shrink-0 flex border-t border-slate-200 dark:border-slate-800 p-4">
                <Link href="/profile" className="flex-shrink-0 w-full group block">
                    <div className="flex items-center">
                        <div>
                            <img
                                alt="Profile"
                                className="inline-block h-9 w-9 rounded-full"
                                src="https://ui-avatars.com/api/?name=User&background=13a4ec&color=fff"
                            />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                사용자
                            </p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                프로필 보기
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </aside>
    );
};
