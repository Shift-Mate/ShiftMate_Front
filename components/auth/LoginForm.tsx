"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

export const LoginForm: React.FC = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await authApi.login({ email, password });

            if (!response.success) {
                throw new Error(
                    response.error?.message || "로그인에 실패했습니다."
                );
            }

            console.log("Login success:", response.data);
            router.push("/");
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "로그인 요청 중 오류가 발생했습니다."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
            />

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        비밀번호
                    </label>
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                    >
                        비밀번호를 잊으셨나요?
                    </Link>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 input-focus transition-all pr-10"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <span className="material-icons text-lg">
                            {showPassword ? "visibility" : "visibility_off"}
                        </span>
                    </button>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            {errorMessage && (
                <p className="text-sm text-red-500" role="alert">
                    {errorMessage}
                </p>
            )}

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-surface-dark px-2 text-slate-500">
                        또는
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" type="button" className="gap-2">
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 488 512"
                        fill="currentColor"
                    >
                        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                    </svg>
                    Google
                </Button>
                <Button variant="secondary" type="button" className="gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 448 512" fill="currentColor">
                        <path d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z" />
                    </svg>
                    Microsoft
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                계속 진행하면{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                    이용약관
                </Link>{" "}
                및{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                    개인정보처리방침
                </Link>
                에 동의하는 것으로 간주됩니다.
            </p>
        </form>
    );
};
