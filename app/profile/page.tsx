"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { MainHeader } from "@/components/layout/MainHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SalaryEstimationPanel } from "@/components/domain/profile/SalaryEstimationPanel";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type ProfileUser = {
  name: string;
  email: string;
  phoneNumber: string;
};

const DEFAULT_PROFILE_USER: ProfileUser = {
  name: "사용자",
  email: "이메일 정보 없음",
  phoneNumber: "전화번호 정보 없음",
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(normalized);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
};

const splitPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return {
      part1: digits.slice(0, 3),
      part2: digits.slice(3, 7),
      part3: digits.slice(7, 11),
    };
  }
  if (digits.length === 10) {
    return {
      part1: digits.slice(0, 3),
      part2: digits.slice(3, 6),
      part3: digits.slice(6, 10),
    };
  }
  return { part1: "", part2: "", part3: "" };
};

const getUserFromUnknown = (value: unknown): ProfileUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const nestedUser = record.user;
  if (nestedUser && typeof nestedUser === "object") {
    const parsedNestedUser = getUserFromUnknown(nestedUser);
    if (parsedNestedUser) {
      return parsedNestedUser;
    }
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === "object") {
    const parsedNestedData = getUserFromUnknown(nestedData);
    if (parsedNestedData) {
      return parsedNestedData;
    }
  }

  const name =
    readString(record.name) ??
    readString(record.userName) ??
    readString(record.username) ??
    readString(record.nickname);
  const email = readString(record.email) ?? readString(record.userEmail);
  const phoneNumber =
    readString(record.phoneNumber) ??
    readString(record.phone_number) ??
    readString(record.userPhoneNumber);

  if (name || email || phoneNumber) {
    return {
      name: name ?? DEFAULT_PROFILE_USER.name,
      email: email ?? DEFAULT_PROFILE_USER.email,
      phoneNumber: phoneNumber ?? DEFAULT_PROFILE_USER.phoneNumber,
    };
  }

  const firstName = readString(record.firstName);
  const lastName = readString(record.lastName);
  if (firstName || lastName) {
    const fullName = `${lastName ?? ""}${firstName ?? ""}`.trim();
    return {
      name: fullName || DEFAULT_PROFILE_USER.name,
      email: DEFAULT_PROFILE_USER.email,
      phoneNumber: DEFAULT_PROFILE_USER.phoneNumber,
    };
  }

  return null;
};

