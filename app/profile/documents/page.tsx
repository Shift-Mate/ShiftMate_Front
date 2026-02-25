"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  authApi,
  UserDocument,
  UserDocumentType,
} from "@/lib/api/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpg",
  "image/jpeg",
];

const EMPTY_DOCUMENTS: Record<UserDocumentType, UserDocument | null> = {
  HEALTH_CERTIFICATE: null,
  IDENTIFICATION: null,
  BANKBOOK_COPY: null,
};

const DOCUMENT_CARDS: Array<{
  type: UserDocumentType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: "HEALTH_CERTIFICATE",
    title: "보건증",
    description: "근무용 보건증 이미지를 업로드하세요 (JPG/PNG)",
    icon: "health_and_safety",
  },
  {
    type: "IDENTIFICATION",
    title: "신분증",
    description: "본인 확인용 신분증 이미지를 업로드하세요 (JPG/PNG)",
    icon: "badge",
  },
  {
    type: "BANKBOOK_COPY",
    title: "통장사본",
    description: "급여 정산용 통장사본 이미지를 업로드하세요 (JPG/PNG)",
    icon: "account_balance",
  },
];

const isUserDocumentType = (value: unknown): value is UserDocumentType =>
  value === "HEALTH_CERTIFICATE" ||
  value === "IDENTIFICATION" ||
  value === "BANKBOOK_COPY";

const unwrapApiData = <T,>(payload: unknown): T | null => {
  if (!payload) {
    return null;
  }
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
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

const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return "파일 크기는 10MB 이하만 업로드할 수 있습니다.";
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type.toLowerCase())) {
    return "PNG, JPG, JPEG 이미지 파일만 업로드할 수 있습니다.";
  }
  return null;
};

