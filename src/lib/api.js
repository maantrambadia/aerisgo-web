import axios from "axios";
import { toast } from "sonner";

// in production, there's no localhost so we have to make this dynamic
const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000/"
    : "https://api.aerisgo.in/";

const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor - Add Bearer token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aerisgo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    // Handle 401 - Unauthorized (token expired or invalid)
    if (status === 401) {
      localStorage.removeItem("aerisgo_token");
      localStorage.removeItem("aerisgo_user");

      // Only redirect if not already on auth pages
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        if (
          current !== "/sign-in" &&
          current !== "/sign-up" &&
          current !== "/verify-otp" &&
          current !== "/forgot-password" &&
          current !== "/reset-password"
        ) {
          toast.error(
            message || "Your session has expired. Please sign in again.",
          );
          window.location.assign("/sign-in");
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
