"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Employee, EmployeeStatus, Department } from "@/types/employee";

// Mock data
const mockEmployees: Employee[] = [
    {
        id: "1",
        firstName: "철수",
        lastName: "김",
        email: "kim@example.com",
        role: "staff",
        department: "kitchen",
        hourlyWage: 12000,
        status: "active",
    },
    {
        id: "2",
        firstName: "영희",
        lastName: "이",
        email: "lee@example.com",
        role: "staff",
        department: "front_of_house",
        hourlyWage: 11000,
        status: "active",
    },
    {
        id: "3",
        firstName: "민수",
        lastName: "박",
        email: "park@example.com",
        role: "manager",
        department: "management",
        hourlyWage: 15000,
        status: "active",
    },
    {
        id: "4",
        firstName: "지은",
        lastName: "최",
        email: "choi@example.com",
        role: "staff",
        department: "delivery",
        hourlyWage: 10000,
        status: "invited",
    },
];

const navItems = [
    { label: "대시보드", href: "/manager", icon: "dashboard" },
    { label: "직원 관리", href: "/manager/staff", icon: "people" },
    { label: "대체 요청", href: "/manager/requests", icon: "swap_horiz" },
];

const getDepartmentLabel = (dept: Department): string => {
    const labels: Record<Department, string> = {
        kitchen: "주방",
        front_of_house: "홀",
        delivery: "배달",
        management: "관리",
    };
    return labels[dept];
};

const getStatusVariant = (
    status: EmployeeStatus
): "success" | "warning" | "default" => {
    switch (status) {
        case "active":
            return "success";
        case "invited":
            return "warning";
        default:
            return "default";
    }
};

const getStatusLabel = (status: EmployeeStatus): string => {
    const labels: Record<EmployeeStatus, string> = {
        active: "활성",
        invited: "초대됨",
        inactive: "비활성",
    };
    return labels[status];
};

export default function StaffManagementPage() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const handleInvite = () => {
        console.log("Invite:", email);
        setEmail("");
        setIsInviteModalOpen(false);
        // TODO: API 연동
    };

    const filteredEmployees = mockEmployees.filter(
        (emp) =>
            emp.firstName.includes(searchQuery) ||
            emp.lastName.includes(searchQuery) ||
            emp.email.includes(searchQuery)
    );

    const columns = [
        {
            key: "name",
            header: "이름",
            render: (emp: Employee) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {emp.lastName[0]}
                    </div>
                    <div>
                        <p className="font-medium">
                            {emp.lastName}
                            {emp.firstName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {emp.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: "department",
            header: "부서",
            render: (emp: Employee) => getDepartmentLabel(emp.department),
        },
        {
            key: "role",
            header: "역할",
            render: (emp: Employee) => (emp.role === "manager" ? "관리자" : "직원"),
        },
        {
            key: "hourlyWage",
            header: "시급",
            render: (emp: Employee) => `₩${emp.hourlyWage.toLocaleString()}`,
        },
        {
            key: "status",
            header: "상태",
            render: (emp: Employee) => (
                <Badge variant={getStatusVariant(emp.status)}>
                    {getStatusLabel(emp.status)}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            render: () => (
                <Button variant="ghost" size="sm">
                    <span className="material-icons text-sm">more_vert</span>
                </Button>
            ),
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar navItems={navItems} userRole="manager" />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    직원 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    팀원을 관리하고 새로운 직원을 초대하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <Button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="gap-2"
                                >
                                    <span className="material-icons text-sm">person_add</span>
                                    직원 초대
                                </Button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockEmployees.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-icons">people</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            활성 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockEmployees.filter((e) => e.status === "active").length}
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
                                            초대 대기
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {mockEmployees.filter((e) => e.status === "invited").length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <span className="material-icons">mail</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            평균 시급
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            ₩
                                            {Math.round(
                                                mockEmployees.reduce((sum, e) => sum + e.hourlyWage, 0) /
                                                mockEmployees.length
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">payments</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Search and Filters */}
                        <Card>
                            <CardBody className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="이름 또는 이메일로 검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        icon={<span className="material-icons text-sm">search</span>}
                                    />
                                </div>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">filter_list</span>
                                    필터
                                </Button>
                                <Button variant="secondary" className="gap-2">
                                    <span className="material-icons text-sm">sort</span>
                                    정렬
                                </Button>
                            </CardBody>
                        </Card>

                        {/* Employee Table */}
                        <Card>
                            <Table data={filteredEmployees} columns={columns} />
                        </Card>
                    </div>
                </main>
            </div>

            {/* Invite Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="새 직원 초대"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        새로운 팀원을 초대하려면 이메일 주소를 입력하세요. 초대 링크가
                        전송됩니다.
                    </p>
                    <Input
                        label="이메일 주소"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => setIsInviteModalOpen(false)}
                        >
                            취소
                        </Button>
                        <Button onClick={handleInvite} disabled={!email}>
                            초대 보내기
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
