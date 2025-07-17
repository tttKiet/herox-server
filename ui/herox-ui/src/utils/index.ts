import { toast, ToastOptions } from "react-toastify";
import axios from "axios";

interface NotificationFetchParams {
  promiseRunner: Promise<unknown>;
  toastSetting?: ToastOptions;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

export async function notificationFetch<T = unknown>({
  promiseRunner,
  toastSetting,
  loadingMessage,
  successMessage,
  errorMessage,
}: NotificationFetchParams): Promise<ApiResponse<T>> {
  // Create a toast ID to track and update
  const toastId = toastSetting?.toastId || `toast-${Date.now()}`;

  try {
    // Show loading toast if a message is provided
    if (loadingMessage) {
      toast.info(loadingMessage, {
        ...toastSetting,
        toastId,
        autoClose: false, // Don't close automatically while loading
        isLoading: true,
      });
    }

    const res = (await promiseRunner) as ApiResponse<T>;

    // Update or create toast
    if (res.ok) {
      const message = successMessage || res.message || "Success!";

      if (loadingMessage) {
        // Update the existing toast
        toast.update(toastId, {
          render: message,
          type: "success",
          isLoading: false,
          ...toastSetting,
        });
      } else {
        // Create a new toast
        toast.success(message, toastSetting);
      }
      return res;
    } else {
      const message = errorMessage || res.message || "An error occurred!";

      if (loadingMessage) {
        // Update the existing toast
        toast.update(toastId, {
          render: message,
          type: "error",
          isLoading: false,
          ...toastSetting,
        });
      } else {
        // Create a new toast
        toast.error(message, toastSetting);
      }
      return res;
    }
  } catch (error) {
    let message = errorMessage || "An error occurred!";

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        message =
          errorMessage ||
          "Request timeout. The server took too long to respond.";
      } else {
        message = error.response?.data?.message || message;
      }
    } else if (typeof error === "object" && error && "message" in error) {
      message = (error as { message?: string }).message || message;
    }

    if (loadingMessage) {
      // Update the existing toast
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        ...toastSetting,
      });
    } else {
      // Create a new toast
      toast.error(message, toastSetting);
    }

    return {
      ok: false,
      message,
    };
  }
}
