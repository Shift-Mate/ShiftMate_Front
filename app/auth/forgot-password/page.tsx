"use client";

import React, { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authApi.requestPasswordReset({ email });
      if (!response.success) {
        throw new Error(response.error?.message || "비밀번호 재설정 요청에 실패했습니다.");
      }

      await Swal.fire({
        icon: "success",
        title: "요청 완료",
        text: "등록된 이메일이 있다면 비밀번호 재설정 링크를 발송했습니다.",
        confirmButtonText: "확인",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "비밀번호 재설정 요청 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">비밀번호 찾기</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="forgot-email"
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "요청 중..." : "재설정 링크 보내기"}
          </Button>
        </form>

        {errorMessage && (
          <p className="text-sm text-red-500" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="text-sm text-center">
          <Link href="/auth/login" className="text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
