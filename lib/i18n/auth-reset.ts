export type AuthLang = "ko" | "en";

export const resolveAuthLang = (locale: string | null | undefined): AuthLang => {
  if (!locale) {
    return "en";
  }
  return locale.toLowerCase().startsWith("ko") ? "ko" : "en";
};

export const forgotPasswordText = {
  ko: {
    title: "비밀번호 찾기",
    description: "가입한 이메일을 입력하면 재설정 링크를 보내드립니다.",
    emailLabel: "이메일",
    submit: "재설정 링크 보내기",
    submitting: "요청 중...",
    successTitle: "요청 완료",
    successText: "등록된 이메일이 있다면 비밀번호 재설정 링크를 발송했습니다.",
    requestFailed: "비밀번호 재설정 요청에 실패했습니다.",
    requestError: "비밀번호 재설정 요청 중 오류가 발생했습니다.",
    backToLogin: "로그인으로 돌아가기",
    confirmButton: "확인",
  },
  en: {
    title: "Forgot Password",
    description: "Enter your email and we will send a reset link.",
    emailLabel: "Email",
    submit: "Send Reset Link",
    submitting: "Sending...",
    successTitle: "Request Completed",
    successText: "If the email is registered, a password reset link has been sent.",
    requestFailed: "Failed to request password reset.",
    requestError: "An error occurred while requesting password reset.",
    backToLogin: "Back to Login",
    confirmButton: "OK",
  },
} as const;

export const resetPasswordText = {
  ko: {
    title: "비밀번호 재설정",
    description: "이메일 링크에서 들어오면 새 비밀번호를 입력해 변경할 수 있습니다.",
    invalidLink: "유효한 재설정 링크가 아닙니다. 이메일 링크를 다시 확인해 주세요.",
    mismatch: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
    resetFailed: "비밀번호 재설정에 실패했습니다.",
    resetError: "비밀번호 재설정 중 오류가 발생했습니다.",
    successTitle: "비밀번호 변경 완료",
    successText: "새 비밀번호로 로그인해 주세요.",
    newPasswordLabel: "새 비밀번호",
    confirmLabel: "새 비밀번호 확인",
    confirmPlaceholder: "새 비밀번호를 다시 입력하세요",
    submitting: "변경 중...",
    submit: "비밀번호 변경",
    backToLogin: "로그인으로 돌아가기",
    confirmButton: "확인",
  },
  en: {
    title: "Reset Password",
    description: "Open the link from your email and set a new password.",
    invalidLink: "Invalid reset link. Please check the link from your email.",
    mismatch: "New password and confirmation do not match.",
    resetFailed: "Failed to reset password.",
    resetError: "An error occurred while resetting your password.",
    successTitle: "Password Updated",
    successText: "Please log in with your new password.",
    newPasswordLabel: "New Password",
    confirmLabel: "Confirm New Password",
    confirmPlaceholder: "Enter your new password again",
    submitting: "Updating...",
    submit: "Update Password",
    backToLogin: "Back to Login",
    confirmButton: "OK",
  },
} as const;
