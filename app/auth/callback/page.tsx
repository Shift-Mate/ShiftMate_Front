"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, SocialProvider } from "@/lib/api/auth";

const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: "카카오",
  google: "구글",
};

const isSocialProvider = (value: string): value is SocialProvider => {
  return value === "kakao" || value === "google";
};

const readProfileCompleted = (value: unknown): boolean | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.profileCompleted === "boolean") return record.profileCompleted;

  if (record.data && typeof record.data === "object") {
    const nested = readProfileCompleted(record.data);
    if (nested !== null) return nested;
  }
  if (record.user && typeof record.user === "object") {
    const nested = readProfileCompleted(record.user);
    if (nested !== null) return nested;
  }
  return null;
};

function SocialCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRequestRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 개발 모드 StrictMode로 인한 중복 토큰 요청 방지
    if (didRequestRef.current) return;
    didRequestRef.current = true;

    const run = async () => {
      const oauthError = searchParams.get("error");
      if (oauthError) {
        setErrorMessage("소셜 로그인 동의가 취소되었거나 실패했습니다.");
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        setErrorMessage("인가 코드가 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 단일 콜백 경로에서는 state로 provider를 구분한다.
      const rawProvider = (searchParams.get("state") || "").toLowerCase();
      if (!isSocialProvider(rawProvider)) {
        setErrorMessage("지원하지 않는 소셜 로그인 상태값입니다.");
        return;
      }

      const response = await authApi.socialLogin(rawProvider, code);
      if (!response.success) {
        const providerLabel = SOCIAL_PROVIDER_LABEL[rawProvider];
        setErrorMessage(response.error?.message || `${providerLabel} 로그인 처리에 실패했습니다.`);
        return;
      }

      const meResponse = await authApi.getCurrentUser();
      const profileCompleted = readProfileCompleted(meResponse.data);
      if (profileCompleted === false) {
        router.replace("/auth/complete-profile");
        return;
      }

      router.replace("/");
    };

    void run();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">소셜 로그인 처리 중</h1>
        {!errorMessage ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">로그인 정보를 확인하고 있습니다. 잠시만 기다려주세요.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
            <Link href="/auth/login" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
              로그인 페이지로 돌아가기
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-6">
          <section className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">소셜 로그인 처리 중</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              로그인 정보를 확인하고 있습니다. 잠시만 기다려주세요.
            </p>
          </section>
        </main>
      }
    >
      <SocialCallbackContent />
    </Suspense>
  );
}

