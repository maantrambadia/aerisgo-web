import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Check, Gift, Home, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Get booking data from location state
  const { pointsEarned, bookingDetails } = location.state || {};

  useDocumentTitle("Booking Confirmed");

  useEffect(() => {
    // Redirect if no booking data
    if (!location.state) {
      navigate("/");
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, location.state]);

  if (!location.state) {
    return null;
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-full max-w-2xl"
      >
        <div
          className="bg-background rounded-[32px] border-2 overflow-hidden shadow-2xl"
          style={{ borderColor: "rgba(84, 20, 36, 0.15)" }}
        >
          <div className="p-8 md:p-12 flex flex-col items-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 300,
                delay: 0.2,
              }}
              className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-2xl"
            >
              <Check className="h-20 w-20 text-white" strokeWidth={3} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-3 text-center"
              style={{ color: "#541424" }}
            >
              Booking Confirmed!
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg font-medium text-center mb-6"
              style={{ color: "rgba(84, 20, 36, 0.7)" }}
            >
              Your flight has been booked successfully
            </motion.p>

            {/* Divider */}
            <div
              className="w-full h-px my-4"
              style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
            />

            {/* Flight Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="my-6"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
              >
                <Plane
                  className="h-10 w-10 rotate-45"
                  style={{ color: "#541424" }}
                />
              </div>
            </motion.div>

            {/* Points Earned Badge */}
            {pointsEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full rounded-[24px] px-6 py-5 border mb-6"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.2)",
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Gift className="h-6 w-6 text-green-600" />
                  <span className="text-green-700 font-bold text-xl">
                    +{pointsEarned} Reward Points Earned!
                  </span>
                </div>
                <p className="text-green-700/70 font-semibold text-sm text-center">
                  5% of booking amount added to your account
                </p>
              </motion.div>
            )}

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              <div
                className="rounded-[20px] p-4 border text-center"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.3)",
                  borderColor: "rgba(84, 20, 36, 0.1)",
                }}
              >
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Confirmation Email
                </p>
                <p className="text-base font-bold" style={{ color: "#541424" }}>
                  Sent to your inbox
                </p>
              </div>
              <div
                className="rounded-[20px] p-4 border text-center"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.3)",
                  borderColor: "rgba(84, 20, 36, 0.1)",
                }}
              >
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Booking Reference
                </p>
                <p className="text-base font-bold" style={{ color: "#541424" }}>
                  Check your email
                </p>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                className="flex-1 h-12 text-base rounded-full"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </motion.div>

            {/* Auto-redirect message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm font-medium text-center mt-6"
              style={{ color: "rgba(84, 20, 36, 0.5)" }}
            >
              Redirecting to home in {countdown} seconds...
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
