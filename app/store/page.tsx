"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { storeApi } from "@/lib/api/stores";
import Swal from "sweetalert2"; // 이미지 업로드 알림용
import { openShiftApi } from "@/lib/api/openShift"; // 생성 API용
import { authApi } from "@/lib/api/auth";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
  showWarningAlert,
} from "@/lib/ui/sweetAlert";

const STORE_NAMES: Record<string, string> = {
  "1": "강남점",
  "2": "홍대점",
  "3": "판교점",
  "4": "부산점",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ApiError = {
  code: string;
  message: string;
  details: unknown[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

type TemplateType = "COSTSAVER" | "HIGHSERVICE";
type ShiftType = "NORMAL" | "PEAK";

// [수정] id 필드 포함 (여러 가능성 고려)
type TemplateResDto = {
  id?: number;
  templateId?: number;
  shiftTemplateId?: number;
  templateType: TemplateType | null;
  shiftType: ShiftType;
  name: string | null;
  startTime: string;
  endTime: string;
};

type ScheduleResDto = {
  memberName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  templateName: string | null;
};

type StoreMemberListResDto = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
};

// [추가] 매장 상세 정보 DTO
type StoreDetailResDto = {
  id: number;
  name: string;
  imageUrl: string | null;
};

type ShiftTone = "emerald" | "amber" | "sky";

type WeekDay = {
  label: string;
  date: string;
  dateKey: string;
  highlight: boolean;
};

// 셀 아이템 (스케줄만 표시)
type CellItem = { type: "SCHEDULE"; name: string };

type RosterRow = {
  key: string;
  templateId: number;
  name: string;
  shiftType: ShiftType | null;
  templateType: TemplateType | null;
  startTime: string;
  endTime: string;
  time: string;
  tone: ShiftTone;
  cells: CellItem[][];
};

const badgeStyleByTone: Record<ShiftTone, string> = {
  emerald:
    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50",
  amber:
    "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50",
  sky: "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800/50",
};

const dotStyleByTone: Record<ShiftTone, string> = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
};

// --- Type Guards & Parsers ---

const isTemplateResDto = (value: unknown): value is TemplateResDto => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TemplateResDto>;
  return (
    typeof candidate.startTime === "string" &&
    typeof candidate.endTime === "string"
  );
};

const isScheduleResDto = (value: unknown): value is ScheduleResDto => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScheduleResDto>;
  return (
    typeof candidate.memberName === "string" &&
    typeof candidate.workDate === "string" &&
    typeof candidate.startTime === "string" &&
    typeof candidate.endTime === "string"
  );
};

const isStoreMemberListResDto = (
  value: unknown,
): value is StoreMemberListResDto => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoreMemberListResDto>;
  return typeof candidate.id === "number" && typeof candidate.role === "string";
};

const isApiEnvelope = (value: unknown): value is ApiResponse<unknown> => {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { success?: unknown }).success === "boolean";
};

const parseTemplateData = (rawData: unknown): TemplateResDto[] => {
  let data: any[] = [];
  if (Array.isArray(rawData)) {
    data = rawData;
  } else if (
    isApiEnvelope(rawData) &&
    rawData.success &&
    Array.isArray(rawData.data)
  ) {
    data = rawData.data;
  }

  // ID 매핑 처리
  return data
    .map((item) => ({
      ...item,
      id: item.id || item.templateId || item.shiftTemplateId,
    }))
    .filter(isTemplateResDto);
};

const parseScheduleData = (rawData: unknown): ScheduleResDto[] => {
  if (Array.isArray(rawData)) return rawData.filter(isScheduleResDto);
  if (
    isApiEnvelope(rawData) &&
    rawData.success &&
    Array.isArray(rawData.data)
  ) {
    return rawData.data.filter(isScheduleResDto);
  }
  return [];
};

const parseStoreMemberData = (rawData: unknown): StoreMemberListResDto[] => {
  if (Array.isArray(rawData)) return rawData.filter(isStoreMemberListResDto);
  if (
    isApiEnvelope(rawData) &&
    rawData.success &&
    Array.isArray(rawData.data)
  ) {
    return rawData.data.filter(isStoreMemberListResDto);
  }
  return [];
};

