"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId");
    const role = searchParams.get("role");

    const getHrefWithStoreContext = (href: string) => {
        const isStoreRoute = pathname.startsWith("/store") && href.startsWith("/store");
        if (!isStoreRoute) return href;

        const params = new URLSearchParams();
        if (storeId) params.set("storeId", storeId);
        if (role) params.set("role", role);
        const query = params.toString();

        return query ? `${href}?${query}` : href;
    };

    return (
        <aside className="w-64 bg-white dark:bg-[#15232d] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 fixed top-20 h-[calc(100vh-5rem)] z-30 hidden md:flex md:flex-col">
            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto py-5">
                <nav className="mt-2 flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const targetHref = getHrefWithStoreContext(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={targetHref}
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

        </aside>
    );
};
