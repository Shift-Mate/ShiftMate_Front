"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MainHeader } from "@/components/layout/MainHeader";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <MainHeader />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI 기반 자동 스케줄링
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight">
              스마트한 근무 일정 관리
              <br className="hidden md:block" />
              <span className="text-gradient-primary">현대적인 팀을 위한</span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              스프레드시트에 시간을 낭비하지 마세요. AI가 최적화된 근무 일정을 생성하고, 출퇴근을 추적하며, 대체 근무를 즉시 관리합니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/login"}>
                <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg shadow-xl">
                  대시보드로 이동
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -top-12 -inset-x-12 bg-primary/20 blur-3xl h-[400px] rounded-full opacity-50 dark:opacity-30 pointer-events-none" />
            <div className="relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-900 aspect-video">
                <div className="relative h-full w-full overflow-hidden rounded-md">
                  <Image
                    src="/aaa.png"
                    alt="대시보드 미리보기"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-surface-dark relative" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">
              핵심 기능
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              인력 관리에 필요한 모든 것
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              관리자와 직원 모두를 위해 설계된 지능형 도구로 복잡한 스케줄링 작업을 단순화하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-background-light dark:bg-background-dark rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-icons text-3xl">auto_fix_high</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AI 시프트 생성
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                원클릭 스케줄링: 알고리즘이 가용성, 노동법, 비용을 자동으로 균형있게 조정합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-background-light dark:bg-background-dark rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-icons text-3xl">fingerprint</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                출퇴근 추적
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                정밀한 출석 관리: GPS 인증 출퇴근, 생체 인식 옵션, 급여와 직접 동기화되는 실시간 타임시트.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-background-light dark:bg-background-dark rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-icons text-3xl">sync_alt</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                대체 근무 관리
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                원활한 교대: 직원들이 자동화된 관리자 승인 워크플로로 즉시 시프트 교환을 처리합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-light dark:bg-surface-dark pt-16 pb-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                  <span className="material-icons text-xl">schedule</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                  ShiftMate
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 max-w-xs mb-6">
                현대 비즈니스를 위한 지능형 스케줄링 플랫폼. 시간을 절약하고, 비용을 줄이며, 팀을 행복하게 유지하세요.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">제품</h4>
              <ul className="space-y-2">
                <li>
                  <a className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm" href="#">
                    기능
                  </a>
                </li>
                <li>
                  <a className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm" href="#">
                    가격
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">회사</h4>
              <ul className="space-y-2">
                <li>
                  <a className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm" href="#">
                    소개
                  </a>
                </li>
                <li>
                  <a className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm" href="#">
                    문의
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2024 ShiftMate Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary" href="#">
                개인정보처리방침
              </a>
              <a className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary" href="#">
                이용약관
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
