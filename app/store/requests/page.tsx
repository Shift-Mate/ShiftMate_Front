"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeProps } from "@/components/ui/Badge";
import { substituteApi } from "@/lib/api/substitutes";
import {
  SubstituteRequestRes,
  SubstituteApplicationRes,
  RequestStatus,
} from "@/types/substitute";
import { storeApi } from "@/lib/api/stores";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const getRequestStatusVariant = (status: RequestStatus): BadgeVariant => {
  switch (status) {
    case "OPEN":
      return "info";
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "success";
    case "REQUESTER_CANCELED":
      return "default";
    case "MANAGER_CANCELED":
      return "error";
    default:
      return "default";
  }
};

const getRequestStatusLabel = (status: RequestStatus): string => {
  switch (status) {
    case "OPEN":
      return "모집중";
    case "PENDING":
      return "승인대기";
    case "APPROVED":
      return "승인완료";
    case "REQUESTER_CANCELED":
      return "요청자취소";
    case "MANAGER_CANCELED":
      return "관리자취소";
    default:
      return status;
  }
};

// --- 필터 옵션 ---
const SORT_OPTIONS = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
];

const REQUEST_STATUS_OPTIONS = [
  { label: "전체 상태", value: "ALL" },
  { label: "모집중", value: "OPEN" },
  { label: "승인대기", value: "PENDING" },
  { label: "승인완료", value: "APPROVED" },
  { label: "요청취소", value: "REQUESTER_CANCELED" },
  { label: "관리자취소", value: "MANAGER_CANCELED" },
];

const APPLICANT_STATUS_OPTIONS = [
  { label: "전체 상태", value: "ALL" },
  { label: "결과대기", value: "WAITING" },
  { label: "선발됨", value: "SELECTED" },
  { label: "거절됨", value: "REJECTED" },
  { label: "취소됨", value: "CANCELED" },
];

function ManagerRequestsPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";
  const [storeName, setStoreName] = useState("");

  // Data States
  const [requests, setRequests] = useState<SubstituteRequestRes[]>([]); // 필터링된 목록용
  const [allRequests, setAllRequests] = useState<SubstituteRequestRes[]>([]); // 통계용 전체 목록
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [applicants, setApplicants] = useState<SubstituteApplicationRes[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  // Filter & Sort States (Requests)
  const [reqSort, setReqSort] = useState("latest");
  const [reqFilter, setReqFilter] = useState("ALL");

  // Filter & Sort States (Applicants)
  const [appSort, setAppSort] = useState("latest");
  const [appFilter, setAppFilter] = useState("ALL");

  // 1. 매장 정보 로드
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

  // 2-1. 전체 통계용 데이터 불러오기 (필터 무시)
  const fetchAllRequests = async () => {
    if (!storeId) return;
    try {
      const response = await substituteApi.getAllRequests(
        storeId,
        "latest",
        "ALL",
      );
      if (response.success && response.data) {
        setAllRequests(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch all stats:", error);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, [storeId]);

  // 2-2. 목록 표시용 데이터 불러오기 (필터 적용)
  const fetchRequests = async () => {
    if (!storeId) return;
    setIsLoadingRequests(true);
    try {
      const response = await substituteApi.getAllRequests(
        storeId,
        reqSort,
        reqFilter,
      );
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, reqSort, reqFilter]);

  // 3. 선택된 요청의 지원자 목록 불러오기 (필터 적용)
  useEffect(() => {
    const fetchApplicants = async () => {
      if (!storeId || !selectedRequestId) {
        setApplicants([]);
        return;
      }
      setIsLoadingApplicants(true);
      try {
        const response = await substituteApi.getApplicants(
          storeId,
          selectedRequestId,
          appSort,
          appFilter,
        );
        if (response.success && response.data) {
          setApplicants(response.data);
        } else {
          setApplicants([]);
        }
      } catch (error) {
        console.error("Failed to fetch applicants:", error);
        setApplicants([]);
      } finally {
        setIsLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [storeId, selectedRequestId, appSort, appFilter]);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  // 4. 액션 핸들러들
  const handleAcceptApplicant = async (applicationId: number) => {
    if (!storeId || !selectedRequestId) return;
    if (!confirm("해당 직원을 대타 근무자로 승인하시겠습니까?")) return;

    try {
      const response = await substituteApi.approveApplication(
        storeId,
        selectedRequestId,
        applicationId,
      );
      if (response.success) {
        alert("승인되었습니다.");
        fetchRequests(); // 목록 갱신
        fetchAllRequests(); // 통계 갱신
      } else {
        alert(response.error?.message || "처리 실패");
      }
    } catch (e) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleRejectApplicant = async (applicationId: number) => {
    if (!storeId || !selectedRequestId) return;
    if (!confirm("지원을 거절하시겠습니까?")) return;

    try {
      await substituteApi.rejectApplication(
        storeId,
        selectedRequestId,
        applicationId,
      );
      // 지원자 목록만 갱신 (요청 상태가 변하지 않으므로 전체 통계 갱신 불필요)
      const response = await substituteApi.getApplicants(
        storeId,
        selectedRequestId,
        appSort,
        appFilter,
      );
      if (response.success && response.data) {
        setApplicants(response.data);
      }
    } catch (e) {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleCancelRequest = async () => {
    if (!storeId || !selectedRequestId) return;
    if (!confirm("정말 이 대타 요청을 취소하시겠습니까?")) return;

    try {
      const response = await substituteApi.managerCancelRequest(
        storeId,
        selectedRequestId,
      );
      if (response.success) {
        alert("요청이 취소되었습니다.");
        fetchRequests(); // 목록 갱신
        fetchAllRequests(); // 통계 갱신
        setSelectedRequestId(null);
      } else {
        alert(response.error?.message || "취소 실패");
      }
    } catch (e) {
      alert("서버 통신 오류");
    }
  };

  // 통계 계산 (allRequests 기준)
  const activeCount = allRequests.filter(
    (r) => r.status === "OPEN" || r.status === "PENDING",
  ).length;
  const processedCount = allRequests.filter(
    (r) =>
      r.status === "APPROVED" ||
      r.status === "REQUESTER_CANCELED" ||
      r.status === "MANAGER_CANCELED",
  ).length;
  const totalCount = allRequests.length;

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
                  {storeName} 대체 근무 요청 관리
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  요청을 선택하면 우측에서 대타 지원자 목록을 확인하고 수락할 수
                  있습니다.
                </p>
              </div>
            </div>

            {/* 상단 통계 카드 (필터 무시) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      진행 중 (모집/대기)
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {activeCount}
                    </p>
                  </div>
                  <span className="material-icons text-yellow-500">
                    pending
                  </span>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      처리 완료
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {processedCount}
                    </p>
                  </div>
                  <span className="material-icons text-green-500">
                    check_circle
                  </span>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      전체 요청
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {totalCount}
                    </p>
                  </div>
                  <span className="material-icons text-primary">
                    swap_horiz
                  </span>
                </CardBody>
              </Card>
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
              {/* 좌측: 요청 목록 */}
              <section className="space-y-6">
                <div className="space-y-4">
                  {/* 요청 목록 헤더 & 필터 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      요청 목록
                    </h3>
                    <div className="flex gap-2">
                      <select
                        className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                        value={reqFilter}
                        onChange={(e) => setReqFilter(e.target.value)}
                      >
                        {REQUEST_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                        value={reqSort}
                        onChange={(e) => setReqSort(e.target.value)}
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {requests.length > 0 ? (
                    <div className="grid gap-4">
                      {requests.map((request) => {
                        const isSelected = request.id === selectedRequestId;
                        return (
                          <button
                            type="button"
                            key={request.id}
                            onClick={() => setSelectedRequestId(request.id)}
                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {request.requesterName}님의 대타 요청
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                  {request.date} /{" "}
                                  {request.startTime.substring(0, 5)} -{" "}
                                  {request.endTime.substring(0, 5)}
                                </p>
                              </div>
                              <Badge
                                variant={getRequestStatusVariant(
                                  request.status,
                                )}
                              >
                                {getRequestStatusLabel(request.status)}
                              </Badge>
                            </div>
                            {request.reason && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                                사유: {request.reason}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardBody className="text-center py-10">
                        <p className="text-slate-500 dark:text-slate-400">
                          표시할 요청 내역이 없습니다.
                        </p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </section>

              {/* 우측: 상세 및 지원자 관리 */}
              <aside className="lg:sticky lg:top-6 h-fit">
                <Card className="h-full border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardBody className="space-y-6">
                    {selectedRequest ? (
                      <>
                        {/* 선택된 요청 헤더 & 취소 버튼 */}
                        <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                상세 정보
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                요청 ID: #{selectedRequest.id}
                              </p>
                            </div>

                            {/* 진행 중일 때만 취소 가능 */}
                            {(selectedRequest.status === "OPEN" ||
                              selectedRequest.status === "PENDING") && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
                                onClick={handleCancelRequest}
                              >
                                요청 취소
                              </Button>
                            )}
                          </div>

                          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {selectedRequest.requesterName}
                              </span>
                              <Badge
                                variant={getRequestStatusVariant(
                                  selectedRequest.status,
                                )}
                              >
                                {getRequestStatusLabel(selectedRequest.status)}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                              <p>📅 {selectedRequest.date}</p>
                              <p>
                                ⏰ {selectedRequest.startTime.substring(0, 5)} -{" "}
                                {selectedRequest.endTime.substring(0, 5)}
                              </p>
                              {selectedRequest.reason && (
                                <p className="pt-2 text-xs text-slate-500">
                                  "{selectedRequest.reason}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 지원자 목록 */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              지원 현황 ({applicants.length})
                            </h4>
                            {/* 지원자 필터 */}
                            <div className="flex gap-1">
                              <select
                                className="p-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                value={appFilter}
                                onChange={(e) => setAppFilter(e.target.value)}
                              >
                                {APPLICANT_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="p-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                value={appSort}
                                onChange={(e) => setAppSort(e.target.value)}
                              >
                                {SORT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {isLoadingApplicants ? (
                            <p className="text-center text-sm py-4 text-slate-500">
                              불러오는 중...
                            </p>
                          ) : applicants.length > 0 ? (
                            applicants.map((applicant) => (
                              <div
                                key={applicant.applicationId}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                      {applicant.applicantName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {applicant.applicantPhone}
                                    </p>
                                  </div>
                                  {applicant.status === "SELECTED" && (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                      승인됨
                                    </span>
                                  )}
                                  {applicant.status === "REJECTED" && (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                      거절됨
                                    </span>
                                  )}
                                  {applicant.status === "CANCELED" && (
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                      취소됨
                                    </span>
                                  )}
                                </div>

                                {/* 액션 버튼 (지원자는 대기중(WAITING)이고, 요청도 아직 열려있을 때 표시) */}
                                {applicant.status === "WAITING" &&
                                  (selectedRequest.status === "OPEN" ||
                                    selectedRequest.status === "PENDING") && (
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
                                        onClick={() =>
                                          handleAcceptApplicant(
                                            applicant.applicationId,
                                          )
                                        }
                                      >
                                        수락
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="flex-1 h-8"
                                        onClick={() =>
                                          handleRejectApplicant(
                                            applicant.applicationId,
                                          )
                                        }
                                      >
                                        거절
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                              표시할 지원자가 없습니다.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                        <span className="material-icons text-4xl mb-2 opacity-50">
                          touch_app
                        </span>
                        <p>좌측 목록에서 요청을 선택하세요.</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ManagerRequestsPage() {
  return (
    <Suspense fallback={null}>
      <ManagerRequestsPageContent />
    </Suspense>
  );
}
