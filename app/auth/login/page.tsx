"use client";

import React, { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");

    const isSignup = mode === "signup";

    return (
        <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            {/* Left Side: Form Container */}
            <div
                className={`relative flex flex-col justify-center items-center px-6 py-12 lg:px-16 xl:px-24 bg-surface-light dark:bg-surface-dark overflow-y-auto transition-transform duration-500 ease-in-out will-change-transform lg:z-10 ${
                    isSignup ? "lg:translate-x-full" : "lg:translate-x-0"
                }`}
            >
                {/* Mobile Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <span className="material-icons text-xl">schedule</span>
                    </div>
                    <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                        ShiftMate
                    </span>
                </div>

                {/* Main Content Container */}
                <div className="w-full max-w-md mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {mode === "login" ? "다시 오신 것을 환영합니다" : "시작하기"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {mode === "login"
                                ? "대시보드에 접근하려면 로그인하세요."
                                : "계정을 만들어 시작하세요."}
                        </p>
                    </div>

                    {/* Auth Toggle (Segmented Control) */}
                    <div className="bg-slate-100 dark:bg-background-dark p-1 rounded-lg grid grid-cols-2 gap-1">
                        <button
                            onClick={() => setMode("login")}
                            className={`py-2 px-4 rounded text-sm font-medium transition-all duration-200 ${mode === "login"
                                    ? "shadow-sm bg-white dark:bg-surface-dark text-primary"
                                    : "hover:bg-white/50 dark:hover:bg-surface-dark/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                }`}
                        >
                            로그인
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`py-2 px-4 rounded text-sm font-medium transition-all duration-200 ${mode === "signup"
                                    ? "shadow-sm bg-white dark:bg-surface-dark text-primary"
                                    : "hover:bg-white/50 dark:hover:bg-surface-dark/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                }`}
                        >
                            회원가입
                        </button>
                    </div>

                    {/* Form */}
                    {mode === "login" ? <LoginForm /> : <SignupForm />}
                </div>

                {/* Footer Rights */}
                <div className="absolute bottom-6 text-xs text-slate-400 w-full text-center">
                    © 2024 ShiftMate Platform. All rights reserved.
                </div>
            </div>

            {/* Right Side: Visual / Branding */}
            <div
                className={`hidden lg:flex flex-col relative bg-primary/10 dark:bg-primary/5 p-8 lg:p-12 xl:p-16 justify-between overflow-hidden transition-transform duration-500 ease-in-out will-change-transform ${
                    isSignup ? "lg:-translate-x-full" : "lg:translate-x-0"
                }`}
            >
                {/* Branding Header */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white">
                        <span className="material-icons text-2xl">schedule</span>
                    </div>
                    <span className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
                        ShiftMate
                    </span>
                </div>

                {/* Central Visual */}
                <div className="relative z-10 flex-1 flex items-center justify-center py-10">
                    <div className="relative w-full max-w-lg aspect-square">
                        {/* Background blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-x-12 -translate-y-12" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl -translate-x-12 translate-y-12" />

                        {/* Main Image Card */}
                        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 bg-white/10 backdrop-blur-sm group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-white p-8">
                                    <span className="material-icons text-6xl mb-4">
                                        calendar_today
                                    </span>
                                    <h3 className="text-2xl font-bold mb-2">스마트한 일정 관리</h3>
                                    <p className="text-white/80">AI 기반 자동 스케줄링</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote / Testimonial */}
                <div className="relative z-10 max-w-lg">
                    <blockquote className="text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
                        &quot;인력 관리를 간소화하세요. 출퇴근을 단순화하고, 직원에게 권한을 부여하며, 시간을 되찾으세요.&quot;
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-300" />
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-400" />
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-surface-dark bg-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">
                            500+ 팀이 신뢰
                        </span>
                    </div>
                </div>

                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(#13a4ec 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>
        </div>
    );
}
