"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

export default function CompleteProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedPhone = useMemo(() => onlyDigits(phoneNumber), [phoneNumber]);
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedControlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (allowedControlKeys.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("이름은 필수입니다.");
      return;
    }

    if (!/^[0-9]{11}$/.test(normalizedPhone)) {
      setErrorMessage("전화번호는 숫자 11자리여야 합니다.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await authApi.updateMyProfile({
        name: trimmedName,
        phoneNumber: normalizedPhone,
      });

      if (!response.success) {
        throw new Error(response.error?.message || "프로필 저장에 실패했습니다.");
      }

      localStorage.setItem("auth_user_name", trimmedName);
      window.dispatchEvent(new CustomEvent("auth-user-name-updated", { detail: { name: trimmedName } }));
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          추가 정보 입력
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          카카오 로그인 완료를 위해 이름과 전화번호를 입력해주세요.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="complete-profile-name"
            label="이름"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <Input
            id="complete-profile-phone"
            label="전화번호"
            type="tel"
            value={phoneNumber}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            onKeyDown={handlePhoneKeyDown}
            onChange={(e) => setPhoneNumber(onlyDigits(e.target.value).slice(0, 11))}
            disabled={isSubmitting}
            placeholder="01012345678"
            required
          />

          {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "완료"}
          </Button>
        </form>
      </section>
    </main>
  );
}

