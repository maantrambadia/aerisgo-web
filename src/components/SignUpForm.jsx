import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export function SignUpForm({ className, ...props }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // digits only, 10 max
  const [gender, setGender] = useState("other");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  useDocumentTitle("Sign Up");

  function toTitleCaseLettersOnly(value) {
    const lettersAndSpaces = value.replace(/[^A-Za-z ]+/g, "");
    return lettersAndSpaces
      .replace(/\s+/g, " ")
      .replace(
        /\b([A-Za-z])(\w*)/g,
        (_, f, rest) => f.toUpperCase() + rest.toLowerCase(),
      );
  }

  function handleNameChange(e) {
    const next = toTitleCaseLettersOnly(e.target.value);
    setName(next);
  }

  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validations
      if (!name || !/^[A-Za-z ]+$/.test(name)) {
        toast.error(
          "Please enter a valid full name (letters and spaces only).",
        );
        return;
      }

      // Password rules: min 8 chars, at least one letter and one number
      if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
      ) {
        toast.error(
          "Password must be at least 8 characters and include at least one letter and one number.",
        );
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      if (phone.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number.");
        return;
      }

      if (!["male", "female", "other"].includes(gender)) {
        toast.error("Please select a gender.");
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: `+91${phone}`,
        password,
        gender,
      };

      const { data } = await api.post("/auth/sign-up", payload);
      toast.success(
        data.message ||
          "Account created. Please verify your email to continue.",
      );
      navigate("/verify-otp", { state: { email: email.trim() } });
    } catch (error) {
      const message =
        error?.response?.data?.message || "We couldn't create your account.";
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
              Create an account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-muted-foreground text-sm text-balance"
            >
              Enter your details to get started
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={handleNameChange}
              required
              disabled={loading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label htmlFor="phone">Phone</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 bg-input/50 px-3 text-sm text-foreground/80">
                +91
              </span>
              <Input
                id="phone"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rounded-l-none"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="10-digit number"
                maxLength={10}
                required
                disabled={loading}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label>Gender</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={gender === "male" ? "default" : "outline"}
                onClick={() => setGender("male")}
                disabled={loading}
                className="w-full"
              >
                Male
              </Button>
              <Button
                type="button"
                variant={gender === "female" ? "default" : "outline"}
                onClick={() => setGender("female")}
                disabled={loading}
                className="w-full"
              >
                Female
              </Button>
              <Button
                type="button"
                variant={gender === "other" ? "default" : "outline"}
                onClick={() => setGender("other")}
                disabled={loading}
                className="w-full"
              >
                Other
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pr-10"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.67 20.67 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.66 20.66 0 0 1-4.07 5.17" />
                    <path d="M14.12 9.88a3 3 0 1 1-4.24 4.24" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="grid gap-3"
          >
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="pr-10"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.67 20.67 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.66 20.66 0 0 1-4.07 5.17" />
                    <path d="M14.12 9.88a3 3 0 1 1-4.24 4.24" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-center text-sm"
          >
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="underline underline-offset-4 font-medium"
            >
              Sign in
            </Link>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
