"use client";

import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SalaryEstimationPanel } from "@/components/domain/profile/SalaryEstimationPanel";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <MainHeader />

            <main className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            내 계정 프로필
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            계정 정보와 기본 설정을 확인하세요.
                        </p>
                    </div>

                    <Card>
                        <CardHeader className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                기본 정보
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">edit</span>
                                    프로필 수정
                                </Button>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">lock</span>
                                    비밀번호 변경
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="flex items-center gap-4">
                                <img
                                    alt="Profile"
                                    className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-700"
                                    src="https://ui-avatars.com/api/?name=User&background=13a4ec&color=fff"
                                />
                                <div>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        사용자
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        user@shiftmate.com
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                계정 관리
                            </h2>
                            <Link href="/dashboard">
                                <Button className="gap-2">
                                    <span className="material-icons text-sm">dashboard</span>
                                    대시보드로 이동
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardBody>
                            <SalaryEstimationPanel />
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}
