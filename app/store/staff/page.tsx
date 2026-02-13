"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Employee, EmployeeStatus, Department } from "@/types/employee";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

const initialEmployees: Employee[] = [
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
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteStep, setInviteStep] = useState<"email" | "details" | "done">("email");
    const [email, setEmail] = useState("");
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [inviteError, setInviteError] = useState("");
    const [inviteDetails, setInviteDetails] = useState({
        firstName: "",
        lastName: "",
        role: "staff" as Employee["role"],
        department: "front_of_house" as Department,
        hourlyWage: "10000",
    });
    const [searchQuery, setSearchQuery] = useState("");

    const openInviteModal = () => {
        setIsInviteModalOpen(true);
        setInviteStep("email");
        setEmail("");
        setVerifiedEmail("");
        setInviteError("");
        setInviteDetails({
            firstName: "",
            lastName: "",
            role: "staff",
            department: "front_of_house",
            hourlyWage: "10000",
        });
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
    };

    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleVerifyEmail = () => {
        if (!isEmailFormatValid) {
            setInviteError("유효한 이메일 형식을 입력해주세요.");
            return;
        }
        if (employees.some((emp) => emp.email.toLowerCase() === email.toLowerCase())) {
            setInviteError("이미 등록된 이메일입니다.");
            return;
        }
        setInviteError("");
        setVerifiedEmail(email.trim());
        setInviteStep("details");
    };

    const handleCreateEmployee = () => {
        if (!inviteDetails.firstName || !inviteDetails.lastName) {
            setInviteError("이름과 성은 필수 입력입니다.");
            return;
        }

        const wage = Number(inviteDetails.hourlyWage);
        if (!Number.isFinite(wage) || wage <= 0) {
            setInviteError("시급은 0보다 큰 숫자여야 합니다.");
            return;
        }

        const newEmployee: Employee = {
            id: `invited-${Date.now()}`,
            firstName: inviteDetails.firstName.trim(),
            lastName: inviteDetails.lastName.trim(),
            email: verifiedEmail,
            role: inviteDetails.role,
            department: inviteDetails.department,
            hourlyWage: wage,
            status: "invited",
        };

        setEmployees((prev) => [newEmployee, ...prev]);
        setInviteError("");
        setInviteStep("done");
        console.log("Create employee:", newEmployee);
    };

    const filteredEmployees = employees.filter(
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
            render: (emp: Employee) =>
                emp.role === "manager" ? "관리자" : emp.role === "admin" ? "어드민" : "직원",
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
            <StoreSidebar />

            <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
                <MainHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                                    {storeName} 직원 관리
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    storeId: {storeId} 기준 팀원을 관리하고 새로운 직원을 초대하세요.
                                </p>
                            </div>
                            <div className="mt-4 flex md:mt-0 md:ml-4">
                                <Button onClick={openInviteModal} className="gap-2">
                                    <span className="material-icons text-sm">person_add</span>
                                    직원 초대
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            총 직원
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                            {employees.length}
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
                                            {employees.filter((e) => e.status === "active").length}
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
                                            {employees.filter((e) => e.status === "invited").length}
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
                                                employees.reduce((sum, e) => sum + e.hourlyWage, 0) /
                                                    Math.max(1, employees.length)
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-icons">payments</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

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

                        <Card>
                            <Table data={filteredEmployees} columns={columns} />
                        </Card>
                    </div>
                </main>
            </div>

            <Modal
                isOpen={isInviteModalOpen}
                onClose={closeInviteModal}
                title="새 직원 초대"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={`px-2 py-1 rounded-full ${
                                inviteStep === "email"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                        >
                            1. 이메일 검증
                        </span>
                        <span
                            className={`px-2 py-1 rounded-full ${
                                inviteStep === "details"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                        >
                            2. 직원 정보 입력
                        </span>
                        <span
                            className={`px-2 py-1 rounded-full ${
                                inviteStep === "done"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                        >
                            3. 생성 완료
                        </span>
                    </div>

                    {inviteStep === "email" && (
                        <>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                초대할 사용자의 이메일을 입력하고 먼저 검증하세요.
                            </p>
                            <Input
                                label="이메일 주소"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setInviteError("");
                                }}
                                placeholder="name@example.com"
                            />
                            {inviteError && (
                                <p className="text-sm text-red-500">{inviteError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={closeInviteModal}>
                                    취소
                                </Button>
                                <Button
                                    onClick={handleVerifyEmail}
                                    disabled={!isEmailFormatValid}
                                >
                                    이메일 검증
                                </Button>
                            </div>
                        </>
                    )}

                    {inviteStep === "details" && (
                        <>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                검증된 이메일:{" "}
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {verifiedEmail}
                                </span>
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="성"
                                    value={inviteDetails.lastName}
                                    onChange={(e) =>
                                        setInviteDetails((prev) => ({
                                            ...prev,
                                            lastName: e.target.value,
                                        }))
                                    }
                                    placeholder="김"
                                />
                                <Input
                                    label="이름"
                                    value={inviteDetails.firstName}
                                    onChange={(e) =>
                                        setInviteDetails((prev) => ({
                                            ...prev,
                                            firstName: e.target.value,
                                        }))
                                    }
                                    placeholder="철수"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        직급
                                    </label>
                                    <select
                                        value={inviteDetails.role}
                                        onChange={(e) =>
                                            setInviteDetails((prev) => ({
                                                ...prev,
                                                role: e.target.value as Employee["role"],
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="staff">직원</option>
                                        <option value="manager">관리자</option>
                                        <option value="admin">어드민</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        부서
                                    </label>
                                    <select
                                        value={inviteDetails.department}
                                        onChange={(e) =>
                                            setInviteDetails((prev) => ({
                                                ...prev,
                                                department: e.target.value as Department,
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="front_of_house">홀</option>
                                        <option value="kitchen">주방</option>
                                        <option value="delivery">배달</option>
                                        <option value="management">관리</option>
                                    </select>
                                </div>
                            </div>

                            <Input
                                label="시급 (원)"
                                type="number"
                                min="1"
                                value={inviteDetails.hourlyWage}
                                onChange={(e) =>
                                    setInviteDetails((prev) => ({
                                        ...prev,
                                        hourlyWage: e.target.value,
                                    }))
                                }
                                placeholder="10000"
                            />

                            {inviteError && (
                                <p className="text-sm text-red-500">{inviteError}</p>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setInviteStep("email");
                                        setInviteError("");
                                    }}
                                >
                                    이전
                                </Button>
                                <Button onClick={handleCreateEmployee}>
                                    직원 생성 완료
                                </Button>
                            </div>
                        </>
                    )}

                    {inviteStep === "done" && (
                        <>
                            <div className="rounded-lg border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/20 p-4">
                                <p className="text-green-700 dark:text-green-300 font-medium">
                                    직원 생성이 완료되었습니다.
                                </p>
                                <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-1">
                                    {verifiedEmail} 계정으로 초대가 전송되었습니다.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="secondary" onClick={openInviteModal}>
                                    다른 직원 추가
                                </Button>
                                <Button onClick={closeInviteModal}>닫기</Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
