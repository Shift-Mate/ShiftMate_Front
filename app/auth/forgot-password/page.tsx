"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { forgotPasswordText, resolveAuthLang, type AuthLang } from "@/lib/i18n/auth-reset";

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<AuthLang>("en");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const t = forgotPasswordText[lang];

  useEffect(() => {
    setLang(resolveAuthLang(navigator.language));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authApi.requestPasswordReset({ email });
      if (!response.success) {
        throw new Error(response.error?.message || t.requestFailed);
      }

      await Swal.fire({
        icon: "success",
        title: t.successTitle,
        text: t.successText,
        confirmButtonText: t.confirmButton,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t.requestError,
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
          <Input
            id="forgot-email"
            label={t.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
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
