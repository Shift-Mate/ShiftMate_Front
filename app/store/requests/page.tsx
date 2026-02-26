"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeProps } from "@/components/ui/Badge";
import { substituteApi } from "@/lib/api/substitutes";
import { openShiftApi } from "@/lib/api/openShift";
import { storeApi } from "@/lib/api/stores";
import {
  SubstituteRequestRes,
  SubstituteApplicationRes,
  RequestStatus,
} from "@/types/substitute";
import { OpenShiftRes, OpenShiftApplyRes } from "@/types/openShift";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
type RequestCategory = "substitute" | "openshift";

// --- Helper Functions ---
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

  // 탭 상태 (대타 관리 vs 오픈시프트 관리)
  const [category, setCategory] = useState<RequestCategory>("substitute");

  // =========================
  // 1. Substitute Data States
  // =========================
  const [requests, setRequests] = useState<SubstituteRequestRes[]>([]);
  const [allRequests, setAllRequests] = useState<SubstituteRequestRes[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [applicants, setApplicants] = useState<SubstituteApplicationRes[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  const [reqSort, setReqSort] = useState("latest");
  const [reqFilter, setReqFilter] = useState("ALL");
  const [appSort, setAppSort] = useState("latest");
  const [appFilter, setAppFilter] = useState("ALL");

  // =========================
  // 2. OpenShift Data States
  // =========================
  const [openShifts, setOpenShifts] = useState<OpenShiftRes[]>([]);
  const [selectedOpenShiftId, setSelectedOpenShiftId] = useState<number | null>(
    null,
  );
  const [openShiftApplicants, setOpenShiftApplicants] = useState<
    OpenShiftApplyRes[]
  >([]);
  const [isLoadingOpenShifts, setIsLoadingOpenShifts] = useState(false);
  const [isLoadingOpenShiftApps, setIsLoadingOpenShiftApps] = useState(false);

  // --- 매장 정보 로드 ---
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

  // =========================
  // Substitute API Logic
  // =========================
  const fetchAllSubstituteRequests = async () => {
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

  const fetchSubstituteRequests = async () => {
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
    if (category === "substitute") {
      fetchAllSubstituteRequests();
      fetchSubstituteRequests();
    }
  }, [storeId, category, reqSort, reqFilter]);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!storeId || !selectedRequestId || category !== "substitute") {
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
  }, [storeId, selectedRequestId, appSort, appFilter, category]);

  // =========================
  // OpenShift API Logic
  // =========================
  const fetchOpenShifts = async () => {
    if (!storeId) return;
    setIsLoadingOpenShifts(true);
    try {
      const res = await openShiftApi.getList(storeId);
      if (res.success && res.data) {
        setOpenShifts(res.data);
      } else {
        setOpenShifts([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingOpenShifts(false);
    }
  };

  useEffect(() => {
    if (category === "openshift") {
      fetchOpenShifts();
    }
  }, [storeId, category]);

  useEffect(() => {
    const fetchOpenShiftApps = async () => {
      if (!storeId || !selectedOpenShiftId || category !== "openshift") {
        setOpenShiftApplicants([]);
        return;
      }
      setIsLoadingOpenShiftApps(true);
      try {
        const res = await openShiftApi.getApplicants(
          storeId,
          selectedOpenShiftId,
        );
        if (res.success && res.data) {
          setOpenShiftApplicants(res.data);
        } else {
          setOpenShiftApplicants([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingOpenShiftApps(false);
      }
    };
    fetchOpenShiftApps();
  }, [storeId, selectedOpenShiftId, category]);

  // =========================
  // Handlers (Substitute)
  // =========================
  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

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
        fetchSubstituteRequests();
        fetchAllSubstituteRequests();
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
      // 지원자 목록만 갱신
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
        fetchSubstituteRequests();
        fetchAllSubstituteRequests();
        setSelectedRequestId(null);
      } else {
        alert(response.error?.message || "취소 실패");
      }
    } catch (e) {
      alert("서버 통신 오류");
    }
  };

  // =========================
  // Handlers (OpenShift)
  // =========================
  const handleApproveOpenShiftApply = async (applyId: number) => {
    if (!storeId || !selectedOpenShiftId) return;
    if (!confirm("이 지원자를 승인하시겠습니까?")) return;

    try {
      const res = await openShiftApi.approve(
        storeId,
        selectedOpenShiftId,
        applyId,
      );
      if (res.success) {
        alert("승인되었습니다. 해당 직원의 스케줄이 생성됩니다.");
        // 목록 갱신 (마감 여부 확인)
        fetchOpenShifts();
        // 지원자 목록 갱신 (상태 변경 확인)
        const appsRes = await openShiftApi.getApplicants(
          storeId,
          selectedOpenShiftId,
        );
        if (appsRes.success && appsRes.data)
          setOpenShiftApplicants(appsRes.data);
      } else {
        alert(res.error?.message || "승인 실패");
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || "오류가 발생했습니다.";
      alert(msg);
    }
  };

  // Substitute Stat Calculations
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
                  {storeName} 요청/지원 관리
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  직원들의 대타 요청과 오픈시프트 지원을 관리합니다.
                </p>
              </div>
            </div>

            {/* 상단 탭 (카테고리 전환) */}
            <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCategory("substitute")}
                className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  category === "substitute"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                대타 요청 관리
              </button>
              <button
                onClick={() => setCategory("openshift")}
                className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  category === "openshift"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                오픈시프트 관리
              </button>
            </div>

            {/* =======================================================
                CATEGORY: SUBSTITUTE (대타 요청 관리)
               ======================================================= */}
            {category === "substitute" && (
              <>
                {/* 상단 통계 카드 */}
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

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
                  {/* 좌측: 요청 목록 */}
                  <section className="space-y-6">
                    <div className="space-y-4">
                      {/* 필터 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          요청 목록
                        </h3>
                        <div className="flex gap-2">
                          <select
                            className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                            className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                        <div className="py-20 text-center text-slate-500 border border-dashed rounded-lg">
                          표시할 요청 내역이 없습니다.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 우측: 상세 및 지원자 관리 */}
                  <aside className="lg:sticky lg:top-6 h-fit">
                    <Card className="h-full border-slate-200 dark:border-slate-700 shadow-lg">
                      <CardBody className="space-y-6">
                        {selectedRequest ? (
                          <>
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
                                {(selectedRequest.status === "OPEN" ||
                                  selectedRequest.status === "PENDING") && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                    onClick={handleCancelRequest}
                                  >
                                    요청 취소
                                  </Button>
                                )}
                              </div>

                              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700">
                                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                  <p>
                                    <strong>요청자:</strong>{" "}
                                    {selectedRequest.requesterName}
                                  </p>
                                  <p>
                                    <strong>일자:</strong>{" "}
                                    {selectedRequest.date}
                                  </p>
                                  <p>
                                    <strong>시간:</strong>{" "}
                                    {selectedRequest.startTime.substring(0, 5)}{" "}
                                    - {selectedRequest.endTime.substring(0, 5)}
                                  </p>
                                  {selectedRequest.reason && (
                                    <p className="bg-white dark:bg-slate-700 p-2 rounded text-xs mt-2 border">
                                      "{selectedRequest.reason}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  지원 현황 ({applicants.length})
                                </h4>
                                <div className="flex gap-1">
                                  <select
                                    className="p-1 text-xs border rounded bg-white dark:bg-slate-800"
                                    value={appFilter}
                                    onChange={(e) =>
                                      setAppFilter(e.target.value)
                                    }
                                  >
                                    {APPLICANT_STATUS_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {isLoadingApplicants ? (
                                <p className="text-center py-4 text-slate-500">
                                  불러오는 중...
                                </p>
                              ) : applicants.length > 0 ? (
                                applicants.map((applicant) => (
                                  <div
                                    key={applicant.applicationId}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                          {applicant.applicantName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {applicant.applicantPhone}
                                        </p>
                                      </div>
                                      {applicant.status === "SELECTED" && (
                                        <Badge variant="success">승인됨</Badge>
                                      )}
                                      {applicant.status === "REJECTED" && (
                                        <Badge variant="error">거절됨</Badge>
                                      )}
                                      {applicant.status === "CANCELED" && (
                                        <Badge variant="default">취소됨</Badge>
                                      )}
                                    </div>

                                    {applicant.status === "WAITING" &&
                                      (selectedRequest.status === "OPEN" ||
                                        selectedRequest.status ===
                                          "PENDING") && (
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
                                <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-lg">
                                  지원자가 없습니다.
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="py-20 text-center text-slate-500">
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
              </>
            )}

            {/* =======================================================
                CATEGORY: OPEN SHIFT (오픈시프트 관리)
               ======================================================= */}
            {category === "openshift" && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
                {/* 좌측: 오픈시프트 목록 */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      오픈시프트 목록
                    </h3>
                  </div>

                  {isLoadingOpenShifts ? (
                    <div className="py-12 text-center text-slate-500">
                      로딩 중...
                    </div>
                  ) : openShifts.length > 0 ? (
                    <div className="grid gap-4">
                      {openShifts.map((os) => {
                        const isSelected = os.id === selectedOpenShiftId;
                        return (
                          <button
                            key={os.id}
                            onClick={() => setSelectedOpenShiftId(os.id)}
                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-400/40"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      os.requestStatus === "OPEN"
                                        ? "info"
                                        : "default"
                                    }
                                  >
                                    {os.requestStatus === "OPEN"
                                      ? "모집중"
                                      : "마감됨"}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    등록: {os.createdAt?.split("T")[0]}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-lg">
                                  {os.workDate}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {os.startTime.substring(0, 5)} -{" "}
                                  {os.endTime.substring(0, 5)}
                                </p>
                              </div>
                            </div>
                            {os.note && (
                              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-2 rounded">
                                📝 {os.note}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-500 border border-dashed rounded-lg">
                      생성된 오픈시프트가 없습니다.
                    </div>
                  )}
                </section>

                {/* 우측: 지원자 목록 */}
                <aside className="lg:sticky lg:top-6 h-fit">
                  <Card className="h-full border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardBody className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-4 border-slate-100 dark:border-slate-700">
                        지원자 관리
                      </h3>

                      {!selectedOpenShiftId ? (
                        <div className="py-20 text-center text-slate-500">
                          <span className="material-icons text-4xl mb-2 opacity-50">
                            touch_app
                          </span>
                          <p>좌측에서 오픈시프트를 선택하세요.</p>
                        </div>
                      ) : isLoadingOpenShiftApps ? (
                        <p className="text-center py-10 text-slate-500">
                          불러오는 중...
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {openShiftApplicants.length > 0 ? (
                            openShiftApplicants.map((app) => (
                              <div
                                key={app.id}
                                className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-white dark:bg-slate-800"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      {app.applicantName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {app.department}
                                    </p>
                                  </div>
                                  {app.applyStatus === "ACCEPTED" && (
                                    <Badge variant="success">승인됨</Badge>
                                  )}
                                  {app.applyStatus === "REJECTED" && (
                                    <Badge variant="error">거절됨</Badge>
                                  )}
                                </div>

                                {app.applyStatus === "WAITING" && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() =>
                                      handleApproveOpenShiftApply(app.id)
                                    }
                                  >
                                    승인하기
                                  </Button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="py-10 text-center text-sm text-slate-500 border border-dashed rounded-lg">
                              아직 지원자가 없습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </aside>
              </div>
            )}
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
