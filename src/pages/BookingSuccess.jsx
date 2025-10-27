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
      const timer = setTimeout(() => navigate("/"), 0);
      return () => clearTimeout(timer);
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => navigate("/"), 0);
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
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-background rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-2xl border-primary/15">
          <div className="p-6 sm:p-8 md:p-12 flex flex-col items-center">
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
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-green-500 flex items-center justify-center mb-4 sm:mb-6 shadow-2xl"
            >
              <Check
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 text-white"
                strokeWidth={3}
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 text-center text-primary"
            >
              Booking Confirmed!
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg font-medium text-center mb-4 sm:mb-6 text-primary/70"
            >
              Your flight has been booked successfully
            </motion.p>

            {/* Divider */}
            <div className="w-full h-px my-3 sm:my-4 bg-primary/10" />

            {/* Flight Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="my-4 sm:my-6"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-primary/10">
                <Plane className="h-8 w-8 sm:h-10 sm:w-10 rotate-45 text-primary" />
              </div>
            </motion.div>

            {/* Points Earned Badge */}
            {pointsEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-5 border mb-4 sm:mb-6 bg-green-50 border-green-200"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-2">
                  <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  <span className="text-green-700 font-bold text-lg sm:text-xl text-center">
                    +{pointsEarned} Reward Points Earned!
                  </span>
                </div>
                <p className="text-green-700/70 font-semibold text-xs sm:text-sm text-center">
                  5% of booking amount added to your account
                </p>
              </motion.div>
            )}

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 border text-center bg-secondary/30 border-primary/10">
                <p className="text-xs sm:text-sm font-medium mb-1 text-primary/70">
                  Confirmation Email
                </p>
                <p className="text-sm sm:text-base font-bold text-primary">
                  Sent to your inbox
                </p>
              </div>
              <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 border text-center bg-secondary/30 border-primary/10">
                <p className="text-xs sm:text-sm font-medium mb-1 text-primary/70">
                  Booking Reference
                </p>
                <p className="text-sm sm:text-base font-bold text-primary">
                  Check your email
                </p>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3"
            >
              <Button
                size="lg"
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base rounded-full"
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
              className="text-xs sm:text-sm font-medium text-center mt-4 sm:mt-6 text-primary/50"
            >
              Redirecting to home in {countdown} seconds...
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
