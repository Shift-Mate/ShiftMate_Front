"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { resetPasswordText, resolveAuthLang, type AuthLang } from "@/lib/i18n/auth-reset";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AuthLang>("en");
  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const t = resetPasswordText[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setLang(resolveAuthLang(navigator.language));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage(t.invalidLink);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage(t.mismatch);
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
        throw new Error(response.error?.message || t.resetFailed);
      }

      await Swal.fire({
        icon: "success",
        title: t.successTitle,
        text: t.successText,
        confirmButtonText: t.confirmButton,
      });

      router.push("/auth/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t.resetError,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.newPasswordLabel}
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
            label={t.confirmLabel}
            type={showPassword ? "text" : "password"}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder={t.confirmPlaceholder}
            required
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t.submitting : t.submit}
          </Button>
        </form>

        {errorMessage && (
          <p className="text-sm text-red-500" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="text-sm text-center">
          <Link href="/auth/login" className="text-primary hover:underline">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
