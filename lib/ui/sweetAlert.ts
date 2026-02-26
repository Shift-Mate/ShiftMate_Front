import Swal from "sweetalert2";

type ConfirmOptions = {
  title: string;
  text?: string;
  icon?: "warning" | "question" | "info" | "success" | "error";
  confirmButtonText?: string;
  cancelButtonText?: string;
};

export const showSuccessAlert = async (
  title: string,
  text?: string,
): Promise<void> => {
  await Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "확인",
  });
};

export const showErrorAlert = async (
  title: string,
  text?: string,
): Promise<void> => {
  await Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "확인",
  });
};

export const showWarningAlert = async (
  title: string,
  text?: string,
): Promise<void> => {
  await Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "확인",
  });
};

export const showConfirmAlert = async ({
  title,
  text,
  icon = "warning",
  confirmButtonText = "확인",
  cancelButtonText = "취소",
}: ConfirmOptions): Promise<boolean> => {
  const result = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });

  return result.isConfirmed;
};
