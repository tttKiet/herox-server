import { toast, ToastOptions } from "react-toastify";
import axios from "axios";

interface NotificationFetchParams {
  promiseRunner: Promise<unknown>;
  toastSetting?: ToastOptions;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

export async function notificationFetch<T = unknown>({
  promiseRunner,
  toastSetting,
}: NotificationFetchParams): Promise<ApiResponse<T>> {
  try {
    const res = (await promiseRunner) as ApiResponse<T>;
    console.log("res api: ", res);

    // Luôn show message nếu có, kể cả khi ok: false
    if (res.ok) {
      toast.success(res.message || "Success!", toastSetting);
      return res;
    } else {
      toast.error(res.message || "An error occurred!", toastSetting);
      return res;
    }
  } catch (error) {
    let message = "An error occurred!";
    if (axios.isAxiosError(error)) {
      message = error.response?.data?.message || message;
    } else if (typeof error === "object" && error && "message" in error) {
      message = (error as { message?: string }).message || message;
    }
    toast.error(message, toastSetting);
    return {
      ok: false,
      message,
    };
  }
}
