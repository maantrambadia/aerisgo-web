import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plane,
  Gift,
  CreditCard,
  Lock,
  X,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";
import api from "@/lib/api";
import { toast } from "sonner";

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

  // Get booking data from sessionStorage
  const getBookingData = () => {
    const stored = sessionStorage.getItem(`booking_${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  };

  const bookingData = getBookingData();
  const { flight, seats, from, to, date, passengers } = bookingData || {};

  useDocumentTitle("Confirm Booking");

  useEffect(() => {
    if (!flight || !seats) {
      navigate("/");
      return;
    }
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const baseFare = Number(flight?.baseFare || 0);

    if (!pricingConfig || !seats || seats.length === 0) {
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

    seats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = baseFare * classMultiplier;
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

    const total = subtotal + totalGst + totalFuelSurcharge + totalAirportFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      extraLegroomTotal: Math.round(extraLegroomTotal * 100) / 100,
      gst: Math.round(totalGst * 100) / 100,
      fuelSurcharge: Math.round(totalFuelSurcharge * 100) / 100,
      airportFee: Math.round(totalAirportFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [flight?.baseFare, seats, pricingConfig]);

  const finalAmount = useMemo(() => {
    const rewardDiscount = rewardPointsToUse;
    return Math.max(0, pricing.total - rewardDiscount);
  }, [pricing.total, rewardPointsToUse]);

  function handleUseRewards() {
    const maxUsable = Math.min(rewardBalance, Math.floor(pricing.total));
    setRewardPointsToUse(maxUsable);
    toast.success(`${maxUsable} points applied (₹${maxUsable} discount)`);
  }

  function handleRemoveRewards() {
    setRewardPointsToUse(0);
  }

  async function handlePayment() {
    setShowPaymentModal(false);
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create booking
      const bookingPayload = {
        flightId: flight._id,
        seatNumbers: seats.map((s) => s.seatNumber),
        totalAmount: finalAmount,
        paymentMethod: "card",
        rewardPointsUsed: rewardPointsToUse,
        passengers: passengers || [],
      };

      const res = await api.post("/bookings/create", bookingPayload);

      // Store points earned from response
      if (res.data?.pointsEarned) {
        setPointsEarned(res.data.pointsEarned);
      }

      // Clear sessionStorage
      sessionStorage.removeItem(`booking_${flight._id}`);
      sessionStorage.removeItem(`flight_${flight._id}`);

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
  if (loading || (!flight && !showSuccess) || (!seats && !showSuccess)) {
    return <LoadingFallback />;
  }

  // If showing success modal, don't render the main content
  if (showSuccess && (!flight || !seats)) {
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
                  {formatTime(flight.departureTime)}
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
                  {formatTime(flight.arrivalTime)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <p
              className="font-medium text-[11px] text-center mt-2"
              style={{ color: "rgba(227, 215, 203, 0.7)" }}
            >
              {calculateDuration(flight.departureTime, flight.arrivalTime)}
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
                  {flight.flightNumber || "AG-101"}
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

        {/* Selected Seats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "#541424" }}>
            Selected Seats
          </h3>
          <div className="flex flex-wrap gap-2">
            {seats.map((seat, i) => (
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

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-32"
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "#541424" }}>
            Price Summary
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
                Subtotal ({seats.length} seat{seats.length > 1 ? "s" : ""})
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
