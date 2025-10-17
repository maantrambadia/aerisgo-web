import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, ArrowLeft } from "lucide-react";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export function ForgotPasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  useDocumentTitle("Forgot Password");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/password/reset/request", {
        email: email.trim(),
      });

      toast.success(data.message || "Reset code sent to your email!");
      navigate("/reset-password", { state: { email: email.trim() } });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to send reset code";
      toast.error(message);
    } finally {
      setLoading(false);
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
              Forgot password?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-muted-foreground text-sm text-balance"
            >
              Enter your email and we&apos;ll send you a code to reset your
              password
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center text-sm"
          >
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-1 underline underline-offset-4 font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
