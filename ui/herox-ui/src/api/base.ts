import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

// Create a base API instance with common configurations
export const baseApi = axios.create({
  timeout: 30000, // Default 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging or adding auth tokens
baseApi.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
baseApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", error.config?.url);
    } else if (axios.isAxiosError(error)) {
      console.error(`API Error (${error.config?.url}):`, error.message);
    } else {
      console.error("Unknown API error:", error);
    }
    return Promise.reject(error);
  }
);

// Helper function to handle errors in a consistent way
export const handleFetchErrors = (
  error: unknown,
  defaultMessage = "An error occurred"
) => {
  let errorMessage = defaultMessage;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (
      axiosError.response?.data &&
      typeof axiosError.response.data === "object"
    ) {
      const responseData = axiosError.response.data as any;
      errorMessage =
        responseData.message || responseData.error || defaultMessage;
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  toast.error(errorMessage);

  return {
    ok: false,
    message: errorMessage,
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };
};