const getFallbackUserFromStorage = (): ProfileUser => {
  const displayName = readString(localStorage.getItem("auth_user_name"));
  const token = localStorage.getItem("auth_token");
  const payload = token ? decodeJwtPayload(token) : null;
  const tokenUser = getUserFromUnknown(payload);

  return {
    name: displayName ?? tokenUser?.name ?? DEFAULT_PROFILE_USER.name,
    email: tokenUser?.email ?? DEFAULT_PROFILE_USER.email,
    phoneNumber: tokenUser?.phoneNumber ?? DEFAULT_PROFILE_USER.phoneNumber,
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const [profileUser, setProfileUser] =
    useState<ProfileUser>(DEFAULT_PROFILE_USER);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    email: "",
    name: "",
    phonePart1: "",
    phonePart2: "",
    phonePart3: "",
  });
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );

  // OTP 관련 상태 추가
  const [otp, setOtp] = useState<string | null>(null);
  const [otpLeftTime, setOtpLeftTime] = useState<number>(0);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handlePhoneDigitKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const allowedControlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ];
    if (allowedControlKeys.includes(e.key)) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const loadProfile = useCallback(async () => {
    const fallbackUser = getFallbackUserFromStorage();
    setProfileUser(fallbackUser);

    try {
      const response = await authApi.getCurrentUser();
      const parsed = getUserFromUnknown(response.data);
      if (parsed) {
        setProfileUser(parsed);
        localStorage.setItem("auth_user_name", parsed.name);
      }
    } catch {
      // 네트워크 오류 등으로 사용자 조회에 실패하면 fallback 값을 유지한다.
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const avatarUrl = useMemo(
    () =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name)}&background=13a4ec&color=fff`,
    [profileUser.name],
  );

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    });
    setPasswordFormError(null);
  };

  const handleOpenPasswordModal = () => {
    resetPasswordForm();
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (isChangingPassword) {
      return;
    }
    setIsPasswordModalOpen(false);
    resetPasswordForm();
  };

  const handleChangePassword = async () => {
    if (isChangingPassword) {
      return;
    }

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const newPasswordConfirm = passwordForm.newPasswordConfirm.trim();

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setPasswordFormError("모든 항목을 입력해주세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordFormError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setPasswordFormError(null);
    setIsChangingPassword(true);

    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message ?? "비밀번호 변경에 실패했습니다.",
        );
      }

      setIsPasswordModalOpen(false);
      resetPasswordForm();

      await Swal.fire({
        icon: "success",
        title: "비밀번호 변경 성공",
        text: "보안을 위해 다시 로그인해주세요.",
        confirmButtonText: "확인",
      });

      try {
        await authApi.logout();
      } catch {
        // 로그아웃 API 실패 시에도 로컬 토큰은 이미 정리되므로 이동은 진행
      }
      router.push("/");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "비밀번호 변경 실패",
        text:
          error instanceof Error
            ? error.message
            : "요청 처리 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOpenProfileModal = () => {
    const phone =
      profileUser.phoneNumber === DEFAULT_PROFILE_USER.phoneNumber
        ? ""
        : profileUser.phoneNumber;
    const phoneParts = splitPhoneNumber(phone);

    setProfileForm({
      email: profileUser.email,
      name: profileUser.name,
      phonePart1: phoneParts.part1,
      phonePart2: phoneParts.part2,
      phonePart3: phoneParts.part3,
    });
    setProfileFormError(null);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    if (isUpdatingProfile) {
      return;
    }
    setIsProfileModalOpen(false);
    setProfileFormError(null);
  };

  const handleUpdateProfile = async () => {
    if (isUpdatingProfile) {
      return;
    }

    const name = profileForm.name.trim();
    const phoneNumber =
      `${profileForm.phonePart1}${profileForm.phonePart2}${profileForm.phonePart3}`.replace(
        /\D/g,
        "",
      );

    if (!name) {
      setProfileFormError("이름을 입력해주세요.");
      return;
    }

    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      setProfileFormError("전화번호는 숫자 10~11자리여야 합니다.");
      return;
    }

    setIsUpdatingProfile(true);
    setProfileFormError(null);

    try {
      const response = await authApi.updateMyProfile({ name, phoneNumber });
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "프로필 수정에 실패했습니다.",
        );
      }

      setIsProfileModalOpen(false);
      await Swal.fire({
        icon: "success",
        title: "수정완료",
        confirmButtonText: "확인",
      });

      localStorage.setItem("auth_user_name", name);
      window.dispatchEvent(
        new CustomEvent("auth-user-name-updated", { detail: { name } }),
      );
      await loadProfile();
      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "수정 실패",
        text:
          error instanceof Error
            ? error.message
            : "요청 처리 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // OTP 타이머
  useEffect(() => {
    if (!isActive) return;
    if (otpLeftTime <= 0) {
      handleGenerateOtp();
      return;
    }

    const timerId = setInterval(() => {
      setOtpLeftTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [otpLeftTime, isActive]);

  const handleGenerateOtp = async () => {
    if (isGeneratingOtp) return;
    setIsGeneratingOtp(true);
    try {
      const response = await authApi.generateOtp();

      if (response.success && response.data) {
        const actualOtp =
          typeof response.data === "object" && "data" in (response.data as any)
            ? String((response.data as any).data)
            : String(response.data);

        setOtp(actualOtp);
        setOtpLeftTime(60);
        setIsActive(true);
      } else {
        throw new Error("OTP 발급에 실패했습니다.");
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "발급 실패",
        text: "오류가 발생했습니다. 다시 시도해주세요.",
        confirmButtonText: "확인",
      });
      setIsActive(false);
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <MainHeader />

      <main className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              내 계정 프로필
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              계정 정보와 기본 설정을 확인하세요.
            </p>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                기본 정보
              </h2>
              <div className="flex items-center gap-2">
                <Link href="/profile/documents">
                  <Button variant="secondary" className="gap-2">
                    <span className="material-icons text-sm">folder_open</span>
                    보건증·신분증·통장사본
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={handleOpenProfileModal}
                >
                  <span className="material-icons text-sm">edit</span>
                  프로필 수정
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={handleOpenPasswordModal}
                >
                  <span className="material-icons text-sm">lock</span>
                  비밀번호 변경
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <img
                  alt="Profile"
                  className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-700"
                  src={avatarUrl}
                />
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {profileUser.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {profileUser.email}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {profileUser.phoneNumber ===
                    DEFAULT_PROFILE_USER.phoneNumber
                      ? DEFAULT_PROFILE_USER.phoneNumber
                      : formatPhoneNumber(profileUser.phoneNumber)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-icons text-blue-500">lock_clock</span>
                출퇴근 인증 (OTP)
              </h2>
            </CardHeader>
            <CardBody>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
                {otp ? (
                  // OTP 발급 후
                  <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      매장 화면에 아래 번호를 입력하세요.
                    </p>

                    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg px-8 py-4 flex flex-col items-center">
                      <span className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.2em] text-blue-600 dark:text-blue-400">
                        {otp}
                      </span>
                    </div>

                    {/* 타이머 바 & 텍스트 */}
                    <div className="flex flex-col items-center w-full max-w-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-icons text-sm ${otpLeftTime <= 10 ? "text-red-500 animate-pulse" : "text-slate-400"}`}
                        >
                          timer
                        </span>
                        <span
                          className={`font-semibold ${otpLeftTime <= 10 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          00:{otpLeftTime.toString().padStart(2, "0")}
                        </span>
                      </div>
                      {/* 프로그래스 바 */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ease-linear ${otpLeftTime <= 10 ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${(otpLeftTime / 60) * 100}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={handleGenerateOtp}
                      disabled={isGeneratingOtp}
                      className="mt-2"
                    >
                      <span className="material-icons text-sm mr-1">
                        refresh
                      </span>
                      재발급
                    </Button>
                  </div>
                ) : (
                  // OTP 발급 전
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                    <div>
                      <h3 className="text-base font-medium text-slate-900 dark:text-white">
                        일회용 출퇴근 비밀번호
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        아래 버튼을 클릭하면 인증 번호가 생성됩니다.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateOtp}
                      disabled={isGeneratingOtp}
                      className="min-w-[140px]"
                    >
                      {isGeneratingOtp ? "발급 중..." : "OTP 발급하기"}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                계정 관리
              </h2>
              <Link href="/dashboard">
                <Button className="gap-2">
                  <span className="material-icons text-sm">dashboard</span>
                  대시보드로 이동
                </Button>
              </Link>
            </CardHeader>
            <CardBody>
              <SalaryEstimationPanel />
            </CardBody>
          </Card>
        </div>
      </main>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        title="프로필 수정"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="profile-email"
            label="이메일"
            type="email"
            value={profileForm.email}
            disabled
          />
          <Input
            id="profile-name"
            label="이름"
            type="text"
            value={profileForm.name}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            disabled={isUpdatingProfile}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              전화번호
            </label>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                value={profileForm.phonePart1}
                onKeyDown={handlePhoneDigitKeyDown}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phonePart1: e.target.value.replace(/\D/g, "").slice(0, 3),
                  }))
                }
                disabled={isUpdatingProfile}
                className="h-10 w-20 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
                placeholder="010"
              />
              <span className="text-slate-500">-</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={profileForm.phonePart2}
                onKeyDown={handlePhoneDigitKeyDown}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phonePart2: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                disabled={isUpdatingProfile}
                className="h-10 w-24 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
                placeholder="0000"
              />
              <span className="text-slate-500">-</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={profileForm.phonePart3}
                onKeyDown={handlePhoneDigitKeyDown}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phonePart3: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                disabled={isUpdatingProfile}
                className="h-10 w-24 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white"
                placeholder="0000"
              />
            </div>
          </div>

          {profileFormError && (
            <p className="text-sm text-red-500">{profileFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleCloseProfileModal}
              disabled={isUpdatingProfile}
            >
              취소
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "수정 중..." : "수정"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title="비밀번호 변경"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="current-password"
            label="현재 비밀번호"
            type="password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            disabled={isChangingPassword}
          />
          <Input
            id="new-password"
            label="새 비밀번호"
            type="password"
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            disabled={isChangingPassword}
          />
          <Input
            id="new-password-confirm"
            label="새 비밀번호 확인"
            type="password"
            autoComplete="new-password"
            value={passwordForm.newPasswordConfirm}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPasswordConfirm: e.target.value,
              }))
            }
            disabled={isChangingPassword}
          />

          {passwordFormError && (
            <p className="text-sm text-red-500">{passwordFormError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleClosePasswordModal}
              disabled={isChangingPassword}
            >
              취소
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "변경 중..." : "변경하기"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
