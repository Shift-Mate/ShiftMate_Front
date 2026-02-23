"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authApi, SocialProvider } from "@/lib/api/auth";

const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: "카카오",
  google: "구글",
};

const isSocialProvider = (value: string): value is SocialProvider => {
  return value === "kakao" || value === "google";
};

const readProfileCompleted = (value: unknown): boolean | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.profileCompleted === "boolean") {
    return record.profileCompleted;
  }

  if (record.data && typeof record.data === "object") {
    const nested = readProfileCompleted(record.data);
    if (nested !== null) {
      return nested;
    }
  }

  if (record.user && typeof record.user === "object") {
    const nested = readProfileCompleted(record.user);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
};

export default function SocialCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const didRequestRef = useRef(false);

  const [errorMessage, setErrorMessage] = useState<string>("");

  const provider = useMemo(() => {
    const raw = params?.provider;
    if (!raw) return null;
    const normalized = raw.toLowerCase();
    return isSocialProvider(normalized) ? normalized : null;
  }, [params?.provider]);

  useEffect(() => {
    // 개발 모드 StrictMode에서 effect가 2회 실행되어
    // 동일 인가코드로 토큰 요청이 중복되는 문제를 방지한다.
    if (didRequestRef.current) {
      return;
    }
    didRequestRef.current = true;

    const run = async () => {
      if (!provider) {
        setErrorMessage("지원하지 않는 소셜 로그인 경로입니다.");
        return;
      }

      const oauthError = searchParams.get("error");
      if (oauthError) {
        setErrorMessage(`${SOCIAL_PROVIDER_LABEL[provider]} 로그인 동의가 취소되었거나 실패했습니다.`);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        setErrorMessage("인가 코드가 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await authApi.socialLogin(provider, code);
      if (!response.success) {
        setErrorMessage(response.error?.message || "소셜 로그인 처리에 실패했습니다.");
        return;
      }

      // 로그인 직후 사용자 정보를 확인해 이름/전화번호 입력 완료 여부를 판단한다.
      const meResponse = await authApi.getCurrentUser();
      const profileCompleted = readProfileCompleted(meResponse.data);
      if (profileCompleted === false) {
        router.replace("/auth/complete-profile");
        return;
      }

      router.replace("/");
    };

    void run();
  }, [provider, router, searchParams]);

  return (
    <main className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          소셜 로그인 처리 중
        </h1>
        {!errorMessage ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            로그인 정보를 확인하고 있습니다. 잠시만 기다려주세요.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
            <Link
              href="/auth/login"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              로그인 페이지로 돌아가기
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

