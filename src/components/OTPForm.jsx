import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function OTPForm({ className, ...props }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const email =
    location.state?.email ||
    localStorage.getItem("pending_verification_email") ||
    "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/email/verify", {
        email,
        code: otp,
      });

      // Auto-login user with the token returned from verification
      if (data.token && data.user) {
        localStorage.setItem("aerisgo_token", data.token);
        localStorage.setItem("aerisgo_user", JSON.stringify(data.user));

        // Clear pending verification email
        localStorage.removeItem("pending_verification_email");

        // Refresh auth state to update user in context
        await refresh();

        toast.success("Email verified. Welcome to AerisGo!");
        navigate("/", { replace: true });
      } else {
        // Fallback if no token (shouldn't happen)
        localStorage.removeItem("pending_verification_email");
        toast.success(data.message || "Email verified successfully.");
        navigate("/sign-in");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Invalid verification code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("We couldn't find your email. Please sign up again.");
      navigate("/sign-up");
      return;
    }

    setResending(true);

    try {
      const { data } = await api.post("/auth/email/otp/resend", { email });
      toast.success(data.message || "A new verification code has been sent.");
      setOtp(""); // Clear the OTP input
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "We couldn't resend the code. Please try again.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl font-bold"
            >
              Enter verification code
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-muted-foreground text-sm text-balance"
            >
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center"
          >
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={loading || resending}
            >
              <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center text-sm text-muted-foreground"
          >
            Enter the 6-digit code sent to your email.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Button
              type="submit"
              className="w-full"
              disabled={loading || resending}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center text-sm"
          >
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
              className="underline underline-offset-4 font-medium hover:text-primary disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend"}
            </button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
