"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { userApi } from "@/lib/api/users";
import { storeApi } from "@/lib/api/stores";

const STORE_NAMES: Record<string, string> = {
    "1": "강남점",
    "2": "홍대점",
    "3": "판교점",
    "4": "부산점",
};

type StoreMemberListResDto = {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    role: string;
    department: string;
    hourlyWage: number;
    status: string;
};

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

const isStoreMemberListResDto = (value: unknown): value is StoreMemberListResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<StoreMemberListResDto>;
    return (
        typeof candidate.id === "number" &&
        typeof candidate.userId === "number" &&
        typeof candidate.userName === "string" &&
        typeof candidate.userEmail === "string" &&
        typeof candidate.role === "string" &&
        typeof candidate.department === "string" &&
        typeof candidate.hourlyWage === "number" &&
        typeof candidate.status === "string"
    );
};

const parseStoreMembers = (rawData: unknown): StoreMemberListResDto[] => {
    if (Array.isArray(rawData)) {
        return rawData.filter(isStoreMemberListResDto);
    }

    if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
        return rawData.data.filter(isStoreMemberListResDto);
    }

    return [];
};

type ApiResponse<T> = {
    success: boolean;
    data: T | null;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    } | null;
};

type UserInfoResDto = {
    userId: number | null;
    name: string;
    email: string;
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return typeof (value as { success?: unknown }).success === "boolean";
};

const isUserInfoResDto = (value: unknown): value is UserInfoResDto => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<UserInfoResDto> & { id?: unknown };
    const userIdValue = candidate.userId ?? candidate.id;
    return (
        (typeof userIdValue === "number" ||
            typeof userIdValue === "string" ||
            userIdValue === undefined ||
            userIdValue === null) &&
        typeof candidate.name === "string" &&
        typeof candidate.email === "string"
    );
};

