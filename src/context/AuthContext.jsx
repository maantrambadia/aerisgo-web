/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { toast } from "sonner";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = localStorage.getItem("aerisgo_token");
      if (!token) {
        setUser(null);
        return;
      }

      // For web app, we just load from localStorage since we use Bearer tokens
      const storedUser = localStorage.getItem("aerisgo_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem("aerisgo_user");
      localStorage.removeItem("aerisgo_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const { data } = await api.post("/auth/sign-in/app", {
        email,
        password,
      });

      // Check if user is passenger
      if (data.user.role !== "passenger") {
        toast.error("Only passengers can access the web app.");
        throw new Error("Invalid role");
      }

      // Save token and user data
      localStorage.setItem("aerisgo_token", data.token);
      localStorage.setItem("aerisgo_user", JSON.stringify(data.user));
      setUser(data.user);

      toast.success("Signed in successfully.");
      return data.user;
    } catch (err) {
      const status = err?.response?.status;
      const reason = err?.response?.data?.reason;
      const field = err?.response?.data?.field;
      const userNotFound = err?.response?.data?.userNotFound;
      const msg = err?.response?.data?.message || "Login failed";

      // User doesn't exist - redirect to sign-up
      if (status === 404 && userNotFound) {
        toast.error(
          "No account found with this email. Redirecting to sign up...",
        );
        const error = new Error("user_not_found");
        error.redirectToSignUp = true;
        throw error;
      }

      // Incorrect password
      if (status === 401 && field === "password") {
        toast.error("Incorrect password. Please try again.");
        throw err;
      }

      // Handle not verified user
      if (reason === "not_verified") {
        // Store email for OTP verification page
        localStorage.setItem("pending_verification_email", email);

        // Resend OTP
        try {
          await api.post("/auth/email/otp/resend", { email });
          toast.success("A verification code has been sent to your email.");
        } catch (resendErr) {
          console.error("Failed to resend OTP:", resendErr);
        }

        // Throw error with reason so SignInForm can redirect
        const error = new Error("not_verified");
        error.reason = "not_verified";
        error.email = email;
        throw error;
      }

      if (msg !== "Invalid role") {
        toast.error(msg);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("aerisgo_user");
    localStorage.removeItem("aerisgo_token");
    toast.success("Signed out.");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
