import { motion } from "motion/react";
import { OTPForm } from "@/components/OTPForm";
import { Link } from "react-router";

export default function VerifyOTP() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/welcome-logo-2.png"
              alt="AerisGo"
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <OTPForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <motion.img
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          alt="Flight booking"
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/auth-bg.png"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute bottom-0 left-0 right-0 p-10"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Almost there!</h2>
          <p className="text-white/90 text-lg">
            Verify your email to complete your registration
          </p>
        </motion.div>
      </div>
    </div>
  );
}