const parseStoreDetailData = (rawData: unknown): StoreDetailResDto | null => {
  const payload =
    rawData && typeof rawData === "object" && "data" in rawData
      ? (rawData as { data: unknown }).data
      : rawData;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Partial<StoreDetailResDto>;
  if (typeof candidate.id !== "number" || typeof candidate.name !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    imageUrl:
      typeof candidate.imageUrl === "string" ? candidate.imageUrl : null,
  };
};

// 이미지 업로드 상수
const MAX_STORE_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_STORE_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg"];

// --- Utils ---

const decodeJwtPayload = (token: string): any => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const getIdentityFromToken = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return { userId: null, email: null };
  const userId = payload.userId || payload.id || payload.sub;
  const email = payload.email || payload.userEmail;
  return { userId: userId ? String(userId) : null, email };
};

const isManagerRole = (role: string) => {
  const r = role.toUpperCase();
  return r === "OWNER" || r === "MANAGER" || r === "ADMIN";
};

const formatTime = (value: string) => {
  const [h, m] = value.split(":");
  return h && m ? `${h}:${m}` : value;
};

const getTone = (
  tType: TemplateType | null,
  sType: ShiftType | null,
): ShiftTone => {
  if (sType === "PEAK") return "sky";
  if (tType === "HIGHSERVICE") return "amber";
  return "emerald";
};

