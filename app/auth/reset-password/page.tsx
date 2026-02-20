"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("유효한 재설정 링크가 아닙니다. 이메일 링크를 다시 확인해 주세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword,
        newPasswordConfirm,
      });

      if (!response.success) {
        throw new Error(response.error?.message || "비밀번호 재설정에 실패했습니다.");
      }

      await Swal.fire({
        icon: "success",
        title: "비밀번호 변경 완료",
        text: "새 비밀번호로 로그인해 주세요.",
        confirmButtonText: "확인",
      });

      router.push("/auth/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "비밀번호 재설정 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">비밀번호 재설정</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            이메일 링크에서 들어오면 새 비밀번호를 입력해 변경할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <Input
            id="reset-new-password-confirm"
            label="새 비밀번호 확인"
            type={showPassword ? "text" : "password"}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
            required
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "변경 중..." : "비밀번호 변경"}
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
