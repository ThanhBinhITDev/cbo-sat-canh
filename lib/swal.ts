import Swal, { type SweetAlertOptions } from "sweetalert2";

/**
 * Cấu hình base cho SweetAlert2 theo đúng design system và màu sắc của CBO Sát Cánh:
 * - Font chữ kế thừa hệ thống (Be Vietnam Pro)
 * - Bo góc mượt mà, bóng đổ êm ái
 * - Nút bấm trau chuốt, màu sắc hài hoà chuẩn brand
 */
export const AppSwal = Swal.mixin({
  customClass: {
    popup: "cbosc-swal-popup",
    title: "cbosc-swal-title",
    htmlContainer: "cbosc-swal-html",
    confirmButton: "cbosc-swal-confirm-btn",
    cancelButton: "cbosc-swal-cancel-btn",
    actions: "cbosc-swal-actions",
  },
  buttonsStyling: false,
});

/**
 * Hộp thoại xác nhận thao tác (Xoá, Khoá, Thay đổi...)
 */
export async function confirmDialog(options: {
  title?: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
}): Promise<boolean> {
  const {
    title = "Xác nhận thao tác",
    text,
    confirmButtonText = "Xác nhận",
    cancelButtonText = "Huỷ",
    isDanger = true,
  } = options;

  const result = await AppSwal.fire({
    title,
    text,
    icon: isDanger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: "cbosc-swal-popup",
      title: "cbosc-swal-title",
      htmlContainer: "cbosc-swal-html",
      confirmButton: isDanger
        ? "cbosc-swal-confirm-btn cbosc-swal-btn-danger"
        : "cbosc-swal-confirm-btn cbosc-swal-btn-primary",
      cancelButton: "cbosc-swal-cancel-btn",
      actions: "cbosc-swal-actions",
    },
  });

  return result.isConfirmed;
}

/**
 * Hiển thị thông báo Toast góc trên với SweetAlert2 (tuỳ chọn)
 */
export const SwalToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: {
    popup: "cbosc-swal-toast",
    title: "cbosc-swal-toast-title",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});