const getErrorCode = (error: {
  code: string;
  details?: Record<string, unknown>;
}): string => {
  if (error.details && typeof error.details.code === "string") {
    return error.details.code;
  }
  return error.code;
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00`);

const getWeekStartDate = (baseDate: Date) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return formatDateKey(date);
};

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
};

const parseTimeToMinutes = (value: string) => {
  const [h, m] = value.split(":");
  return Number(h) * 60 + Number(m);
};

// --- Component ---

function StoreMainPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "1";
  const initialStoreName = useMemo(
    () => STORE_NAMES[storeId] || `매장 ${storeId}`,
    [storeId],
  );

  // States
  const [weekStartDate, setWeekStartDate] = useState(() =>
    getWeekStartDate(new Date()),
  );
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleResDto[]>([]);
  const [canManageSchedule, setCanManageSchedule] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isAutoGeneratingSchedule, setIsAutoGeneratingSchedule] =
    useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store Detail & Image States (Upstream)
  const [displayStoreName, setDisplayStoreName] = useState(initialStoreName);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [storeImageUrl, setStoreImageUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);

  // OpenShift Modal States (Stashed)
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    templateId: number;
    date: string;
    timeLabel: string;
  } | null>(null);
  const [openShiftNote, setOpenShiftNote] = useState("");

  const weekDays = useMemo(() => {
    const start = new Date(weekStartDate);
    const today = formatDateKey(new Date());
    return DAY_LABELS.map((label, idx) => {
      const current = new Date(start);
      current.setDate(start.getDate() + idx);
      const dateKey = formatDateKey(current);
      return {
        label,
        date: String(current.getDate()).padStart(2, "0"),
        dateKey,
        highlight: dateKey === today,
      };
    });
  }, [weekStartDate]);

  const weekRangeLabel = `${weekStartDate} ~ ${addDays(weekStartDate, 6)}`;

  // 매장 상세 정보 조회 (이미지 등)
  useEffect(() => {
    let cancelled = false;
    const fetchStoreDetail = async () => {
      if (!/^\d+$/.test(storeId)) return;

      const response = await storeApi.getStore(storeId);
      if (!response.success) return;

      const storeDetail = parseStoreDetailData(response.data);
      if (!storeDetail || cancelled) return;

      setDisplayStoreName(storeDetail.name);
      setStoreImageUrl(storeDetail.imageUrl);
      setImagePreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return storeDetail.imageUrl;
      });
    };

    void fetchStoreDetail();
    return () => {
      cancelled = true;
    };
  }, [storeId, reloadKey]);

  // 이미지 프리뷰 정리
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // 스케줄 데이터 조회
  useEffect(() => {
    const fetchRoster = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      if (!/^\d+$/.test(storeId)) {
        setErrorMessage("유효하지 않은 매장 ID입니다.");
        setIsLoading(false);
        return;
      }

      try {
        const [templateResponse, scheduleResponse] = await Promise.all([
          storeApi.getShiftTemplate(storeId),
          storeApi.getStoreSchedules(storeId, weekStartDate),
        ]);

        let templates: TemplateResDto[] = [];
        let schedules: ScheduleResDto[] = [];

        if (!templateResponse.success) {
          const code = templateResponse.error
            ? getErrorCode(templateResponse.error)
            : "";
          if (code !== "TEMPLATE_NOT_FOUND" && code !== "404") {
            setErrorMessage("시프트 템플릿을 불러오지 못했습니다.");
            setIsLoading(false);
            return;
          }
        } else {
          templates = parseTemplateData(templateResponse.data);
        }

        if (!scheduleResponse.success) {
          const code = scheduleResponse.error
            ? getErrorCode(scheduleResponse.error)
            : "";
          if (
            code !== "SHIFT_ASSIGNMENT_NOT_FOUND" &&
            code !== "404" &&
            code !== "STORE_NOT_FOUND"
          ) {
            setErrorMessage("근무 스케줄 정보를 불러오지 못했습니다.");
            setIsLoading(false);
            return;
          }
        } else {
          schedules = parseScheduleData(scheduleResponse.data);
        }

        const rows: RosterRow[] = templates.map((t, idx) => {
          // ID가 없는 경우 -1로 설정하여 버튼 비활성화 방지 (혹은 조건부 렌더링)
          const tId = t.id || t.templateId || t.shiftTemplateId || -1;
          const name =
            t.name || (t.shiftType === "PEAK" ? "Peak" : `Shift ${idx + 1}`);

          return {
            key: `${t.startTime}-${t.endTime}-${idx}`,
            templateId: tId,
            name,
            shiftType: t.shiftType,
            templateType: t.templateType,
            startTime: t.startTime,
            endTime: t.endTime,
            time: `${formatTime(t.startTime)} - ${formatTime(t.endTime)}`,
            tone: getTone(t.templateType, t.shiftType),
            cells: weekDays.map(() => []),
          };
        });

        schedules.forEach((sch) => {
          const dayIndex = weekDays.findIndex(
            (d) => d.dateKey === sch.workDate,
          );
          if (dayIndex === -1) return;

          let row = rows.find(
            (r) => r.startTime === sch.startTime && r.endTime === sch.endTime,
          );

          if (!row) {
            row = {
              key: `temp-${sch.startTime}-${sch.endTime}`,
              templateId: -1,
              name: sch.templateName || "Extra",
              shiftType: null,
              templateType: null,
              startTime: sch.startTime,
              endTime: sch.endTime,
              time: `${formatTime(sch.startTime)} - ${formatTime(sch.endTime)}`,
              tone: "emerald",
              cells: weekDays.map(() => []),
            };
            rows.push(row);
          }

          if (!row.cells[dayIndex].some((c) => c.name === sch.memberName)) {
            row.cells[dayIndex].push({
              type: "SCHEDULE",
              name: sch.memberName,
            });
          }
        });

        rows.sort(
          (a, b) =>
            parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
        );

        setRosterRows(rows);
        setScheduleItems(schedules);
      } catch (error) {
        console.error("Fetch Error:", error);
        setErrorMessage("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRoster();
  }, [storeId, weekStartDate, weekDays, reloadKey]);

  // 권한 체크
  useEffect(() => {
    let cancelled = false;
    const fetchMyRole = async () => {
      if (!/^\d+$/.test(storeId)) {
        setCanManageSchedule(false);
        return;
      }
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      if (!token) {
        setCanManageSchedule(false);
        return;
      }
      const identity = getIdentityFromToken(token);
      if (!identity.userId && !identity.email) {
        setCanManageSchedule(false);
        return;
      }
      const response = await storeApi.getStoreMembers(storeId);
      if (!response.success) {
        if (!cancelled) setCanManageSchedule(false);
        return;
      }
      const members = parseStoreMemberData(response.data);
      const myMember = members.find((member) => {
        if (identity.userId && String(member.userId) === identity.userId)
          return true;
        if (identity.email && member.userEmail.toLowerCase() === identity.email)
          return true;
        return false;
      });
      if (!cancelled) {
        setCanManageSchedule(myMember ? isManagerRole(myMember.role) : false);
      }
    };
    void fetchMyRole();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  // --- Handlers ---

  const handleDeleteWeekSchedules = async () => {
    if (!/^\d+$/.test(storeId)) {
      await showWarningAlert("요청 오류", "유효하지 않은 매장 ID입니다.");
      return;
    }
    const ok = await showConfirmAlert({
      title: "시간표 삭제",
      text: `${weekStartDate} 주차 스케줄을 모두 삭제하시겠습니까?`,
      confirmButtonText: "삭제하기",
    });
    if (!ok) return;

    setIsDeletingSchedule(true);
    const response = await storeApi.deleteStoreSchedules(
      storeId,
      weekStartDate,
    );

    if (!response.success) {
      await showErrorAlert(
        "삭제 실패",
        response.error?.message ?? "스케줄 삭제 중 오류가 발생했습니다.",
      );
    } else {
      await showSuccessAlert("삭제 완료", "해당 주차 스케줄을 삭제했습니다.");
      setReloadKey((prev) => prev + 1);
    }
    setIsDeletingSchedule(false);
  };

  const handleAutoGenerateWeekSchedules = async () => {
    if (!/^\d+$/.test(storeId)) {
      await showWarningAlert("요청 오류", "유효하지 않은 매장 ID입니다.");
      return;
    }
    setIsAutoGeneratingSchedule(true);
    const response = await storeApi.autoGenerateStoreSchedules(
      storeId,
      weekStartDate,
    );

    if (!response.success) {
      await showErrorAlert(
        "자동 생성 실패",
        response.error?.message ?? "시간표 자동 생성 중 오류가 발생했습니다.",
      );
    } else {
      await showSuccessAlert("생성 완료", "해당 주차 시간표를 자동 생성했습니다.");
      setReloadKey((prev) => prev + 1);
    }
    setIsAutoGeneratingSchedule(false);
  };

  // 이미지 업로드 검증
  const validateStoreImageFile = (file: File): string | null => {
    if (file.size > MAX_STORE_IMAGE_SIZE) {
      return "파일 크기는 10MB 이하만 업로드할 수 있습니다.";
    }
    if (!ALLOWED_STORE_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return "PNG, JPG, JPEG 이미지 파일만 업로드할 수 있습니다.";
    }
    return null;
  };

  // 이미지 업로드 핸들러
  const handleUploadStoreImage = async (file: File) => {
    if (!canManageSchedule || !/^\d+$/.test(storeId) || isImageUploading) {
      return;
    }

    const validationMessage = validateStoreImageFile(file);
    if (validationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "업로드 불가",
        text: validationMessage,
        confirmButtonText: "확인",
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return localPreview;
    });

    setIsImageUploading(true);
    try {
      const response = await storeApi.uploadStoreImage(storeId, file);
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "가게 이미지 업로드에 실패했습니다.",
        );
      }

      const storeDetail = parseStoreDetailData(response.data);
      if (storeDetail) {
        setDisplayStoreName(storeDetail.name);
        setStoreImageUrl(storeDetail.imageUrl);
        setImagePreviewUrl((prev) => {
          if (prev && prev.startsWith("blob:")) {
            URL.revokeObjectURL(prev);
          }
          return storeDetail.imageUrl;
        });
      }

      setReloadKey((prev) => prev + 1);
      await Swal.fire({
        icon: "success",
        title: "업로드 완료",
        text: "가게 이미지가 저장되었습니다.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      setImagePreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return storeImageUrl;
      });
      await Swal.fire({
        icon: "error",
        title: "업로드 실패",
        text:
          error instanceof Error
            ? error.message
            : "가게 이미지 업로드 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  // 이미지 삭제 핸들러
  const handleDeleteStoreImage = async () => {
    if (
      !canManageSchedule ||
      !/^\d+$/.test(storeId) ||
      isImageDeleting ||
      !storeImageUrl
    ) {
      return;
    }

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "가게 이미지 삭제",
      text: "삭제하면 대시보드에서 기본 아이콘으로 표시됩니다. 계속할까요?",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });
    if (!confirmed.isConfirmed) {
      return;
    }

    setIsImageDeleting(true);
    try {
      const response = await storeApi.deleteStoreImage(storeId);
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "가게 이미지 삭제에 실패했습니다.",
        );
      }

      setStoreImageUrl(null);
      setImagePreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setReloadKey((prev) => prev + 1);
      await Swal.fire({
        icon: "success",
        title: "삭제 완료",
        text: "가게 이미지가 삭제되었습니다.",
        confirmButtonText: "확인",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "삭제 실패",
        text:
          error instanceof Error
            ? error.message
            : "가게 이미지 삭제 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsImageDeleting(false);
    }
  };

  // 오픈시프트 모달 열기
  const handleOpenCreateModal = (
    templateId: number,
    date: string,
    time: string,
  ) => {
    if (templateId <= 0) {
      // ID가 없는 경우(임시행 등) 처리
      void showWarningAlert(
        "생성 불가",
        "이 근무 파트의 ID 정보를 불러오지 못했습니다.",
      );
      return;
    }
    setSelectedSlot({ templateId, date, timeLabel: time });
    setOpenShiftNote("");
    setIsOpenShiftModalOpen(true);
  };

  // 오픈시프트 생성 요청
  const handleCreateOpenShift = async () => {
    if (!selectedSlot) return;
    try {
      const res = await openShiftApi.create(storeId, {
        shiftTemplateId: selectedSlot.templateId,
        workDate: selectedSlot.date,
        note: openShiftNote,
      });

      if (res.success) {
        await Swal.fire({
          icon: "success",
          title: "생성 완료",
          text: "오픈시프트가 생성되었습니다.",
          timer: 1200,
          showConfirmButton: false,
        });
        setIsOpenShiftModalOpen(false);
        setReloadKey((prev) => prev + 1);
      } else {
        await Swal.fire({
          icon: "error",
          title: "생성 실패",
          text: res.error?.message || "오픈시프트 생성에 실패했습니다.",
        });
      }
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "오류 발생",
        text: e.response?.data?.message || "알 수 없는 오류가 발생했습니다.",
      });
    }
  };

  const totalSchedules = scheduleItems.length;
  const uniqueMembers = useMemo(
    () => new Set(scheduleItems.map((item) => item.memberName)).size,
    [scheduleItems],
  );
  const peakTemplates = rosterRows.filter(
    (row) => row.shiftType === "PEAK",
  ).length;

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
                  {displayStoreName} 주간 시간표
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  storeId: {storeId} 기준 매장 메인 화면 (주간 시간표)
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                {canManageSchedule && (
                  <>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      <span className="material-icons text-sm">image</span>
                      가게 이미지
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={handleDeleteWeekSchedules}
                      disabled={isDeletingSchedule}
                    >
                      <span className="material-icons text-sm">delete</span>
                      {isDeletingSchedule ? "삭제 중..." : "시간표 삭제"}
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={handleAutoGenerateWeekSchedules}
                      disabled={isAutoGeneratingSchedule}
                    >
                      <span className="material-icons text-sm">
                        auto_awesome
                      </span>
                      {isAutoGeneratingSchedule
                        ? "생성 중..."
                        : "시간표 자동 생성"}
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}
                >
                  <span className="material-icons text-sm">chevron_left</span>
                  이전 주
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}
                >
                  <span className="material-icons text-sm">chevron_right</span>
                  다음 주
                </Button>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      주간 근무 건수
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {totalSchedules}건
                    </p>
                  </div>
                  <span className="material-icons text-primary">groups</span>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      근무 인원
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {uniqueMembers}명
                    </p>
                  </div>
                  <span className="material-icons text-green-500">person</span>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      피크 시프트
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {peakTemplates}개
                    </p>
                  </div>
                  <span className="material-icons text-amber-500">
                    wb_sunny
                  </span>
                </CardBody>
              </Card>
            </div>

            {/* 스케줄 그리드 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Weekly Roster
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {weekRangeLabel}
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                {isLoading && (
                  <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                    근무 정보를 불러오는 중입니다...
                  </div>
                )}

                {!isLoading && errorMessage && (
                  <div className="py-10 text-center text-red-600 dark:text-red-400">
                    {errorMessage}
                  </div>
                )}

                {!isLoading && !errorMessage && rosterRows.length === 0 && (
                  <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                    해당 주차의 시프트 정보가 없습니다.
                  </div>
                )}

                {!isLoading && !errorMessage && rosterRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1100px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#15232d]">
                      {/* 그리드 헤더 */}
                      <div className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Shift / Day
                          </span>
                        </div>
                        {weekDays.map((day) => (
                          <div
                            key={day.dateKey}
                            className={`p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                              day.highlight
                                ? "bg-primary/5 dark:bg-primary/10"
                                : ""
                            }`}
                          >
                            <span
                              className={`block text-xs font-semibold uppercase ${
                                day.highlight
                                  ? "text-primary"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {day.label}
                            </span>
                            <span
                              className={`block text-lg font-bold ${
                                day.highlight
                                  ? "text-primary"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {day.date}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 그리드 바디 */}
                      {rosterRows.map((row) => (
                        <div
                          key={row.key}
                          className="grid grid-cols-[150px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                        >
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  dotStyleByTone[row.tone]
                                }`}
                              />
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {row.name}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                              {row.time}
                            </span>
                          </div>

                          {row.cells.map((items, idx) => {
                            const currentDate = weekDays[idx].dateKey;
                            const hasTemplate = row.templateId > 0;

                            return (
                              <div
                                key={`${row.key}-${idx}`}
                                className={`p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[110px] flex flex-col gap-2 relative group ${
                                  idx % 2 === 1
                                    ? "bg-slate-50/40 dark:bg-slate-800/20"
                                    : ""
                                }`}
                              >
                                {/* 스케줄 목록 */}
                                {items.map((item, i) => (
                                  <div
                                    key={`${row.key}-${idx}-${i}`}
                                    className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${
                                      badgeStyleByTone[row.tone]
                                    }`}
                                  >
                                    <div className="w-4 h-4 bg-white/50 rounded-full flex items-center justify-center text-[9px]">
                                      {item.name[0]}
                                    </div>
                                    {item.name}
                                  </div>
                                ))}

                                {/* 플러스 버튼 - 관리자 & 템플릿 ID 존재 시 항상 표시 */}
                                {canManageSchedule && hasTemplate && (
                                  <button
                                    onClick={() =>
                                      handleOpenCreateModal(
                                        row.templateId,
                                        currentDate,
                                        row.time,
                                      )
                                    }
                                    className={`w-full h-8 border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all mt-auto ${
                                      items.length > 0
                                        ? "opacity-50 hover:opacity-100" // 스케줄 있으면 반투명
                                        : "" // 없으면 불투명
                                    }`}
                                    title="오픈시프트 생성 (추가 인원 모집)"
                                  >
                                    <span className="material-icons text-lg">
                                      add
                                    </span>
                                  </button>
                                )}

                                {/* ID 누락 시 디버깅용 */}
                                {canManageSchedule && !hasTemplate && (
                                  <div className="mt-auto text-[10px] text-red-300 text-center">
                                    ID 누락
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>

      {/* 오픈시프트 생성 모달 */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="오픈시프트 생성 (추가 모집)"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong>
              {selectedSlot?.date} ({selectedSlot?.timeLabel})
            </strong>
            <br />
            해당 근무 파트에 대한 추가 인원을 모집하시겠습니까?
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">
              참고사항 (선택)
            </label>
            <textarea
              className="w-full p-3 border rounded h-24 dark:bg-slate-800 dark:border-slate-600 text-sm"
              placeholder="예: 단체 예약으로 인한 추가 인원 모집"
              value={openShiftNote}
              onChange={(e) => setOpenShiftNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsOpenShiftModalOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleCreateOpenShift}>등록</Button>
          </div>
        </div>
      </Modal>

      {/* 이미지 업로드 모달 */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          if (!isImageUploading && !isImageDeleting) {
            setIsImageModalOpen(false);
          }
        }}
        title="가게 이미지 관리"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            대시보드 매장 카드에 표시될 대표 이미지를 설정하세요. (JPG/PNG, 최대
            10MB)
          </p>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={`${displayStoreName} 대표 이미지`}
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                아직 등록된 가게 이미지가 없습니다.
              </div>
            )}
          </div>

          <label
            htmlFor="store-image-input"
            onDrop={(event) => {
              event.preventDefault();
              setIsImageDragOver(false);
              const file = event.dataTransfer.files?.[0] ?? null;
              if (file) {
                void handleUploadStoreImage(file);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsImageDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsImageDragOver(false);
            }}
            className={`block rounded-xl border-2 border-dashed p-5 transition-colors cursor-pointer ${
              isImageDragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/30"
            }`}
          >
            <input
              id="store-image-input"
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) {
                  void handleUploadStoreImage(file);
                }
                event.currentTarget.value = "";
              }}
              disabled={isImageUploading || isImageDeleting}
            />
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="material-icons text-3xl text-blue-500">
                cloud_upload
              </span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                클릭해서 이미지 선택 또는 드래그앤드롭
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JPG/PNG, 최대 10MB
              </p>
              {isImageUploading && (
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  업로드 중...
                </p>
              )}
            </div>
          </label>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsImageModalOpen(false)}
              disabled={isImageUploading || isImageDeleting}
            >
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDeleteStoreImage()}
              disabled={!storeImageUrl || isImageUploading || isImageDeleting}
            >
              {isImageDeleting ? "삭제 중..." : "이미지 삭제"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function StoreMainPage() {
  return (
    <Suspense fallback={null}>
      <StoreMainPageContent />
    </Suspense>
  );
}
