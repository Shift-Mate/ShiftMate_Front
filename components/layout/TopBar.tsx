"use client";

import React from "react";
import Link from "next/link";

export const TopBar: React.FC = () => {
    return (
        <header className="bg-white dark:bg-[#15232d] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 hidden md:flex justify-between items-center px-8 h-16 shadow-sm">
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    대시보드
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-gray-400 text-sm">search</span>
                    </div>
                    <input
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
                        placeholder="검색..."
                        type="text"
                    />
                </div>

                {/* Notifications */}
                <button className="p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none relative">
                    <span className="sr-only">알림 보기</span>
                    <span className="material-icons">notifications_none</span>
                    <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark" />
                </button>

                {/* Profile */}
                <div className="ml-3 relative flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            사용자
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">관리자</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:border-slate-600">
                        <img
                            alt="Profile"
                            className="h-full w-full object-cover"
                            src="https://ui-avatars.com/api/?name=User&background=13a4ec&color=fff"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};
