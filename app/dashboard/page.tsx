"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StoreCard } from "@/components/domain/StoreCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Store } from "@/types/store";

// Mock data - 실제로는 API에서 가져올 데이터
const mockStores: Store[] = [
    {
        id: "1",
        name: "강남점",
        code: "GN-001",
        location: "서울",
        status: "open",
        activeStaff: 12,
        shiftCoverage: 75,
    },
    {
        id: "2",
        name: "홍대점",
        code: "HD-045",
        location: "서울",
        status: "open",
        activeStaff: 8,
        shiftCoverage: 92,
    },
    {
        id: "3",
        name: "판교점",
        code: "PG-112",
        location: "경기",
        status: "opening_soon",
        activeStaff: 0,
        shiftCoverage: 0,
    },
    {
        id: "4",
        name: "부산점",
        code: "BS-889",
        location: "부산",
        status: "open",
        activeStaff: 4,
        shiftCoverage: 30,
    },
];

const navItems = [
    { label: "대시보드", href: "/dashboard", icon: "dashboard" },
    { label: "직원", href: "/dashboard/staff", icon: "people" },
    { label: "리포트", href: "/dashboard/reports", icon: "insert_chart" },
];

export default function DashboardPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="manager" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header Section */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    매장 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    관리 중인 모든 매장의 개요입니다.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">filter_list</span>
                                    필터
                                </Button>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">sort</span>
                                    정렬
                                </Button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 매장
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockStores.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">store</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            영업 중
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockStores.filter((s) => s.status === "open").length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <span className="material-icons">check_circle</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockStores.reduce((sum, s) => sum + s.activeStaff, 0)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">people</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Store Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockStores.map((store) => (
                                <StoreCard key={store.id} store={store} />
                            ))}

                            {/* Add Store Card */}
                            <button className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 h-full min-h-[300px] text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-surface-dark flex items-center justify-center mb-4 transition-colors shadow-sm group-hover:shadow-md">
                                    <span className="material-icons text-3xl text-slate-400 group-hover:text-primary transition-colors">
                                        add
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary mb-1">
                                    새 매장 추가
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
                                    새로운 매장을 등록하여 일정 관리를 시작하세요.
                                </p>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
