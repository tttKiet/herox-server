import axios from "axios";

// Create a custom axios instance with default configurations
const apiClient = axios.create({
  timeout: 30000, // Default 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging or adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
apiClient.interceptors.response.use(
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

export default apiClient;