const parseUserInfo = (rawData: unknown): UserInfoResDto | null => {
    const normalize = (value: unknown): UserInfoResDto | null => {
        if (!isUserInfoResDto(value)) {
            return null;
        }

        const candidate = value as {
            userId?: number | string | null;
            id?: number | string | null;
            name: string;
            email: string;
        };

        const rawUserId = candidate.userId ?? candidate.id;
        const parsedUserId = Number(rawUserId);
        const userId =
            Number.isFinite(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;

        return {
            userId,
            name: candidate.name,
            email: candidate.email,
        };
    };

    const direct = normalize(rawData);
    if (direct) {
        return direct;
    }

    if (isApiEnvelope(rawData) && rawData.success && rawData.data) {
        return normalize(rawData.data);
    }

    return null;
};

const getErrorCode = (error: {
    code: string;
    details?: Record<string, unknown>;
}): string => {
    if (error.details && typeof error.details.code === "string") {
        return error.details.code;
    }

    if (
        error.details &&
        typeof error.details.error === "object" &&
        error.details.error !== null &&
        "code" in error.details.error &&
        typeof (error.details.error as { code?: unknown }).code === "string"
    ) {
        return (error.details.error as { code: string }).code;
    }

    return error.code;
};

const splitName = (name: string): { firstName: string; lastName: string } => {
    const trimmed = name.trim();
    if (trimmed.length <= 1) {
        return { firstName: trimmed, lastName: "" };
    }

    return {
        lastName: trimmed.slice(0, 1),
        firstName: trimmed.slice(1),
    };
};

const mapBackendRoleToEmployeeRole = (role: string): Employee["role"] => {
    const normalized = role.toUpperCase();
    if (normalized === "MANAGER") {
        return "manager";
    }
    if (normalized === "OWNER" || normalized === "ADMIN") {
        return "admin";
    }
    return "staff";
};

const mapBackendDepartmentToEmployeeDepartment = (
    department: string
): Department => {
    const normalized = department.toUpperCase();
    if (normalized === "KITCHEN") {
        return "kitchen";
    }
    if (normalized === "HALL" || normalized === "FRONT_OF_HOUSE") {
        return "front_of_house";
    }
    if (normalized === "DELIVERY") {
        return "delivery";
    }
    if (normalized === "MANAGEMENT") {
        return "management";
    }
    return "front_of_house";
};

function StaffManagementPageContent() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") || "1";
    const storeName = useMemo(
        () => STORE_NAMES[storeId] || `매장 ${storeId}`,
        [storeId]
    );

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [memberLoadError, setMemberLoadError] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteStep, setInviteStep] = useState<"email" | "details" | "done">("email");
    const [email, setEmail] = useState("");
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [verifiedUserInfo, setVerifiedUserInfo] = useState<UserInfoResDto | null>(null);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [isCreatingMember, setIsCreatingMember] = useState(false);
    const [inviteError, setInviteError] = useState("");
    const [inviteDetails, setInviteDetails] = useState({
        name: "",
        role: "STAFF",
        memberRank: "",
        department: "HALL",
        hourlyWage: "10000",
        minHoursPerWeek: "20",
        status: "INVITED",
        pinCode: "",
    });
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchMembers = async () => {
            setIsLoadingMembers(true);
            setMemberLoadError(null);

            if (!/^\d+$/.test(storeId)) {
                setMemberLoadError("유효하지 않은 매장 ID입니다.");
                setIsLoadingMembers(false);
                return;
            }

            const response = await storeApi.getStoreMembers(storeId);
            if (!response.success) {
                const code = response.error ? getErrorCode(response.error) : "";
                if (code === "STORE_NOT_FOUND") {
                    setMemberLoadError("매장을 찾을 수 없습니다.");
                } else if (code === "STORE_MEMBER_ACCESS_DENIED" || code === "403") {
                    setMemberLoadError("직원 조회 권한이 없습니다.");
                } else if (code === "INVALID_REQUEST" || code === "400") {
                    setMemberLoadError("요청 값이 올바르지 않습니다.");
                } else {
                    setMemberLoadError(
                        response.error?.message ?? "직원 목록을 불러오지 못했습니다."
                    );
                }
                setIsLoadingMembers(false);
                return;
            }

            const members = parseStoreMembers(response.data as unknown);
            const mappedEmployees: Employee[] = members.map((member) => {
                const name = member.userName.trim();
                const splitAt = name.length > 1 ? 1 : 0;
                const lastName = splitAt > 0 ? name.slice(0, splitAt) : "";
                const firstName = splitAt > 0 ? name.slice(splitAt) : name;

                return {
                    id: String(member.id),
                    firstName,
                    lastName,
                    email: member.userEmail,
                    role: mapBackendRoleToEmployeeRole(member.role),
                    department: mapBackendDepartmentToEmployeeDepartment(
                        member.department
                    ),
                    hourlyWage: member.hourlyWage,
                    status:
                        member.status.toUpperCase() === "ACTIVE"
                            ? "active"
                            : member.status.toUpperCase() === "INACTIVE"
                              ? "inactive"
                              : "invited",
                };
            });

            if (!cancelled) {
                setEmployees(mappedEmployees);
                setIsLoadingMembers(false);
            }
        };

        void fetchMembers();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    const openInviteModal = () => {
        setIsInviteModalOpen(true);
        setInviteStep("email");
        setEmail("");
        setVerifiedEmail("");
        setVerifiedUserInfo(null);
        setIsVerifyingEmail(false);
        setIsCreatingMember(false);
        setInviteError("");
        setInviteDetails({
            name: "",
            role: "STAFF",
            memberRank: "",
            department: "HALL",
            hourlyWage: "10000",
            minHoursPerWeek: "20",
            status: "INVITED",
            pinCode: "",
        });
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
    };

    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleVerifyEmail = async () => {
        if (!isEmailFormatValid) {
            setInviteError("유효한 이메일 형식을 입력해주세요.");
            return;
        }

        if (employees.some((emp) => emp.email.toLowerCase() === email.toLowerCase())) {
            setInviteError("이미 등록된 이메일입니다.");
            return;
        }

        const token = localStorage.getItem("auth_token");
        if (!token) {
            setInviteError("로그인이 필요합니다. 다시 로그인 후 시도해 주세요.");
            return;
        }

        setInviteError("");
        setIsVerifyingEmail(true);

        const normalizedEmail = email.trim();
        const response = await userApi.getUserInfoByEmail(normalizedEmail);

        if (!response.success) {
            const code = response.error ? getErrorCode(response.error) : "";
            if (code === "STORE_MEMBER_ACCESS_DENIED" || code === "403") {
                setInviteError("매장 멤버 관리 권한이 없습니다.");
            } else if (code === "MEMBER_NOT_FOUND" || code === "404") {
                setInviteError("해당 이메일의 사용자를 찾을 수 없습니다.");
            } else if (code === "INVALID_REQUEST" || code === "400") {
                setInviteError("이메일 값을 확인해 주세요.");
            } else {
                setInviteError(
                    response.error?.message ?? "사용자 정보 조회 중 오류가 발생했습니다."
                );
            }
            setVerifiedUserInfo(null);
            setIsVerifyingEmail(false);
            return;
        }

        const userInfo = parseUserInfo(response.data as unknown);
        if (!userInfo) {
            setInviteError("사용자 정보 응답 형식이 올바르지 않습니다.");
            setVerifiedUserInfo(null);
            setIsVerifyingEmail(false);
            return;
        }

        setVerifiedEmail(userInfo.email);
        setVerifiedUserInfo(userInfo);
        setInviteDetails((prev) => ({
            ...prev,
            name: userInfo.name,
        }));
        if (!userInfo.userId) {
            setInviteError(
                "사용자는 조회됐지만 userId가 응답에 없습니다. 담당자에게 API 응답에 userId 포함을 요청해 주세요."
            );
        }
        setIsVerifyingEmail(false);
    };

    const handleGoToDetailsStep = () => {
        if (!verifiedUserInfo || !verifiedUserInfo.userId) {
            setInviteError("먼저 이메일 검증을 진행해 주세요.");
            return;
        }

        setInviteError("");
        setInviteStep("details");
    };

    const handleCreateEmployee = () => {
        if (!inviteDetails.name.trim()) {
            setInviteError("이름 정보가 없습니다. 이메일 검증을 다시 진행해 주세요.");
            return;
        }

        if (!verifiedUserInfo || !verifiedUserInfo.userId) {
            setInviteError("검증된 사용자 정보(userId)가 없습니다. 이메일 검증을 다시 진행해 주세요.");
            return;
        }
        const userId = verifiedUserInfo.userId;

        const wage = Number(inviteDetails.hourlyWage);
        if (!Number.isFinite(wage) || wage <= 0) {
            setInviteError("시급은 0보다 큰 숫자여야 합니다.");
            return;
        }

        const minHoursPerWeek = Number(inviteDetails.minHoursPerWeek);
        if (!Number.isFinite(minHoursPerWeek) || minHoursPerWeek < 0) {
            setInviteError("최소 주간 근무시간은 0 이상의 숫자여야 합니다.");
            return;
        }

        if (inviteDetails.pinCode && !/^\d{4,6}$/.test(inviteDetails.pinCode)) {
            setInviteError("PIN 코드는 4~6자리 숫자여야 합니다.");
            return;
        }

        const parsedName = splitName(inviteDetails.name);

        const payload: {
            email: string;
            role: string;
            department: string;
            minHoursPerWeek: number;
            memberRank?: string;
            hourlyWage?: number;
            status?: string;
            pinCode?: string;
        } = {
            email: verifiedEmail,
            role: inviteDetails.role,
            department: inviteDetails.department,
            minHoursPerWeek,
        };

        if (inviteDetails.memberRank.trim()) {
            payload.memberRank = inviteDetails.memberRank.trim();
        }
        if (Number.isFinite(wage)) {
            payload.hourlyWage = wage;
        }
        if (inviteDetails.status.trim()) {
            payload.status = inviteDetails.status.trim();
        }
        if (inviteDetails.pinCode.trim()) {
            payload.pinCode = inviteDetails.pinCode.trim();
        }

        const createMember = async () => {
            if (!/^\d+$/.test(storeId)) {
                setInviteError("유효하지 않은 매장 ID입니다.");
                return;
            }

            setIsCreatingMember(true);

            const response = await storeApi.createStoreMember(
                storeId,
                userId,
                payload
            );
            if (!response.success) {
                const code = response.error ? getErrorCode(response.error) : "";
                if (code === "STORE_ACCESS_DENIED" || code === "403") {
                    setInviteError("직원 생성 권한이 없습니다.");
                } else if (code === "STORE_NOT_FOUND") {
                    setInviteError("매장을 찾을 수 없습니다.");
                } else if (code === "MEMBER_NOT_FOUND") {
                    setInviteError("이메일에 해당하는 사용자를 찾을 수 없습니다.");
                } else if (code === "STORE_MEMBER_ALREADY_EXISTS" || code === "409") {
                    setInviteError("이미 해당 매장에 등록된 멤버입니다.");
                } else if (code === "INVALID_REQUEST" || code === "400") {
                    setInviteError("입력 값을 확인해 주세요.");
                } else {
                    setInviteError(
                        response.error?.message ?? "직원 생성 중 오류가 발생했습니다."
                    );
                }
                setIsCreatingMember(false);
                return;
            }

            const newEmployee: Employee = {
                id: `member-${Date.now()}`,
                firstName: parsedName.firstName,
                lastName: parsedName.lastName,
                email: verifiedEmail,
                role: mapBackendRoleToEmployeeRole(inviteDetails.role),
                department: mapBackendDepartmentToEmployeeDepartment(
                    inviteDetails.department
                ),
                hourlyWage: wage,
                status: inviteDetails.status === "ACTIVE" ? "active" : "invited",
            };

            setEmployees((prev) => [newEmployee, ...prev]);
            setInviteError("");
            setInviteStep("done");
            setIsCreatingMember(false);
        };

        void createMember();
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
                        {(emp.lastName || emp.firstName || "?")[0]}
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
            render: (emp: Employee) => (
                <Link
                    href={`/store/staff/preferences?storeId=${storeId}&memberId=${emp.id}&employeeName=${encodeURIComponent(
                        `${emp.lastName}${emp.firstName}`
                    )}`}
                >
                    <Button variant="ghost" size="sm">
                        <span className="material-icons text-sm">tune</span>
                    </Button>
                </Link>
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
                            {isLoadingMembers && (
                                <CardBody className="py-8 text-center text-slate-500 dark:text-slate-400">
                                    직원 목록을 불러오는 중입니다...
                                </CardBody>
                            )}

                            {!isLoadingMembers && memberLoadError && (
                                <CardBody className="py-8 text-center text-red-600 dark:text-red-400">
                                    {memberLoadError}
                                </CardBody>
                            )}

                            {!isLoadingMembers && !memberLoadError && (
                                <Table data={filteredEmployees} columns={columns} />
                            )}
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
                                    setVerifiedUserInfo(null);
                                    setInviteError("");
                                }}
                                placeholder="name@example.com"
                            />
                            {verifiedUserInfo && (
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-1">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        조회된 사용자
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {verifiedUserInfo.name}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {verifiedUserInfo.email}
                                    </p>
                                </div>
                            )}
                            {inviteError && (
                                <p className="text-sm text-red-500">{inviteError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={closeInviteModal}>
                                    취소
                                </Button>
                                <Button
                                    onClick={() => void handleVerifyEmail()}
                                    disabled={!isEmailFormatValid || isVerifyingEmail}
                                >
                                    {isVerifyingEmail ? "검증 중..." : "이메일 검증"}
                                </Button>
                                <Button
                                    onClick={handleGoToDetailsStep}
                                    disabled={!verifiedUserInfo || !verifiedUserInfo.userId}
                                >
                                    다음 단계
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

                            <Input
                                label="이름"
                                value={inviteDetails.name}
                                disabled
                                onChange={() => {}}
                                placeholder="이름"
                            />

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
                                                role: e.target.value,
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="STAFF">직원</option>
                                        <option value="MANAGER">관리자</option>
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
                                                department: e.target.value,
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="HALL">홀</option>
                                        <option value="KITCHEN">주방</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        멤버 등급 (선택)
                                    </label>
                                    <select
                                        value={inviteDetails.memberRank}
                                        onChange={(e) =>
                                            setInviteDetails((prev) => ({
                                                ...prev,
                                                memberRank: e.target.value,
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="">선택 안 함</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="STAFF">STAFF</option>
                                        <option value="PART_TIME">PART_TIME</option>
                                    </select>
                                </div>
                                <Input
                                    label="주간 최소 근무시간"
                                    type="number"
                                    min="0"
                                    value={inviteDetails.minHoursPerWeek}
                                    onChange={(e) =>
                                        setInviteDetails((prev) => ({
                                            ...prev,
                                            minHoursPerWeek: e.target.value,
                                        }))
                                    }
                                    placeholder="20"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        상태 (선택)
                                    </label>
                                    <select
                                        value={inviteDetails.status}
                                        onChange={(e) =>
                                            setInviteDetails((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
                                    >
                                        <option value="INVITED">INVITED</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="PIN 코드 (선택, 4~6자리 숫자)"
                                value={inviteDetails.pinCode}
                                onChange={(e) =>
                                    setInviteDetails((prev) => ({
                                        ...prev,
                                        pinCode: e.target.value,
                                    }))
                                }
                                placeholder="1234"
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
                                <Button
                                    onClick={handleCreateEmployee}
                                    disabled={isCreatingMember}
                                >
                                    {isCreatingMember ? "생성 중..." : "직원 생성 완료"}
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

export default function StaffManagementPage() {
  return (
    <Suspense fallback={null}>
      <StaffManagementPageContent />
    </Suspense>
  );
}
