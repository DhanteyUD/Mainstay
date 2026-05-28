import { toast, type ToastOptions } from "react-toastify";

const base: ToastOptions = {
  position: "bottom-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const notify = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...base, ...options }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...base, autoClose: 6000, ...options }),

  warning: (message: string, options?: ToastOptions) =>
    toast.warning(message, { ...base, ...options }),

  info: (message: string, options?: ToastOptions) =>
    toast.info(message, { ...base, ...options }),
};
