import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plane,
  Gift,
  CreditCard,
  Lock,
  X,
  Clock,
  Check,
  ShieldCheck,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSeatSocket } from "@/hooks/useSeatSocket";

// Ticket notch component
const Notch = ({ side = "left" }) => (
  <div
    className="absolute w-4 h-4 rounded-full bg-background"
    style={{
      [side]: "-8px",
      top: "50%",
      marginTop: "-8px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#e3d7cb",
    }}
  />
);

// Route pill component
const RoutePill = ({ from, to }) => {
  const fromShort = String(from).split(",")[0].trim();
  const toShort = String(to).split(",")[0].trim();
  return (
    <div
      className="rounded-full px-4 py-2 flex items-center gap-2 border"
      style={{
        backgroundColor: "rgba(227, 215, 203, 0.6)",
        borderColor: "rgba(84, 20, 36, 0.1)",
      }}
    >
      <Plane className="h-4 w-4 rotate-90" style={{ color: "#541424" }} />
      <span className="font-medium" style={{ color: "#541424" }}>
        {fromShort}
      </span>
      <span style={{ color: "#541424" }}>→</span>
      <span className="font-medium" style={{ color: "#541424" }}>
        {toShort}
      </span>
    </div>
  );
};

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [rewardPointsToUse, setRewardPointsToUse] = useState(0);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const timerRef = useRef(null);

  // Card payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Get booking data from sessionStorage
  const getBookingData = () => {
    const stored = sessionStorage.getItem(`booking_${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  };

  const bookingData = getBookingData();
  const {
    flight,
    outboundFlight,
    returnFlight,
    seats,
    outboundSeats,
    returnSeats,
    from,
    to,
    date,
    returnDate,
    passengers,
    tripType,
    totalPrice,
    lockStartTime: bookingLockStartTime,
  } = bookingData || {};

  const isRoundTrip = tripType === "round-trip";
  const displayFlight = outboundFlight || flight;
  const displaySeats = outboundSeats || seats;
  const allSeats = isRoundTrip
    ? [...(outboundSeats || []), ...(returnSeats || [])]
    : seats || [];

  // Parse dynamic price from seat selection
  const dynamicTotalPrice = totalPrice ? parseFloat(totalPrice) : null;

  useDocumentTitle("Confirm Booking");

  // Socket.IO real-time event handlers for seat unlock/expiry
  const socketHandlers = useMemo(
    () => ({
      onSeatUnlocked: (data) => {
        // Check if any of our seats were unlocked
        const affectedSeats = allSeats.filter(
          (seat) => seat.seatNumber === data.seatNumber
        );
        if (affectedSeats.length > 0) {
          toast.error(
            `Seat ${data.seatNumber} was released by admin. Redirecting...`
          );
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      },
      onSeatExpired: (data) => {
        // Check if any of our seats expired
        const affectedSeats = allSeats.filter(
          (seat) => seat.seatNumber === data.seatNumber
        );
        if (affectedSeats.length > 0) {
          toast.error(
            `Your selection for seat ${data.seatNumber} has expired. Redirecting...`
          );
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      },
      onError: (error) => {
        console.error("Socket error:", error);
      },
    }),
    [allSeats, navigate]
  );

  // Initialize Socket.IO connection for both flights if round-trip
  useSeatSocket(displayFlight?._id, socketHandlers);
  if (isRoundTrip && returnFlight) {
    useSeatSocket(returnFlight._id, socketHandlers);
  }

  useEffect(() => {
    if (!displayFlight || !displaySeats) {
      navigate("/");
      return;
    }
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for seat lock
  useEffect(() => {
    // Get lockStartTime from sessionStorage or booking data
    const storedLockStartTime = sessionStorage.getItem(`lock_start_${id}`);
    const lockStartTime = storedLockStartTime || bookingLockStartTime;
    const startTime = parseInt(lockStartTime);
    if (!startTime) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 1200 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current);
        toast.error(
          "Time expired! Your seat selection has expired. Please select again."
        );
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id, bookingLockStartTime, navigate]);

  async function fetchInitialData() {
    try {
      const [rewardsRes, pricingRes] = await Promise.all([
        api.get("/rewards/balance").catch(() => ({ data: { balance: 0 } })),
        api.get("/pricing/config").catch(() => ({ data: null })),
      ]);

      setRewardBalance(rewardsRes.data?.balance || 0);
      setPricingConfig(pricingRes.data?.config);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    } finally {
      setLoading(false);
    }
  }

  const pricing = useMemo(() => {
    // If dynamic price is available from seat selection, use it
    if (dynamicTotalPrice && pricingConfig) {
      const allSeatsCount =
        isRoundTrip && returnSeats
          ? displaySeats.length + returnSeats.length
          : displaySeats.length;

      // Calculate extra legroom total from seats
      let extraLegroomTotal = 0;
      displaySeats.forEach((seat) => {
        if (seat.isExtraLegroom) {
          extraLegroomTotal += pricingConfig.extraLegroom.charge;
        }
      });
      if (isRoundTrip && returnSeats) {
        returnSeats.forEach((seat) => {
          if (seat.isExtraLegroom) {
            extraLegroomTotal += pricingConfig.extraLegroom.charge;
          }
        });
      }

      // Calculate breakdown from dynamic total
      const subtotal = dynamicTotalPrice / 1.08; // Remove 8% taxes (5% GST + 3% fuel)
      const gst = subtotal * 0.05;
      const fuelSurcharge = subtotal * 0.03;
      const airportFee = 150 * allSeatsCount; // ₹150 per seat
      const actualSubtotal =
        dynamicTotalPrice - gst - fuelSurcharge - airportFee;

      return {
        subtotal: Math.round(actualSubtotal * 100) / 100,
        extraLegroomTotal: Math.round(extraLegroomTotal * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        airportFee: Math.round(airportFee * 100) / 100,
        total: Math.round(dynamicTotalPrice * 100) / 100,
      };
    }

    if (!pricingConfig || !displaySeats || displaySeats.length === 0) {
      return {
        subtotal: 0,
        extraLegroomTotal: 0,
        gst: 0,
        fuelSurcharge: 0,
        airportFee: 0,
        total: 0,
      };
    }

    let subtotal = 0;
    let totalGst = 0;
    let totalFuelSurcharge = 0;
    let totalAirportFee = 0;
    let extraLegroomTotal = 0;

    // Calculate outbound flight pricing
    const outboundBaseFare = Number(displayFlight?.baseFare || 0);
    displaySeats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = outboundBaseFare * classMultiplier;
      const extraLegroom = seat.isExtraLegroom
        ? pricingConfig.extraLegroom.charge
        : 0;
      const seatSubtotal = classPrice + extraLegroom;

      const gst = seatSubtotal * pricingConfig.taxes.gst;
      const fuelSurcharge = seatSubtotal * pricingConfig.taxes.fuelSurcharge;
      const airportFee = pricingConfig.taxes.airportFee;

      subtotal += seatSubtotal;
      totalGst += gst;
      totalFuelSurcharge += fuelSurcharge;
      totalAirportFee += airportFee;
      extraLegroomTotal += extraLegroom;
    });

    // Calculate return flight pricing if round-trip
    if (isRoundTrip && returnFlight && returnSeats) {
      const returnBaseFare = Number(returnFlight.baseFare || 0);
      returnSeats.forEach((seat) => {
        const classMultiplier =
          pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
        const classPrice = returnBaseFare * classMultiplier;
        const extraLegroom = seat.isExtraLegroom
          ? pricingConfig.extraLegroom.charge
          : 0;
        const seatSubtotal = classPrice + extraLegroom;

        const gst = seatSubtotal * pricingConfig.taxes.gst;
        const fuelSurcharge = seatSubtotal * pricingConfig.taxes.fuelSurcharge;
        const airportFee = pricingConfig.taxes.airportFee;

        subtotal += seatSubtotal;
        totalGst += gst;
        totalFuelSurcharge += fuelSurcharge;
        totalAirportFee += airportFee;
        extraLegroomTotal += extraLegroom;
      });
    }

    const total = subtotal + totalGst + totalFuelSurcharge + totalAirportFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      extraLegroomTotal: Math.round(extraLegroomTotal * 100) / 100,
      gst: Math.round(totalGst * 100) / 100,
      fuelSurcharge: Math.round(totalFuelSurcharge * 100) / 100,
      airportFee: Math.round(totalAirportFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [
    pricingConfig,
    displaySeats,
    returnSeats,
    displayFlight,
    returnFlight,
    isRoundTrip,
  ]);

  const finalAmount = useMemo(() => {
    const rewardDiscount = rewardPointsToUse;
    return Math.max(0, pricing.total - rewardDiscount);
  }, [pricing.total, rewardPointsToUse]);

  function handleUseRewards() {
    const maxUsable = Math.min(rewardBalance, Math.floor(pricing.total));
    setRewardPointsToUse(maxUsable);
    toast.success(`${maxUsable} points applied (₹${maxUsable} discount)`);
  }

  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  function handleRemoveRewards() {
    setRewardPointsToUse(0);
  }

  async function handlePayment() {
    // Validate card details
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      toast.error("Please enter a valid card number");
      return;
    }
    if (!cardName || cardName.trim().length < 3) {
      toast.error("Please enter cardholder name");
      return;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      toast.error("Please enter expiry date (MM/YY)");
      return;
    }
    if (!cvv || cvv.length < 3) {
      toast.error("Please enter CVV");
      return;
    }

    setShowPaymentModal(false);
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create booking
      const bookingPayload = {
        flightId: displayFlight._id,
        seatNumbers: displaySeats.map((s) => s.seatNumber),
        totalAmount: finalAmount,
        paymentMethod: "card",
        rewardPointsUsed: rewardPointsToUse,
        passengers: passengers || [],
        bookingType: isRoundTrip ? "round-trip" : "one-way",
      };

      // Add return flight details for round-trip
      if (isRoundTrip && returnFlight && returnSeats) {
        bookingPayload.returnFlightId = returnFlight._id;
        bookingPayload.returnSeatNumbers = returnSeats.map((s) => s.seatNumber);
      }

      const res = await api.post("/bookings/create", bookingPayload);

      // Store points earned from response
      if (res.data?.pointsEarned) {
        setPointsEarned(res.data.pointsEarned);
      }

      // Clear sessionStorage
      sessionStorage.removeItem(`booking_${displayFlight._id}`);
      sessionStorage.removeItem(`flight_${displayFlight._id}`);
      if (isRoundTrip && returnFlight) {
        sessionStorage.removeItem(`flight_${returnFlight._id}`);
      }

      setProcessing(false);
      setShowSuccess(true);

      // Navigate to account page after 5 seconds
      setTimeout(() => {
        navigate("/account?tab=tickets");
      }, 5000);
    } catch (err) {
      // Check if error is due to missing documents
      if (err?.response?.data?.requiresDocument) {
        toast.error(
          err?.response?.data?.message ||
            "Please add your identification document"
        );
        setTimeout(() => {
          navigate("/account?tab=profile");
        }, 2000);
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to complete booking"
        );
      }
      setProcessing(false);
    }
  }

  const formatTime = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  };

  const calculateDuration = (departure, arrival) => {
    try {
      const start = new Date(departure).getTime();
      const end = new Date(arrival).getTime();
      const diff = Math.max(0, end - start) / 60000;
      const h = Math.floor(diff / 60);
      const m = Math.round(diff % 60);
      return `${h}h ${m}m`;
    } catch {
      return "--";
    }
  };

  // Show loading fallback unless we're showing the success modal
  if (
    loading ||
    (!displayFlight && !showSuccess) ||
    (!displaySeats && !showSuccess)
  ) {
    return <LoadingFallback />;
  }

  // If showing success modal, don't render the main content
  if (showSuccess && (!displayFlight || !displaySeats)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-background rounded-[32px] border-2 max-w-md w-full overflow-hidden"
                style={{ borderColor: "rgba(84, 20, 36, 0.15)" }}
              >
                <div className="p-8 text-center">
                  {/* Success Icon */}
                  <div className="w-24 h-24 rounded-full bg-green-500 mx-auto mb-5 flex items-center justify-center shadow-lg">
                    <Check className="h-14 w-14 text-white" strokeWidth={3} />
                  </div>

                  {/* Title */}
                  <h2
                    className="text-3xl font-bold mb-2"
                    style={{ color: "#541424" }}
                  >
                    Booking Confirmed!
                  </h2>

                  {/* Subtitle */}
                  <p
                    className="text-base mb-4"
                    style={{ color: "rgba(84, 20, 36, 0.7)" }}
                  >
                    Your flight has been booked successfully
                  </p>

                  {/* Divider */}
                  <div
                    className="w-full h-px my-2"
                    style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                  />

                  {/* Points Earned Badge */}
                  {pointsEarned > 0 && (
                    <div
                      className="rounded-[20px] px-5 py-4 border mt-3"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderColor: "rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Gift className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-bold text-base">
                          +{pointsEarned} Reward Points Earned!
                        </span>
                      </div>
                      <p className="text-green-700/70 font-semibold text-xs">
                        5% of booking amount added to your account
                      </p>
                    </div>
                  )}

                  {/* Info Text */}
                  <p
                    className="text-sm mt-5"
                    style={{ color: "rgba(84, 20, 36, 0.6)" }}
                  >
                    Redirecting to your tickets...
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const getSeatColor = (travelClass) => {
    if (travelClass === "first") return "#a855f7";
    if (travelClass === "business") return "#3b82f6";
    return "#6b7280";
  };

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
              disabled={processing}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Confirm Booking</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl pb-32">
        {/* Seat Lock Timer */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 flex items-center gap-3 border mb-6 ${
            timeRemaining <= 60
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              timeRemaining <= 60 ? "bg-red-100" : "bg-yellow-100"
            }`}
          >
            <Clock
              className="h-5 w-5"
              style={{
                color: timeRemaining <= 60 ? "#dc2626" : "#ca8a04",
              }}
            />
          </div>
          <div className="flex-1">
            <p
              className={`font-semibold text-sm ${
                timeRemaining <= 60 ? "text-red-700" : "text-yellow-700"
              }`}
            >
              Complete booking in {formatTimeRemaining()}
            </p>
            <p
              className={`text-xs ${
                timeRemaining <= 60 ? "text-red-600" : "text-yellow-600"
              }`}
            >
              Your seats will be released after the timer expires
            </p>
          </div>
        </motion.div>

        {/* Title + Route */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <h2
              className="text-3xl font-bold leading-9"
              style={{ color: "#541424" }}
            >
              Review &
            </h2>
            <h2
              className="text-3xl font-bold leading-9 -mt-1"
              style={{ color: "#541424" }}
            >
              Confirm
            </h2>
          </div>
          <RoutePill from={from} to={to} />
        </motion.div>

        {/* Flight Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-6"
        >
          <div
            className="rounded-[28px] p-5 overflow-hidden"
            style={{ backgroundColor: "#541424" }}
          >
            {/* Top row times/cities + arc */}
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-semibold text-[11px]"
                  style={{ color: "rgba(227, 215, 203, 0.9)" }}
                >
                  {from}
                </p>
                <p
                  className="font-bold text-2xl mt-1"
                  style={{ color: "#e3d7cb" }}
                >
                  {formatTime(displayFlight.departureTime)}
                </p>
              </div>

              {/* Arc with plane */}
              <div
                style={{ width: "110px", alignItems: "center" }}
                className="flex flex-col"
              >
                <div
                  style={{
                    width: "100px",
                    height: "44px",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50px",
                      borderWidth: "1px",
                      borderStyle: "dashed",
                      borderColor: "rgba(227, 215, 203, 0.45)",
                    }}
                  />
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center -mt-6"
                  style={{
                    backgroundColor: "#541424",
                    border: "1px solid rgba(227, 215, 203, 0.4)",
                  }}
                >
                  <Plane
                    className="h-4 w-4 rotate-90"
                    style={{ color: "#e3d7cb" }}
                  />
                </div>
              </div>

              <div className="text-right">
                <p
                  className="font-semibold text-[11px]"
                  style={{ color: "rgba(227, 215, 203, 0.9)" }}
                >
                  {to}
                </p>
                <p
                  className="font-bold text-2xl mt-1"
                  style={{ color: "#e3d7cb" }}
                >
                  {formatTime(displayFlight.arrivalTime)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <p
              className="font-medium text-[11px] text-center mt-2"
              style={{ color: "rgba(227, 215, 203, 0.7)" }}
            >
              {calculateDuration(
                displayFlight.departureTime,
                displayFlight.arrivalTime
              )}
            </p>

            {/* Bottom brand/price bar */}
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="font-bold text-2xl" style={{ color: "#e3d7cb" }}>
                  AerisGo
                </p>
                <p
                  className="font-medium text-xs mt-0.5"
                  style={{ color: "rgba(227, 215, 203, 0.7)" }}
                >
                  {displayFlight.flightNumber || "AG-101"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-medium text-xs"
                  style={{ color: "rgba(227, 215, 203, 0.7)" }}
                >
                  {new Date(date).toLocaleDateString()}
                </p>
                <p
                  className="font-semibold text-sm mt-0.5"
                  style={{ color: "#e3d7cb" }}
                >
                  {passengers?.length || 1} Passenger
                  {(passengers?.length || 1) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket notches */}
          <Notch side="left" />
          <Notch side="right" />
        </motion.div>

        {/* Return Flight Ticket Card */}
        {isRoundTrip && returnFlight && returnSeats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative mb-6"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "#541424" }}
              >
                Return Flight
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(84, 20, 36, 0.6)" }}
              >
                {new Date(returnDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div
              className="rounded-[28px] p-5 overflow-hidden"
              style={{ backgroundColor: "#541424" }}
            >
              {/* Top row times/cities + arc */}
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="font-semibold text-[11px]"
                    style={{ color: "rgba(227, 215, 203, 0.9)" }}
                  >
                    {to}
                  </p>
                  <p
                    className="font-bold text-2xl mt-1"
                    style={{ color: "#e3d7cb" }}
                  >
                    {formatTime(returnFlight.departureTime)}
                  </p>
                </div>

                {/* Arc with plane */}
                <div
                  style={{ width: "110px", alignItems: "center" }}
                  className="flex flex-col"
                >
                  <div
                    style={{
                      width: "100px",
                      height: "44px",
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50px",
                        borderWidth: "1px",
                        borderStyle: "dashed",
                        borderColor: "rgba(227, 215, 203, 0.45)",
                      }}
                    />
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center -mt-6"
                    style={{
                      backgroundColor: "#541424",
                      border: "1px solid rgba(227, 215, 203, 0.4)",
                    }}
                  >
                    <Plane
                      className="h-4 w-4 rotate-90"
                      style={{ color: "#e3d7cb" }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="font-semibold text-[11px]"
                    style={{ color: "rgba(227, 215, 203, 0.9)" }}
                  >
                    {from}
                  </p>
                  <p
                    className="font-bold text-2xl mt-1"
                    style={{ color: "#e3d7cb" }}
                  >
                    {formatTime(returnFlight.arrivalTime)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <p
                className="font-medium text-[11px] text-center mt-2"
                style={{ color: "rgba(227, 215, 203, 0.7)" }}
              >
                {calculateDuration(
                  returnFlight.departureTime,
                  returnFlight.arrivalTime
                )}
              </p>

              {/* Bottom brand/price bar */}
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p
                    className="font-bold text-2xl"
                    style={{ color: "#e3d7cb" }}
                  >
                    AerisGo
                  </p>
                  <p
                    className="font-medium text-xs mt-0.5"
                    style={{ color: "rgba(227, 215, 203, 0.7)" }}
                  >
                    {returnFlight.flightNumber || "AG-102"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-medium text-xs"
                    style={{ color: "rgba(227, 215, 203, 0.7)" }}
                  >
                    {new Date(returnDate).toLocaleDateString()}
                  </p>
                  <p
                    className="font-bold text-xl mt-0.5"
                    style={{ color: "#e3d7cb" }}
                  >
                    ₹{" "}
                    {returnFlight.baseFare
                      ? returnFlight.baseFare.toLocaleString("en-IN")
                      : "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket notches */}
            <Notch side="left" />
            <Notch side="right" />
          </motion.div>
        )}

        {/* Selected Seats - Outbound */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isRoundTrip ? 0.35 : 0.3 }}
          className="mb-6"
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "#541424" }}>
            {isRoundTrip ? "Outbound Flight Seats" : "Selected Seats"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {displaySeats.map((seat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="rounded-[16px] px-4 py-3 flex items-center gap-3 border"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.4)",
                  borderColor: "rgba(84, 20, 36, 0.1)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: getSeatColor(seat.travelClass) }}
                >
                  <span className="text-white font-bold text-sm">
                    {seat.seatNumber}
                  </span>
                </div>
                <div>
                  <p
                    className="font-semibold text-sm capitalize"
                    style={{ color: "#541424" }}
                  >
                    {seat.travelClass}
                  </p>
                  {seat.isExtraLegroom && (
                    <p className="text-yellow-600 font-medium text-[10px]">
                      Extra Legroom
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Return Flight Seats */}
        {isRoundTrip && returnSeats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h3
              className="font-bold text-base mb-3"
              style={{ color: "#541424" }}
            >
              Return Flight Seats
            </h3>
            <div className="flex flex-wrap gap-2">
              {returnSeats.map((seat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="rounded-[16px] px-4 py-3 flex items-center gap-3 border"
                  style={{
                    backgroundColor: "rgba(227, 215, 203, 0.4)",
                    borderColor: "rgba(84, 20, 36, 0.1)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: getSeatColor(seat.travelClass) }}
                  >
                    <span className="text-white font-bold text-sm">
                      {seat.seatNumber}
                    </span>
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm capitalize"
                      style={{ color: "#541424" }}
                    >
                      {seat.travelClass}
                    </p>
                    {seat.isExtraLegroom && (
                      <p className="text-yellow-600 font-medium text-[10px]">
                        Extra Legroom
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isRoundTrip ? 0.55 : 0.5 }}
          className="mb-32"
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "#541424" }}>
            Price Summary {isRoundTrip && "(Both Flights)"}
          </h3>
          <div
            className="rounded-[24px] p-5 border"
            style={{
              backgroundColor: "rgba(227, 215, 203, 0.4)",
              borderColor: "rgba(84, 20, 36, 0.1)",
            }}
          >
            {/* Subtotal */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Subtotal (
                {isRoundTrip && returnSeats
                  ? `${displaySeats.length + returnSeats.length} seat${
                      displaySeats.length + returnSeats.length > 1 ? "s" : ""
                    }`
                  : `${displaySeats.length} seat${
                      displaySeats.length > 1 ? "s" : ""
                    }`}
                )
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                ₹ {pricing.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Extra Legroom */}
            {pricing.extraLegroomTotal > 0 && (
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-medium text-sm"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Extra Legroom
                </span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: "#541424" }}
                >
                  ₹ {pricing.extraLegroomTotal.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {/* GST */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                GST (5%)
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                ₹ {pricing.gst.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Fuel Surcharge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Fuel Surcharge (3%)
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                ₹ {pricing.fuelSurcharge.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Airport Fee */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Airport Fee
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                ₹ {pricing.airportFee.toLocaleString("en-IN")}
              </span>
            </div>

            <div
              className="h-px my-2"
              style={{ backgroundColor: "rgba(84, 20, 36, 0.2)" }}
            />

            {/* Total */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-bold text-base"
                style={{ color: "#541424" }}
              >
                Total Amount
              </span>
              <span className="font-bold text-lg" style={{ color: "#541424" }}>
                ₹ {pricing.total.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Rewards Section */}
            {rewardBalance > 0 && (
              <>
                <div
                  className="h-px my-2"
                  style={{ backgroundColor: "rgba(84, 20, 36, 0.2)" }}
                />
                {rewardPointsToUse === 0 ? (
                  <button
                    onClick={handleUseRewards}
                    className="w-full rounded-[16px] p-3 flex items-center justify-between border transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: "rgba(84, 20, 36, 0.1)",
                      borderColor: "rgba(84, 20, 36, 0.15)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" style={{ color: "#541424" }} />
                      <div className="text-left">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#541424" }}
                        >
                          Use Reward Points
                        </p>
                        <p
                          className="font-medium text-xs"
                          style={{ color: "rgba(84, 20, 36, 0.6)" }}
                        >
                          {rewardBalance} points available
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "#541424" }}>→</span>
                  </button>
                ) : (
                  <div
                    className="rounded-[16px] p-3 border"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderColor: "rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-semibold text-sm">
                          Rewards Applied
                        </span>
                      </div>
                      <button onClick={handleRemoveRewards}>
                        <span className="text-green-600 text-xl">×</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700/70 font-medium text-sm">
                        {rewardPointsToUse} points used
                      </span>
                      <span className="text-green-700 font-bold text-sm">
                        - ₹ {rewardPointsToUse.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Final Amount */}
            {rewardPointsToUse > 0 && (
              <>
                <div
                  className="h-px my-3"
                  style={{ backgroundColor: "rgba(84, 20, 36, 0.2)" }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="font-bold text-lg"
                    style={{ color: "#541424" }}
                  >
                    Final Amount
                  </span>
                  <span
                    className="font-bold text-2xl"
                    style={{ color: "#541424" }}
                  >
                    ₹ {finalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Fixed Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t"
      >
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div
            className="rounded-[20px] p-3 mb-3 border"
            style={{
              backgroundColor: "rgba(227, 215, 203, 0.4)",
              borderColor: "rgba(84, 20, 36, 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                {rewardPointsToUse > 0 ? "Final Amount" : "Total Amount"}
              </span>
              <span className="font-bold text-xl" style={{ color: "#541424" }}>
                ₹{" "}
                {(rewardPointsToUse > 0
                  ? finalAmount
                  : pricing.total
                ).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base rounded-full"
            onClick={() => setShowPaymentModal(true)}
            disabled={processing}
          >
            {processing ? (
              <>Processing Payment...</>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Lock
              className="h-4 w-4"
              style={{ color: "rgba(84, 20, 36, 0.7)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "rgba(84, 20, 36, 0.7)" }}
            >
              Your payment is secure and encrypted
            </span>
          </div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
            onClick={() => !processing && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-background rounded-t-[32px] border-t-2"
              style={{ borderColor: "rgba(84, 20, 36, 0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "#541424" }}
                  >
                    Payment Details
                  </h2>
                  <button
                    onClick={() => !processing && setShowPaymentModal(false)}
                    disabled={processing}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                  >
                    <X className="h-5 w-5" style={{ color: "#541424" }} />
                  </button>
                </div>

                {/* Payment Summary Card */}
                <div
                  className="rounded-[24px] p-5 mb-6 border"
                  style={{
                    backgroundColor: "rgba(84, 20, 36, 0.05)",
                    borderColor: "rgba(84, 20, 36, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-medium text-sm mb-1"
                        style={{ color: "rgba(84, 20, 36, 0.7)" }}
                      >
                        Amount to Pay
                      </p>
                      <p
                        className="font-bold text-3xl"
                        style={{ color: "#541424" }}
                      >
                        ₹{" "}
                        {(rewardPointsToUse > 0
                          ? finalAmount
                          : pricing.total
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                    >
                      <CreditCard
                        className="h-7 w-7"
                        style={{ color: "#541424" }}
                      />
                    </div>
                  </div>
                  {rewardPointsToUse > 0 && (
                    <div
                      className="flex items-center gap-2 mt-4 pt-4 border-t"
                      style={{ borderColor: "rgba(84, 20, 36, 0.1)" }}
                    >
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-semibold text-sm">
                        {rewardPointsToUse} reward points applied
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3
                    className="font-bold text-base mb-3"
                    style={{ color: "#541424" }}
                  >
                    Payment Method
                  </h3>
                  <div
                    className="rounded-[24px] p-5 border"
                    style={{
                      backgroundColor: "#541424",
                      borderColor: "rgba(84, 20, 36, 0.2)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(227, 215, 203, 0.15)" }}
                      >
                        <CreditCard
                          className="h-6 w-6"
                          style={{ color: "#e3d7cb" }}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className="font-bold text-base"
                          style={{ color: "#e3d7cb" }}
                        >
                          Credit/Debit Card
                        </p>
                        <p
                          className="font-medium text-sm mt-1"
                          style={{ color: "rgba(227, 215, 203, 0.7)" }}
                        >
                          Secure payment gateway
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Details Form */}
                <div className="mb-6">
                  <h3
                    className="font-bold text-base mb-3"
                    style={{ color: "#541424" }}
                  >
                    Card Details
                  </h3>

                  {/* Card Number */}
                  <div className="mb-4">
                    <label
                      className="block font-semibold text-sm mb-2"
                      style={{ color: "#541424" }}
                    >
                      Card Number
                    </label>
                    <div
                      className="flex items-center gap-3 border-2 rounded-[16px] px-4 py-3"
                      style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                    >
                      <CreditCard
                        className="h-5 w-5"
                        style={{ color: "#541424" }}
                      />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="flex-1 outline-none font-medium text-base"
                        style={{ color: "#541424" }}
                        value={cardNumber}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "");
                          const formatted =
                            cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
                          setCardNumber(formatted.slice(0, 19));
                        }}
                        maxLength={19}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="mb-4">
                    <label
                      className="block font-semibold text-sm mb-2"
                      style={{ color: "#541424" }}
                    >
                      Cardholder Name
                    </label>
                    <div
                      className="flex items-center gap-3 border-2 rounded-[16px] px-4 py-3"
                      style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                    >
                      <User className="h-5 w-5" style={{ color: "#541424" }} />
                      <input
                        type="text"
                        placeholder="JOHN DOE"
                        className="flex-1 outline-none font-medium text-base uppercase"
                        style={{ color: "#541424" }}
                        value={cardName}
                        onChange={(e) => {
                          // Only allow letters and spaces
                          const cleaned = e.target.value.replace(
                            /[^a-zA-Z\s]/g,
                            ""
                          );
                          setCardName(cleaned.toUpperCase());
                        }}
                      />
                    </div>
                  </div>

                  {/* Expiry Date and CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block font-semibold text-sm mb-2"
                        style={{ color: "#541424" }}
                      >
                        Expiry Date
                      </label>
                      <div
                        className="flex items-center gap-3 border-2 rounded-[16px] px-4 py-3"
                        style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                      >
                        <Calendar
                          className="h-5 w-5"
                          style={{ color: "#541424" }}
                        />
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="flex-1 outline-none font-medium text-base"
                          style={{ color: "#541424" }}
                          value={expiryDate}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "");
                            if (cleaned.length >= 2) {
                              setExpiryDate(
                                cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4)
                              );
                            } else {
                              setExpiryDate(cleaned);
                            }
                          }}
                          maxLength={5}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block font-semibold text-sm mb-2"
                        style={{ color: "#541424" }}
                      >
                        CVV
                      </label>
                      <div
                        className="flex items-center gap-3 border-2 rounded-[16px] px-4 py-3"
                        style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                      >
                        <Lock
                          className="h-5 w-5"
                          style={{ color: "#541424" }}
                        />
                        <input
                          type="password"
                          placeholder="123"
                          className="flex-1 outline-none font-medium text-base"
                          style={{ color: "#541424" }}
                          value={cvv}
                          onChange={(e) =>
                            setCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  size="lg"
                  className="w-full h-12 text-base rounded-full mb-4"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>Processing Payment...</>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Confirm & Pay ₹
                      {(rewardPointsToUse > 0
                        ? finalAmount
                        : pricing.total
                      ).toLocaleString("en-IN")}
                    </>
                  )}
                </Button>

                {/* Security Note */}
                <div
                  className="flex items-center justify-center gap-2 pt-4 border-t"
                  style={{ borderColor: "rgba(84, 20, 36, 0.1)" }}
                >
                  <Lock
                    className="h-4 w-4"
                    style={{ color: "rgba(84, 20, 36, 0.7)" }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "rgba(84, 20, 36, 0.7)" }}
                  >
                    Your payment is secure and encrypted
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-background rounded-[32px] border-2 max-w-md w-full overflow-hidden"
              style={{ borderColor: "rgba(84, 20, 36, 0.15)" }}
            >
              <div className="p-8 text-center">
                {/* Success Icon */}
                <div className="w-24 h-24 rounded-full bg-green-500 mx-auto mb-5 flex items-center justify-center shadow-lg">
                  <Check className="h-14 w-14 text-white" strokeWidth={3} />
                </div>

                {/* Title */}
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{ color: "#541424" }}
                >
                  Booking Confirmed!
                </h2>

                {/* Subtitle */}
                <p
                  className="text-base mb-4"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Your flight has been booked successfully
                </p>

                {/* Divider */}
                <div
                  className="w-full h-px my-2"
                  style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                />

                {/* Points Earned Badge */}
                {pointsEarned > 0 && (
                  <div
                    className="rounded-[20px] px-5 py-4 border mt-3"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderColor: "rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Gift className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-bold text-base">
                        +{pointsEarned} Reward Points Earned!
                      </span>
                    </div>
                    <p className="text-green-700/70 font-semibold text-xs">
                      5% of booking amount added to your account
                    </p>
                  </div>
                )}

                {/* Info Text */}
                <p
                  className="text-sm mt-5"
                  style={{ color: "rgba(84, 20, 36, 0.6)" }}
                >
                  Redirecting to your tickets...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
