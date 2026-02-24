"use client";

import React, { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

interface SignupFormProps {
    onSignupSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [emailVerificationCode, setEmailVerificationCode] = useState("");
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isEmailCodeSending, setIsEmailCodeSending] = useState(false);
    const [isEmailVerifying, setIsEmailVerifying] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);

    const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const oauthRedirectUri =
        process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ||
        process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    const normalizeEmail = (value: string) => value.trim().toLowerCase();
    const isCurrentEmailVerified =
        isEmailVerified && verifiedEmail.length > 0 && verifiedEmail === normalizeEmail(email);

    const handleRequestEmailVerification = async () => {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            await Swal.fire({
                icon: "warning",
                title: "이메일 확인",
                text: "이메일을 먼저 입력해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        setIsEmailCodeSending(true);
        try {
            const response = await authApi.requestSignupEmailVerification({ email: normalizedEmail });
            if (!response.success) {
                throw new Error(response.error?.message || "이메일 인증코드 발송에 실패했습니다.");
            }

            setIsEmailCodeSent(true);
            setIsEmailVerified(false);
            setVerifiedEmail("");
            setEmailVerificationCode("");

            await Swal.fire({
                icon: "success",
                title: "인증코드 발송",
                text: "입력한 이메일로 인증코드를 보냈습니다.",
                confirmButtonText: "확인",
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "요청 실패",
                text:
                    error instanceof Error
                        ? error.message
                        : "이메일 인증코드 요청 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
            });
        } finally {
            setIsEmailCodeSending(false);
        }
    };

    const handleConfirmEmailVerification = async () => {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            await Swal.fire({
                icon: "warning",
                title: "이메일 확인",
                text: "이메일을 먼저 입력해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        if (!emailVerificationCode.trim()) {
            await Swal.fire({
                icon: "warning",
                title: "인증코드 확인",
                text: "인증코드를 입력해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        setIsEmailVerifying(true);
        try {
            const response = await authApi.confirmSignupEmailVerification({
                email: normalizedEmail,
                code: emailVerificationCode.trim(),
            });
            if (!response.success) {
                throw new Error(response.error?.message || "이메일 인증 확인에 실패했습니다.");
            }

            setIsEmailVerified(true);
            setVerifiedEmail(normalizedEmail);

            await Swal.fire({
                icon: "success",
                title: "이메일 인증 완료",
                text: "이제 회원가입을 진행할 수 있습니다.",
                confirmButtonText: "확인",
            });
        } catch (error) {
            setIsEmailVerified(false);
            setVerifiedEmail("");
            await Swal.fire({
                icon: "error",
                title: "인증 실패",
                text:
                    error instanceof Error
                        ? error.message
                        : "이메일 인증 확인 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
            });
        } finally {
            setIsEmailVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (phoneNumber.length !== 11) {
            await Swal.fire({
                icon: "warning",
                title: "전화번호 확인",
                text: "전화번호를 정확히 입력해주세요 (11자리 e.g. 01012341234)",
                confirmButtonText: "확인",
            });
            return;
        }

        if (password !== passwordConfirm) {
            await Swal.fire({
                icon: "warning",
                title: "비밀번호 확인",
                text: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
                confirmButtonText: "확인",
            });
            return;
        }

        if (!isCurrentEmailVerified) {
            await Swal.fire({
                icon: "warning",
                title: "이메일 인증 필요",
                text: "회원가입 전에 이메일 인증을 완료해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        setIsLoading(true);

        try {
            const normalizedName = name.trim();
            const normalizedEmail = normalizeEmail(email);

            if (!normalizedName) {
                await Swal.fire({
                    icon: "warning",
                    title: "이름 확인",
                    text: "이름을 입력해주세요.",
                    confirmButtonText: "확인",
                });
                return;
            }

            const signupResponse = await authApi.signup({
                email: normalizedEmail,
                password,
                passwordConfirm,
                name: normalizedName,
                phoneNumber,
            });

            if (!signupResponse.success) {
                throw new Error(signupResponse.error?.message || "회원가입에 실패했습니다.");
            }

            await Swal.fire({
                icon: "success",
                title: "회원가입 완료",
                text: "로그인 후 이용해주세요.",
                confirmButtonText: "확인",
            });
            onSignupSuccess?.();
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "회원가입 실패",
                text:
                    error instanceof Error
                        ? error.message
                        : "회원가입 요청 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: "kakao" | "google") => {
        setIsSocialLoading(true);

        if (!oauthRedirectUri) {
            setIsSocialLoading(false);
            void Swal.fire({
                icon: "error",
                title: "설정 확인",
                text: "NEXT_PUBLIC_OAUTH_REDIRECT_URI 환경변수를 확인해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        if (provider === "kakao") {
            if (!kakaoClientId) {
                setIsSocialLoading(false);
                void Swal.fire({
                    icon: "error",
                    title: "설정 확인",
                    text: "NEXT_PUBLIC_KAKAO_CLIENT_ID 환경변수를 확인해주세요.",
                    confirmButtonText: "확인",
                });
                return;
            }

            const kakaoAuthorizeUrl =
                `https://kauth.kakao.com/oauth/authorize?response_type=code` +
                `&client_id=${encodeURIComponent(kakaoClientId)}` +
                `&redirect_uri=${encodeURIComponent(oauthRedirectUri)}` +
                `&state=${encodeURIComponent("kakao")}`;

            window.location.href = kakaoAuthorizeUrl;
            return;
        }

        if (!googleClientId) {
            setIsSocialLoading(false);
            void Swal.fire({
                icon: "error",
                title: "설정 확인",
                text: "NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수를 확인해주세요.",
                confirmButtonText: "확인",
            });
            return;
        }

        const googleAuthorizeUrl =
            `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
            `&client_id=${encodeURIComponent(googleClientId)}` +
            `&redirect_uri=${encodeURIComponent(oauthRedirectUri)}` +
            `&scope=${encodeURIComponent("openid email profile")}` +
            `&state=${encodeURIComponent("google")}`;

        window.location.href = googleAuthorizeUrl;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="이름"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
            />

            <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => {
                    const nextEmail = e.target.value;
                    setEmail(nextEmail);
                    if (verifiedEmail && verifiedEmail !== normalizeEmail(nextEmail)) {
                        setIsEmailVerified(false);
                    }
                }}
                placeholder="name@company.com"
                required
            />

            <div className="space-y-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={handleRequestEmailVerification}
                        disabled={isEmailCodeSending || !email.trim()}
                    >
                        {isEmailCodeSending ? "발송 중..." : "이메일 인증코드 요청"}
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Input
                        label="이메일 인증코드"
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                        placeholder="6자리 인증코드 입력"
                        disabled={!isEmailCodeSent || isCurrentEmailVerified}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="self-end"
                        onClick={handleConfirmEmailVerification}
                        disabled={!isEmailCodeSent || isEmailVerifying || isCurrentEmailVerified}
                    >
                        {isEmailVerifying ? "확인 중..." : "인증 확인"}
                    </Button>
                </div>
                {isCurrentEmailVerified ? (
                    <p className="text-sm text-emerald-600">이메일 인증이 완료되었습니다.</p>
                ) : (
                    <p className="text-sm text-slate-500">이메일 인증 완료 후 회원가입이 가능합니다.</p>
                )}
            </div>

            <Input
                label="전화번호"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phoneNumber}
                onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                    if (onlyNumbers.length <= 11) {
                    setPhoneNumber(onlyNumbers);
                    }
                }}
                placeholder="01012345678"
                required
            />

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    비밀번호
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 input-focus transition-all pr-10"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <span className="material-icons text-lg">
                            {showPassword ? "visibility" : "visibility_off"}
                        </span>
                    </button>
                </div>
            </div>

            <Input
                label="비밀번호 확인"
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
            />

            <Button type="submit" className="w-full" disabled={isLoading || !isCurrentEmailVerified}>
                {isLoading ? "회원가입 중..." : "회원가입"}
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-surface-dark px-2 text-slate-500">
                        또는
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="secondary"
                    type="button"
                    className="gap-2 cursor-pointer"
                    disabled={isSocialLoading}
                    onClick={() => handleSocialLogin("kakao")}
                >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-black text-black">
                        K
                    </span>
                    {isSocialLoading ? "카카오 이동 중..." : "Kakao"}
                </Button>
                <Button
                    variant="secondary"
                    type="button"
                    className="gap-2 cursor-pointer"
                    disabled={isSocialLoading}
                    onClick={() => handleSocialLogin("google")}
                >
                    <svg className="h-4 w-4" viewBox="0 0 488 512" fill="currentColor">
                        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                    </svg>
                    {isSocialLoading ? "구글 이동 중..." : "Google"}
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                계속 진행하면{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                    이용약관
                </Link>{" "}
                및{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                    개인정보처리방침
                </Link>
                에 동의하는 것으로 간주됩니다.
            </p>
        </form>
    );
};
