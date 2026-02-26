"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeProps } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { substituteApi } from "@/lib/api/substitutes";
import { openShiftApi } from "@/lib/api/openShift";
import { scheduleApi, UserScheduleRes } from "@/lib/api/schedules";
import { authApi } from "@/lib/api/auth";
import { storeApi } from "@/lib/api/stores";
import {
  SubstituteRequestRes,
  MySubstituteApplicationRes,
} from "@/types/substitute";
import { OpenShiftRes } from "@/types/openShift";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
  showWarningAlert,
} from "@/lib/ui/sweetAlert";

// 탭 키 타입 정의
type TabKey = "others" | "open-shifts" | "my-requests" | "my-applications";

const getStatusVariant = (status: string): BadgeProps["variant"] => {
  switch (status) {
    case "OPEN":
      return "info";
    case "PENDING":
    case "WAITING":
      return "warning";
    case "APPROVED":
    case "SELECTED":
      return "success";
    case "REJECTED":
    case "MANAGER_CANCELED":
      return "error";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    OPEN: "모집중",
    PENDING: "승인대기",
    APPROVED: "승인완료",
    REQUESTER_CANCELED: "요청취소",
    MANAGER_CANCELED: "관리자취소",
    WAITING: "결과대기",
    SELECTED: "선발됨",
    REJECTED: "거절됨",
    CANCELED: "지원취소",
  };
  return labels[status] || status;
};

// --- 필터 옵션 정의 ---
const SORT_OPTIONS = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
];

const OTHERS_REQUEST_STATUS_OPTIONS = [
  { label: "전체 상태", value: "ALL" },
  { label: "모집중", value: "OPEN" },
  { label: "승인대기", value: "PENDING" },
];

const MY_REQUEST_STATUS_OPTIONS = [
  { label: "전체 상태", value: "ALL" },
  { label: "모집중", value: "OPEN" },
  { label: "승인대기", value: "PENDING" },
  { label: "승인완료", value: "APPROVED" },
  { label: "요청취소", value: "REQUESTER_CANCELED" },
  { label: "관리자취소", value: "MANAGER_CANCELED" },
];

const APPLICATION_STATUS_OPTIONS = [
  { label: "전체 상태", value: "ALL" },
  { label: "결과대기", value: "WAITING" },
  { label: "선발됨", value: "SELECTED" },
  { label: "거절됨", value: "REJECTED" },
  { label: "지원취소", value: "CANCELED" },
];

function SubstitutesPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") ?? "";
  const [storeName, setStoreName] = useState("");

  // UI States
  const [activeTab, setActiveTab] = useState<TabKey>("others");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 필터 및 정렬 상태
  const [sortOrder, setSortOrder] = useState("latest");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Data States
  const [otherRequests, setOtherRequests] = useState<SubstituteRequestRes[]>(
    [],
  );
  const [openShifts, setOpenShifts] = useState<OpenShiftRes[]>([]);
  const [myRequests, setMyRequests] = useState<SubstituteRequestRes[]>([]);

  // 지원 내역 (대타 + 오픈시프트)
  const [myApplications, setMyApplications] = useState<
    MySubstituteApplicationRes[]
  >([]);
  const [myOpenShiftApplications, setMyOpenShiftApplications] = useState<any[]>(
    [],
  );

  // 로그인한 사용자 ID
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Modal Form States
  const [myShifts, setMyShifts] = useState<UserScheduleRes[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [requestReason, setRequestReason] = useState("");

  const currentStatusOptions =
    activeTab === "others"
      ? OTHERS_REQUEST_STATUS_OPTIONS
      : activeTab === "my-requests"
        ? MY_REQUEST_STATUS_OPTIONS
        : activeTab === "my-applications"
          ? APPLICATION_STATUS_OPTIONS
          : [];

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      try {
        const res = await storeApi.getStore(storeId);
        if (res.success && res.data) {
          const rawData = res.data as any;
          if (rawData.data && rawData.data.name) {
            setStoreName(rawData.data.name);
          } else if (rawData.name) {
            setStoreName(rawData.name);
          } else {
            setStoreName(`매장 ${storeId}`);
          }
        } else {
          setStoreName(`매장 ${storeId}`);
        }
      } catch (error) {
        console.error("Failed to fetch store info:", error);
        setStoreName(`매장 ${storeId}`);
      }
    };
    fetchStoreInfo();
  }, [storeId]);

  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await authApi.getCurrentUser();
        if (res.success && res.data) {
          setCurrentUserId((res.data as any).id);
        }
      } catch (e) {
        console.error("Failed to load user", e);
      }
    };
    initUser();
  }, []);

  // --- 3. 데이터 Fetching (정렬/필터 적용) ---
  const fetchData = async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      if (activeTab === "others") {
        const res = await substituteApi.getOtherRequests(
          storeId,
          sortOrder,
          filterStatus,
        );
        if (res.success && res.data) {
          const filteredData = res.data.filter(
            (req: any) => req.status == "OPEN" || req.status == "PENDING",
          );
          setOtherRequests(filteredData);
        }
      } else if (activeTab === "open-shifts") {
        const res: any = await openShiftApi.getList(storeId);
        let data: OpenShiftRes[] = [];
        if (Array.isArray(res)) data = res;
        else if (res?.data && Array.isArray(res.data)) data = res.data;
        else if (res?.success && Array.isArray(res?.data)) data = res.data;
        setOpenShifts(data);
      } else if (activeTab === "my-requests") {
        const res = await substituteApi.getMyRequests(
          storeId,
          sortOrder,
          filterStatus,
        );
        if (res.success && res.data) setMyRequests(res.data);
      } else if (activeTab === "my-applications") {
        // [수정됨] 데이터 구조를 안전하게 파싱하도록 개선
        try {
          const [subRes, osRes] = await Promise.all([
            substituteApi.getMyApplications(storeId, sortOrder, filterStatus),
            openShiftApi.getMyApplications(storeId).catch((e) => {
              console.error("오픈시프트 지원 내역 로딩 실패:", e);
              return null;
            }),
          ]);

          // 대타 지원 내역 처리
          if (subRes && subRes.success && subRes.data) {
            setMyApplications(subRes.data);
          } else {
            setMyApplications([]);
          }

          // 오픈시프트 지원 내역 안전한 파싱
          let osData: any[] = [];
          if (Array.isArray(osRes)) {
            osData = osRes;
          } else if (osRes && typeof osRes === "object") {
            const anyOsRes = osRes as any;
            if (Array.isArray(anyOsRes.data)) {
              osData = anyOsRes.data;
            } else if (anyOsRes.data && Array.isArray(anyOsRes.data.data)) {
              osData = anyOsRes.data.data;
            }
          }

          console.log("최종 세팅될 오픈시프트 지원 내역:", osData);
          setMyOpenShiftApplications(osData);
        } catch (err) {
          console.error("지원 내역 탭 렌더링 에러:", err);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId, activeTab, sortOrder, filterStatus]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSortOrder("latest");
    setFilterStatus("ALL");
  };

  const handleApply = async (requestId: number) => {
    const confirmed = await showConfirmAlert({
      title: "지원 확인",
      text: "이 대타 요청에 지원하시겠습니까?",
      confirmButtonText: "지원하기",
    });
    if (!confirmed) return;
    try {
      const res = await substituteApi.applySubstitute(storeId, requestId);
      if (res.success) {
        await showSuccessAlert(
          "지원 완료",
          "'지원 내역' 탭에서 결과를 확인하세요.",
        );
        fetchData();
      } else {
        await showErrorAlert("지원 실패", res.error?.message || "지원 실패");
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || "오류가 발생했습니다.";
      await showErrorAlert("오류 발생", msg);
    }
  };

  const handleApplyOpenShift = async (openShiftId: number) => {
    const confirmed = await showConfirmAlert({
      title: "지원 확인",
      text: "이 근무(오픈시프트)에 지원하시겠습니까?",
      confirmButtonText: "지원하기",
    });
    if (!confirmed) return;
    try {
      const res = await openShiftApi.apply(storeId, openShiftId);
      if (res.success) {
        await showSuccessAlert(
          "지원 완료",
          "관리자 승인 후 근무가 확정됩니다.",
        );
        fetchData();
      } else {
        await showErrorAlert("지원 실패", res.error?.message || "지원 실패");
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || "오류가 발생했습니다.";
      await showErrorAlert("오류 발생", msg);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    const confirmed = await showConfirmAlert({
      title: "요청 취소",
      text: "요청을 취소하시겠습니까?",
      confirmButtonText: "취소하기",
    });
    if (!confirmed) return;
    try {
      const res = await substituteApi.cancelRequest(storeId, requestId);
      if (res.success) {
        await showSuccessAlert("취소 완료", "요청이 취소되었습니다.");
        fetchData();
      } else {
        await showErrorAlert("취소 실패", res.error?.message || "취소 실패");
      }
    } catch (e) {
      await showErrorAlert("오류 발생", "오류가 발생했습니다.");
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    const confirmed = await showConfirmAlert({
      title: "지원 취소",
      text: "지원을 취소하시겠습니까?",
      confirmButtonText: "취소하기",
    });
    if (!confirmed) return;
    try {
      const res = await substituteApi.cancelApplication(storeId, applicationId);
      if (res.success) {
        await showSuccessAlert("취소 완료", "지원이 취소되었습니다.");
        fetchData();
      } else {
        await showErrorAlert("취소 실패", res.error?.message || "취소 실패");
      }
    } catch (e) {
      await showErrorAlert("오류 발생", "오류가 발생했습니다.");
    }
  };

  const openCreateModal = async () => {
    setIsModalOpen(true);
    setMyShifts([]);
    setSelectedShiftId("");
    setRequestReason("");

    let targetUserId: number | null = currentUserId;

    if (!targetUserId) {
      try {
        const userRes = await authApi.getCurrentUser();
        if (userRes.success && userRes.data) {
          targetUserId = (userRes.data as any).id;
          setCurrentUserId(targetUserId);
        } else {
          await showWarningAlert(
            "로그인 정보 확인 필요",
            "로그인 정보를 확인할 수 없습니다.",
          );
          return;
        }
      } catch (e) {
        console.error(e);
        return;
      }
    }

    if (!targetUserId) return;

    try {
      const res = await scheduleApi.getUserSchedules(
        storeId,
        targetUserId as number,
      );

      if (res.success && res.data) {
        const rawShifts = res.data as any[];
        const now = new Date();

        const validShifts = rawShifts
          .map((item) => ({
            id: item.shiftAssignmentId || item.id,
            date: item.workDate || item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            role: item.templateName || item.role,
          }))
          .filter((shift) => {
            if (!shift.date || !shift.endTime) return false;
            const shiftEnd = new Date(`${shift.date}T${shift.endTime}`);
            return shiftEnd > now;
          });

        validShifts.sort(
          (a, b) =>
            new Date(`${a.date}T${a.startTime}`).getTime() -
            new Date(`${b.date}T${b.startTime}`).getTime(),
        );

        setMyShifts(validShifts as UserScheduleRes[]);

        if (validShifts.length > 0) {
          setSelectedShiftId(String(validShifts[0].id));
        }
      }
    } catch (e) {
      console.error("스케줄 로딩 실패", e);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedShiftId) return;
    try {
      const res = await substituteApi.createRequest(storeId, {
        shiftAssignmentId: Number(selectedShiftId),
        reason: requestReason,
      });

      if (res.success) {
        await showSuccessAlert("등록 완료", "대타 요청이 등록되었습니다.");
        setIsModalOpen(false);
        setActiveTab("my-requests");
        setSortOrder("latest");
        setFilterStatus("ALL");
        setRequestReason("");
        fetchData();
      } else {
        await showErrorAlert("등록 실패", res.error?.message || "등록 실패");
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || "오류가 발생했습니다.";
      await showErrorAlert("오류 발생", msg);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                  {storeName} 대타 관리
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  대타를 구하거나, 동료의 근무를 대신해줄 수 있습니다.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button onClick={openCreateModal}>+ 대타 요청하기</Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-700 gap-4">
              <nav className="-mb-px flex gap-6 overflow-x-auto">
                <TabButton
                  label="대체 근무 요청"
                  active={activeTab === "others"}
                  onClick={() => handleTabChange("others")}
                />
                <TabButton
                  label="오픈시프트"
                  active={activeTab === "open-shifts"}
                  onClick={() => handleTabChange("open-shifts")}
                />
                <TabButton
                  label="내 요청 내역"
                  active={activeTab === "my-requests"}
                  onClick={() => handleTabChange("my-requests")}
                />
                <TabButton
                  label="지원 내역"
                  active={activeTab === "my-applications"}
                  onClick={() => handleTabChange("my-applications")}
                />
              </nav>

              {activeTab !== "open-shifts" && (
                <div className="flex items-center gap-3 pb-2 md:pb-0">
                  <select
                    className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-w-[100px]"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    {currentStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-w-[80px]"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="py-12 text-center text-slate-500">로딩 중...</div>
            )}

            {!isLoading && activeTab === "others" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {otherRequests.length > 0 ? (
                  otherRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      type="other"
                      onAction={() => handleApply(req.id)}
                    />
                  ))
                ) : (
                  <EmptyState message="해당 조건의 대타 요청이 없습니다." />
                )}
              </div>
            )}

            {!isLoading && activeTab === "open-shifts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {openShifts.length > 0 ? (
                  openShifts.map((os) => (
                    <Card
                      key={os.id}
                      className="h-full border-l-4 border-l-orange-400"
                    >
                      <CardBody className="flex flex-col h-full gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              관리자 긴급 모집
                            </p>
                            <p className="text-xs text-slate-500">
                              등록일: {os.createdAt?.split("T")[0]}
                            </p>
                          </div>
                          <Badge variant="info">모집중</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            📅 {os.workDate}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            ⏰ {os.startTime.substring(0, 5)} -{" "}
                            {os.endTime.substring(0, 5)}
                          </p>
                          {os.note && (
                            <p className="text-slate-500 mt-2">"{os.note}"</p>
                          )}
                        </div>
                        <div className="mt-auto">
                          <Button
                            onClick={() => handleApplyOpenShift(os.id)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none"
                          >
                            지원하기
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState message="현재 모집 중인 오픈시프트가 없습니다." />
                )}
              </div>
            )}

            {!isLoading && activeTab === "my-requests" && (
              <div className="space-y-4">
                {myRequests.length > 0 ? (
                  myRequests.map((req) => (
                    <RequestRow
                      key={req.id}
                      data={req}
                      type="request"
                      onAction={() => handleCancelRequest(req.id)}
                    />
                  ))
                ) : (
                  <EmptyState message="해당 조건의 대타 요청이 없습니다." />
                )}
              </div>
            )}

            {!isLoading && activeTab === "my-applications" && (
              <div className="space-y-6">
                {/* 대타 지원 내역 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b pb-2">
                    대타 지원 내역
                  </h3>
                  {myApplications.length > 0 ? (
                    myApplications.map((app) => (
                      <RequestRow
                        key={`sub-${app.applicationId}`}
                        data={app}
                        type="application"
                        onAction={() =>
                          handleCancelApplication(app.applicationId)
                        }
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded">
                      대타 지원 내역이 없습니다.
                    </div>
                  )}
                </div>

                {/* 오픈시프트 지원 내역 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b pb-2">
                    오픈시프트 (관리자 모집) 지원 내역
                  </h3>
                  {myOpenShiftApplications.length > 0 ? (
                    myOpenShiftApplications.map((app) => (
                      <OpenShiftApplicationRow
                        key={`os-${app.id}`}
                        data={app}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded">
                      오픈시프트 지원 내역이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="대타 요청 등록"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            대타가 필요한 근무를 선택하세요. (전체 스케줄 중 선택)
          </p>

          {myShifts.length > 0 ? (
            <select
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-sm"
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
            >
              <option value="">근무 선택</option>
              {myShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.date} ({shift.startTime.substring(0, 5)} -{" "}
                  {shift.endTime.substring(0, 5)})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-500 text-center">
              대타 요청이 가능한 미래의 근무 스케줄이 없습니다.
            </div>
          )}

          <textarea
            className="w-full p-3 border rounded h-24 dark:bg-slate-800 dark:border-slate-600 text-sm"
            placeholder="사유를 입력하세요"
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitRequest} disabled={!selectedShiftId}>
              등록
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// --- Sub Components ---

function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-slate-500 hover:text-primary"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
      {message}
    </div>
  );
}

function RequestCard({
  request,
  type,
  onAction,
}: {
  request: SubstituteRequestRes;
  type: "other";
  onAction: () => void;
}) {
  return (
    <Card className="h-full">
      <CardBody className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {request.requesterName}
            </p>
            <p className="text-xs text-slate-500">
              요청일: {request.createdAt.split("T")[0]}
            </p>
          </div>
          <Badge variant={getStatusVariant(request.status)}>
            {getStatusLabel(request.status)}
          </Badge>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            📅 {request.date}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            ⏰ {request.startTime.substring(0, 5)} -{" "}
            {request.endTime.substring(0, 5)}
          </p>
          {request.reason && (
            <p className="text-slate-500 mt-2">"{request.reason}"</p>
          )}
        </div>
        <div className="mt-auto">
          <Button onClick={onAction} className="w-full">
            지원하기
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function RequestRow({
  data,
  type,
  onAction,
}: {
  data: any;
  type: "request" | "application";
  onAction: () => void;
}) {
  const isCancelable =
    data.status === "OPEN" ||
    data.status === "PENDING" ||
    data.status === "WAITING";
  return (
    <Card>
      <CardBody className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge variant={getStatusVariant(data.status)}>
              {getStatusLabel(data.status)}
            </Badge>
            <span className="font-semibold text-slate-900 dark:text-white">
              {data.date} ({data.startTime.substring(0, 5)} -{" "}
              {data.endTime.substring(0, 5)})
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {type === "application"
              ? `요청자: ${data.requesterName || "알 수 없음"}`
              : `등록일: ${data.createdAt.split("T")[0]}`}
          </p>
        </div>
        {isCancelable && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            취소
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// [추가] 오픈시프트 전용 Row 컴포넌트
function OpenShiftApplicationRow({ data }: { data: any }) {
  // 오픈시프트 상태 매핑 (WAITING, ACCEPTED, REJECTED)
  const statusMap: Record<
    string,
    { label: string; variant: BadgeProps["variant"] }
  > = {
    WAITING: { label: "결과대기", variant: "warning" },
    ACCEPTED: { label: "선발됨", variant: "success" },
    REJECTED: { label: "거절됨", variant: "error" },
  };

  const currentStatus = statusMap[data.applyStatus] || {
    label: data.applyStatus,
    variant: "default",
  };

  return (
    <Card className="border-l-4 border-l-orange-400">
      <CardBody className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
            <span className="font-semibold text-slate-900 dark:text-white">
              {data.workDate} ({data.startTime?.substring(0, 5)} -{" "}
              {data.endTime?.substring(0, 5)})
            </span>
          </div>
          <p className="text-sm text-slate-500">
            지원일: {data.createdAt?.split("T")[0] || "알 수 없음"}
          </p>
        </div>
        {/* 오픈시프트는 현재 지원 취소 API가 없으므로 버튼 생략 */}
      </CardBody>
    </Card>
  );
}

export default function SubstitutesPage() {
  return (
    <Suspense fallback={null}>
      <SubstitutesPageContent />
    </Suspense>
  );
}