const normalizePreviewUrl = (url: string): string => {
  if (typeof window === "undefined") {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" &&
      parsed.port === "8081" &&
      parsed.pathname.startsWith("/uploads/")
    ) {
      return `${window.location.origin}/api${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
};

const fileActionButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors cursor-pointer hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed";

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

  // RFC 5987 형식(filename*=UTF-8''...)을 우선 파싱한다.
  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
    } catch {
      // 디코딩 실패 시 일반 filename 파싱으로 fallback
    }
  }

  // 일반 형식(filename="...") 파싱
  const simpleMatch = value.match(/filename\s*=\s*"?([^"]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return null;
};

export default function ProfileDocumentsPage() {
  const [documents, setDocuments] =
    useState<Record<UserDocumentType, UserDocument | null>>(EMPTY_DOCUMENTS);
  const [previewUrls, setPreviewUrls] = useState<
    Partial<Record<UserDocumentType, string>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<UserDocumentType | null>(
    null,
  );
  const [deletingType, setDeletingType] = useState<UserDocumentType | null>(
    null,
  );
  const [downloadingType, setDownloadingType] = useState<UserDocumentType | null>(
    null,
  );
  const [dragOverType, setDragOverType] = useState<UserDocumentType | null>(
    null,
  );

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

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getMyDocuments();
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "문서 목록을 불러오지 못했습니다.",
        );
      }

      const docs = unwrapApiData<UserDocument[]>(response.data) ?? [];
      const nextState: Record<UserDocumentType, UserDocument | null> = {
        ...EMPTY_DOCUMENTS,
      };

      for (const doc of docs) {
        if (isUserDocumentType(doc.type)) {
          nextState[doc.type] = doc;
        }
      }

      setDocuments(nextState);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "불러오기 실패",
        text:
          error instanceof Error
            ? error.message
            : "문서 목록 조회 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleUpload = useCallback(
    async (type: UserDocumentType, file: File) => {
      if (uploadingType === type) {
        return;
      }

      const validationMessage = validateFile(file);
      if (validationMessage) {
        await Swal.fire({
          icon: "warning",
          title: "업로드 불가",
          text: validationMessage,
          confirmButtonText: "확인",
        });
        return;
      }

      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(type, localPreviewUrl);
      setUploadingType(type);

      try {
        const response = await authApi.uploadMyDocument(type, file);
        if (!response.success) {
          throw new Error(
            response.error?.message ?? "문서 업로드에 실패했습니다.",
          );
        }

        const uploaded = unwrapApiData<UserDocument>(response.data);
        if (uploaded && isUserDocumentType(uploaded.type)) {
          setDocuments((prev) => ({ ...prev, [uploaded.type]: uploaded }));
          if (uploaded.fileUrl) {
            setPreviewUrl(uploaded.type, uploaded.fileUrl);
          }
        } else {
          await loadDocuments();
        }

        await Swal.fire({
          icon: "success",
          title: "업로드 완료",
          text: "이미지가 정상적으로 저장되었습니다.",
          confirmButtonText: "확인",
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (error) {
        setPreviewUrl(type, undefined);
        await Swal.fire({
          icon: "error",
          title: "업로드 실패",
          text:
            error instanceof Error
              ? error.message
              : "문서 업로드 중 오류가 발생했습니다.",
          confirmButtonText: "확인",
        });
      } finally {
        setUploadingType(null);
      }
    },
    [loadDocuments, setPreviewUrl, uploadingType],
  );

  const handleSelectFile = async (type: UserDocumentType, file: File | null) => {
    if (!file) {
      return;
    }
    await handleUpload(type, file);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLLabelElement>,
    type: UserDocumentType,
  ) => {
    e.preventDefault();
    setDragOverType(null);
    const file = e.dataTransfer.files?.[0] ?? null;
    await handleSelectFile(type, file);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLLabelElement>,
    type: UserDocumentType,
  ) => {
    e.preventDefault();
    if (dragOverType !== type) {
      setDragOverType(type);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOverType(null);
  };

  const handleDelete = async (type: UserDocumentType) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "문서 삭제",
      text: "삭제 후에는 다시 업로드해야 합니다. 계속할까요?",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });

    if (!confirmed.isConfirmed) {
      return;
    }

    setDeletingType(type);
    try {
      const response = await authApi.deleteMyDocument(type);
      if (!response.success) {
        throw new Error(response.error?.message ?? "문서 삭제에 실패했습니다.");
      }

      setDocuments((prev) => ({ ...prev, [type]: null }));
      setPreviewUrl(type, undefined);
      await Swal.fire({
        icon: "success",
        title: "삭제 완료",
        text: "문서가 삭제되었습니다.",
        confirmButtonText: "확인",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "삭제 실패",
        text:
          error instanceof Error
            ? error.message
            : "문서 삭제 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setDeletingType(null);
    }
  };

  const handleDownloadOriginal = async (
    type: UserDocumentType,
    fallbackFileName: string,
  ) => {
    if (downloadingType === type) {
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

    setDownloadingType(type);
    try {
      const apiBase = resolveApiBaseUrl();
      const response = await fetch(
        `${apiBase}/users/me/documents/${type.toLowerCase()}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("원본 이미지 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const resolvedName =
        extractFileNameFromDisposition(disposition) || fallbackFileName;

      // 응답 blob을 임시 URL로 만든 뒤 a 태그 클릭으로 즉시 다운로드를 실행한다.
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = resolvedName;
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
      setDownloadingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <MainHeader />

      <main className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                보건증·신분증·통장사본
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                보건증/신분증/통장사본 이미지를 업로드하고 최신 파일을 관리할 수 있어요.
              </p>
            </div>
            <Link href="/profile">
              <Button variant="secondary" className="gap-2">
                <span className="material-icons text-sm">arrow_back</span>
                프로필로 돌아가기
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  문서 정보를 불러오는 중입니다...
                </p>
              </CardBody>
            </Card>
          ) : (
            DOCUMENT_CARDS.map((item) => {
              const currentDoc = documents[item.type];
              const isUploading = uploadingType === item.type;
              const isDeleting = deletingType === item.type;
              const previewSrc =
                previewUrls[item.type] ??
                (currentDoc && currentDoc.contentType.startsWith("image/")
                  ? normalizePreviewUrl(currentDoc.fileUrl)
                  : undefined);

              return (
                <Card key={item.type}>
                  <CardHeader className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-icons text-blue-500">
                        {item.icon}
                      </span>
                      {item.title}
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        현재 업로드된 파일
                      </p>
                      {currentDoc ? (
                        <>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-all">
                            {currentDoc.originalFileName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {currentDoc.contentType} · {formatFileSize(currentDoc.size)}
                          </p>
                          <a
                            href={normalizePreviewUrl(currentDoc.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className={`${fileActionButtonClass} mt-2`}
                          >
                            원본 이미지 열기
                          </a>
                          <button
                            type="button"
                            className={`${fileActionButtonClass} mt-2 ml-2`}
                            onClick={() =>
                              void handleDownloadOriginal(
                                item.type,
                                currentDoc.originalFileName,
                              )
                            }
                            disabled={downloadingType === item.type}
                          >
                            {downloadingType === item.type
                              ? "다운로드 중..."
                              : "원본 이미지 다운로드"}
                          </button>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          아직 업로드된 파일이 없습니다.
                        </p>
                      )}
                    </div>

                    <label
                      htmlFor={`file-${item.type}`}
                      onDrop={(e) => void handleDrop(e, item.type)}
                      onDragOver={(e) => handleDragOver(e, item.type)}
                      onDragLeave={handleDragLeave}
                      className={`block rounded-xl border-2 border-dashed p-5 transition-colors cursor-pointer ${
                        dragOverType === item.type
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/30"
                      }`}
                    >
                      <input
                        id={`file-${item.type}`}
                        type="file"
                        accept="image/png,image/jpg,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          void handleSelectFile(item.type, file);
                          e.currentTarget.value = "";
                        }}
                        disabled={isUploading || isDeleting}
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
                        {isUploading && (
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            업로드 중...
                          </p>
                        )}
                      </div>
                    </label>

                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={`${item.title} 미리보기`}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                          업로드된 이미지 미리보기가 여기에 표시됩니다.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        onClick={() => void handleDelete(item.type)}
                        disabled={!currentDoc || isUploading || isDeleting}
                      >
                        {isDeleting ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
