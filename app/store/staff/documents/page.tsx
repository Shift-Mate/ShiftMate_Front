"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { MainHeader } from "@/components/layout/MainHeader";
import { StoreSidebar } from "@/components/domain/StoreSidebar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  storeApi,
  UserDocumentResDto,
  UserDocumentType,
} from "@/lib/api/stores";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

const DOCUMENT_META: Array<{
  type: UserDocumentType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: "HEALTH_CERTIFICATE",
    title: "보건증",
    description: "근무용 보건증 업로드 문서",
    icon: "health_and_safety",
  },
  {
    type: "IDENTIFICATION",
    title: "신분증",
    description: "본인 확인용 신분증 업로드 문서",
    icon: "badge",
  },
  {
    type: "BANKBOOK_COPY",
    title: "통장사본",
    description: "급여 정산용 통장사본 업로드 문서",
    icon: "account_balance",
  },
];

const isApiEnvelope = (value: unknown): value is ApiEnvelope<unknown> => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as { success?: unknown }).success === "boolean";
};

const isUserDocument = (value: unknown): value is UserDocumentResDto => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const doc = value as Partial<UserDocumentResDto>;
  return (
    typeof doc.id === "number" &&
    typeof doc.type === "string" &&
    typeof doc.originalFileName === "string" &&
    typeof doc.contentType === "string" &&
    typeof doc.size === "number" &&
    typeof doc.fileUrl === "string"
  );
};

const parseDocuments = (rawData: unknown): UserDocumentResDto[] => {
  if (Array.isArray(rawData)) {
    return rawData.filter(isUserDocument);
  }

  if (isApiEnvelope(rawData) && rawData.success && Array.isArray(rawData.data)) {
    return rawData.data.filter(isUserDocument);
  }

  return [];
};

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const resolveApiBaseUrl = (): string => {
  const envBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  if (typeof window === "undefined") {
    return envBase;
  }
  if (envBase.startsWith("http://") || envBase.startsWith("https://")) {
    return envBase;
  }
  return `${window.location.origin}${envBase}`;
};

const extractFileNameFromDisposition = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
    } catch {
      // fallback to simple filename format
    }
  }

  const simpleMatch = value.match(/filename\s*=\s*"?([^"]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return null;
};

function StaffMemberDocumentsPageContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") ?? "";
  const memberUserId = searchParams.get("memberUserId") ?? "";
  const employeeName = searchParams.get("employeeName") ?? "멤버";

  const [documentsByType, setDocumentsByType] = useState<
    Partial<Record<UserDocumentType, UserDocumentResDto>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [downloadType, setDownloadType] = useState<UserDocumentType | null>(null);
  const [openType, setOpenType] = useState<UserDocumentType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<
    Partial<Record<UserDocumentType, string>>
  >({});

  const setPreviewUrl = useCallback((type: UserDocumentType, nextUrl?: string) => {
    setPreviewUrls((prev) => {
      const current = prev[type];
      if (current && current.startsWith("blob:") && current !== nextUrl) {
        URL.revokeObjectURL(current);
      }
      if (!nextUrl) {
        return { ...prev, [type]: undefined };
      }
      return { ...prev, [type]: nextUrl };
    });
  }, []);

  const hasRequiredParams = useMemo(
    () => Boolean(storeId && memberUserId),
    [storeId, memberUserId],
  );

  const loadDocuments = useCallback(async () => {
    if (!hasRequiredParams) {
      setLoadError("storeId 또는 memberUserId가 없습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const response = await storeApi.getMemberDocuments(storeId, memberUserId);
    if (!response.success) {
      setLoadError(response.error?.message ?? "문서 목록을 불러오지 못했습니다.");
      setIsLoading(false);
      return;
    }

    const docs = parseDocuments(response.data as unknown);
    const next: Partial<Record<UserDocumentType, UserDocumentResDto>> = {};
    const docsToPreview: UserDocumentResDto[] = [];
    docs.forEach((doc) => {
      next[doc.type] = doc;
      if (doc.contentType.startsWith("image/")) {
        docsToPreview.push(doc);
      }
    });

    setDocumentsByType(next);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      const apiBase = resolveApiBaseUrl();
      await Promise.all(
        docsToPreview.map(async (doc) => {
          try {
            const previewResponse = await fetch(
              `${apiBase}/stores/${storeId}/store-members/${memberUserId}/documents/${doc.type.toLowerCase()}/preview`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (!previewResponse.ok) {
              return;
            }
            const previewBlob = await previewResponse.blob();
            setPreviewUrl(doc.type, URL.createObjectURL(previewBlob));
          } catch {
            // preview 로딩 실패 시 문서 메타데이터 표시는 유지한다.
          }
        }),
      );
    }
    setIsLoading(false);
  }, [hasRequiredParams, memberUserId, setPreviewUrl, storeId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const handleDownload = async (type: UserDocumentType, fallbackFileName: string) => {
    if (!hasRequiredParams || downloadType === type) {
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      await Swal.fire({
        icon: "warning",
        title: "로그인 필요",
        text: "다운로드하려면 다시 로그인해주세요.",
        confirmButtonText: "확인",
      });
      return;
    }

    setDownloadType(type);
    try {
      const apiBase = resolveApiBaseUrl();
      const response = await fetch(
        `${apiBase}/stores/${storeId}/store-members/${memberUserId}/documents/${type.toLowerCase()}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("문서 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const fileName = extractFileNameFromDisposition(disposition) || fallbackFileName;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "다운로드 실패",
        text:
          error instanceof Error
            ? error.message
            : "다운로드 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setDownloadType(null);
    }
  };

  const handleOpen = async (type: UserDocumentType) => {
    if (!hasRequiredParams || openType === type) {
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      await Swal.fire({
        icon: "warning",
        title: "로그인 필요",
        text: "원본을 열려면 다시 로그인해주세요.",
        confirmButtonText: "확인",
      });
      return;
    }

    setOpenType(type);
    try {
      const apiBase = resolveApiBaseUrl();
      const response = await fetch(
        `${apiBase}/stores/${storeId}/store-members/${memberUserId}/documents/${type.toLowerCase()}/preview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("원본 이미지 열기에 실패했습니다.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "열기 실패",
        text:
          error instanceof Error
            ? error.message
            : "원본 이미지 열기 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setOpenType(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <StoreSidebar />
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <MainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  멤버 서류 열람
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {employeeName}님의 보건증/신분증/통장사본 업로드 문서를 확인하고 다운로드할 수 있습니다.
                </p>
              </div>
              <Link href={`/store/staff?storeId=${storeId}`}>
                <Button variant="secondary" className="gap-2">
                  <span className="material-icons text-sm">arrow_back</span>
                  직원 목록으로
                </Button>
              </Link>
            </div>

            {isLoading && (
              <Card>
                <CardBody className="text-sm text-slate-500 dark:text-slate-400">
                  문서 목록을 불러오는 중입니다...
                </CardBody>
              </Card>
            )}

            {!isLoading && loadError && (
              <Card>
                <CardBody className="text-sm text-red-600 dark:text-red-400">
                  {loadError}
                </CardBody>
              </Card>
            )}

            {!isLoading &&
              !loadError &&
              DOCUMENT_META.map((meta) => {
                const doc = documentsByType[meta.type];
                const previewUrl = previewUrls[meta.type] ?? "";

                return (
                  <Card key={meta.type}>
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-blue-500">{meta.icon}</span>
                        {meta.title}
                      </h2>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {meta.description}
                      </p>

                      {doc ? (
                        <>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              업로드된 파일
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-all">
                              {doc.originalFileName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {doc.contentType} · {formatFileSize(doc.size)}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors cursor-pointer hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                onClick={() => void handleOpen(meta.type)}
                                disabled={openType === meta.type}
                              >
                                {openType === meta.type
                                  ? "여는 중..."
                                  : "원본 이미지 열기"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors cursor-pointer hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() =>
                                  void handleDownload(meta.type, doc.originalFileName)
                                }
                                disabled={downloadType === meta.type}
                              >
                                {downloadType === meta.type
                                  ? "다운로드 중..."
                                  : "원본 이미지 다운로드"}
                              </button>
                            </div>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={`${meta.title} 미리보기`}
                                className="w-full h-64 object-cover"
                              />
                            ) : (
                              <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                미리보기를 불러오지 못했습니다.
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                          업로드된 {meta.title} 파일이 없습니다.
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function StaffMemberDocumentsPage() {
  return (
    <Suspense fallback={null}>
      <StaffMemberDocumentsPageContent />
    </Suspense>
  );
}
