import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plane,
  Armchair,
  DoorOpen,
  Coffee,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";
import api from "@/lib/api";
import { toast } from "sonner";

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

// Seat Button Component
const SeatButton = ({ seat, selected, onPress, rowClass }) => {
  const getSeatColor = () => {
    if (selected) return "#541424"; // Primary - Selected
    if (!seat.isAvailable) return "#dc2626"; // Red - Occupied
    if (seat.isExtraLegroom) return "#eab308"; // Yellow - Extra Legroom
    if (rowClass === "first") return "#a855f7"; // Purple - First Class
    if (rowClass === "business") return "#3b82f6"; // Blue - Business
    return "#6b7280"; // Grey - Economy
  };

  const getBorderColor = () => {
    if (selected) return "#6b1a2f";
    if (!seat.isAvailable) return "#991b1b";
    if (seat.isExtraLegroom) return "#ca8a04";
    if (rowClass === "first") return "#7c3aed";
    if (rowClass === "business") return "#2563eb";
    return "#4b5563";
  };

  const handleClick = () => {
    if (!seat.isAvailable) {
      toast.error("This seat is already booked");
      return;
    }
    onPress(seat);
  };

  return (
    <motion.button
      whileHover={{ scale: seat.isAvailable ? 1.1 : 1 }}
      whileTap={{ scale: seat.isAvailable ? 0.95 : 1 }}
      onClick={handleClick}
      disabled={!seat.isAvailable}
      className="w-11 h-11 rounded-xl flex flex-col items-center justify-center border-2 transition-all"
      style={{
        backgroundColor: getSeatColor(),
        borderColor: getBorderColor(),
        cursor: seat.isAvailable ? "pointer" : "not-allowed",
      }}
      title={
        seat.isAvailable
          ? `${seat.seatNumber} - Available`
          : `${seat.seatNumber} - Booked`
      }
    >
      <Armchair className="h-4 w-4" style={{ color: "#e3d7cb" }} />
      <span
        className="text-[9px] font-bold mt-0.5"
        style={{ color: "#e3d7cb" }}
      >
        {seat.seatNumber.match(/[A-F]/)}
      </span>
    </motion.button>
  );
};

export default function SeatSelection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  // Get flight data from location state or sessionStorage
  const getFlightData = () => {
    if (location.state?.flight) {
      return location.state;
    }
    const stored = sessionStorage.getItem(`flight_${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  };

  const flightData = getFlightData();
  const { flight, from, to, date, passengers } = flightData || {};
  const maxSeats = parseInt(passengers || 1);

  useDocumentTitle("Select Seats");

  useEffect(() => {
    if (!flight) {
      navigate("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Check if user has documents
      const profileRes = await api.get("/profile");
      const userDocs = profileRes.data?.documents || [];

      if (userDocs.length === 0) {
        setLoading(false);
        setHasDocuments(false);
        setShowDocumentModal(true);
        return;
      }

      setHasDocuments(true);

      // Check if user already has a booking on this flight
      const bookingsRes = await api.get("/bookings/my-bookings");
      const existingBooking = bookingsRes.data?.items?.find(
        (booking) =>
          booking.flightId?._id === flight._id &&
          (booking.status === "confirmed" || booking.status === "pending")
      );

      if (existingBooking) {
        setLoading(false);
        toast.error(
          `You already have a booking on this flight (Seat ${existingBooking.seatNumber})`,
          {
            duration: 3000,
          }
        );
        setTimeout(() => {
          navigate(-1);
        }, 2000);
        return;
      }

      // Fetch seats
      const seatsRes = await api.get(`/seats/flight/${flight._id}`);

      // Fetch pricing config
      const pricingRes = await api.get("/pricing/config");

      setSeats(seatsRes.data.seats || []);
      setPricingConfig(pricingRes.data.config);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err?.response?.data?.message || "Failed to load seats");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    }
  }

  function handleSeatSelect(seat) {
    const isAlreadySelected = selectedSeats.some(
      (s) => s.seatNumber === seat.seatNumber
    );

    if (isAlreadySelected) {
      setSelectedSeats(
        selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber)
      );
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.warning(`You can only select ${maxSeats} seat(s)`);
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  }

  function handleContinue() {
    if (selectedSeats.length === 0) {
      toast.warning("Please select at least one seat");
      return;
    }

    if (selectedSeats.length < maxSeats) {
      toast.warning(`Please select ${maxSeats} seat(s)`);
      return;
    }

    // Store selection in sessionStorage and navigate to passenger details
    sessionStorage.setItem(
      `booking_${flight._id}`,
      JSON.stringify({
        flight,
        seats: selectedSeats,
        from,
        to,
        date,
      })
    );

    navigate(`/passenger-details/${flight._id}`);
  }

  // Group seats by row
  const seatsByRow = useMemo(() => {
    const rows = {};
    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^(\d+)([A-F])$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        if (!rows[rowNum]) rows[rowNum] = {};
        rows[rowNum][match[2]] = seat;
      }
    });
    return rows;
  }, [seats]);

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!pricingConfig) return 0;

    let total = 0;
    selectedSeats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = flight.baseFare * classMultiplier;
      const extraLegroom = seat.isExtraLegroom
        ? pricingConfig.extraLegroom.charge
        : 0;
      const subtotal = classPrice + extraLegroom;

      // Add taxes
      const gst = subtotal * pricingConfig.taxes.gst;
      const fuelSurcharge = subtotal * pricingConfig.taxes.fuelSurcharge;
      const airportFee = pricingConfig.taxes.airportFee;

      total += subtotal + gst + fuelSurcharge + airportFee;
    });

    return Math.round(total * 100) / 100;
  }, [selectedSeats, pricingConfig, flight?.baseFare]);

  if (loading || !flight) {
    return <LoadingFallback />;
  }

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
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Select Seats</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
              Choose
            </h2>
            <h2
              className="text-3xl font-bold leading-9 -mt-1"
              style={{ color: "#541424" }}
            >
              Your Seat
            </h2>
          </div>
          <RoutePill from={from} to={to} />
        </motion.div>

        {/* Selection Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[20px] p-4 border mb-6"
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
              Selected
            </span>
            <span className="font-bold text-lg" style={{ color: "#541424" }}>
              {selectedSeats.length} / {maxSeats}
            </span>
          </div>
        </motion.div>

        {/* Horizontal Seat Map - Matching Mobile Layout Exactly */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 overflow-x-scroll pb-4 seat-map-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(84, 20, 36, 0.3) rgba(227, 215, 203, 0.2)",
          }}
        >
          <div className="inline-flex gap-1.5 px-6">
            {/* Cockpit */}
            <div className="w-20 mr-3 flex flex-col">
              {/* Top spacing to match row labels */}
              <div className="h-11" />
              <div
                className="w-16 h-[340px] rounded-l-[32px] border-2 flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(84, 20, 36, 0.1)",
                  borderColor: "rgba(84, 20, 36, 0.2)",
                }}
              >
                <div className="flex flex-col items-center">
                  <Plane className="h-7 w-7" style={{ color: "#541424" }} />
                  <span
                    className="text-[10px] font-bold mt-2"
                    style={{ color: "#541424" }}
                  >
                    COCKPIT
                  </span>
                </div>
              </div>
              {/* Bottom spacing to match row numbers */}
              <div className="h-6" />
            </div>

            {/* Seat Rows */}
            {rowNumbers.map((rowNum, index) => {
              const row = seatsByRow[rowNum];
              const rowClass = getRowClass(rowNum);
              const isExitRow = rowNum === 10 || rowNum === 11;
              const isFirstOfClass =
                rowNum === 1 || rowNum === 3 || rowNum === 8;

              return (
                <motion.div
                  key={rowNum}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.02 }}
                  className="w-24 mr-1.5"
                >
                  {/* Class Label - Fixed height container */}
                  <div className="items-center mb-1 h-4 flex justify-center">
                    {isFirstOfClass && (
                      <Badge
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            rowClass === "first"
                              ? "rgba(168, 85, 247, 0.2)"
                              : rowClass === "business"
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(107, 114, 128, 0.2)",
                          color:
                            rowClass === "first"
                              ? "#7c3aed"
                              : rowClass === "business"
                              ? "#2563eb"
                              : "#4b5563",
                        }}
                      >
                        {rowClass === "first"
                          ? "FIRST"
                          : rowClass === "business"
                          ? "BUSINESS"
                          : "ECONOMY"}
                      </Badge>
                    )}
                  </div>

                  {/* Row Number Top - Fixed height container */}
                  <div className="flex flex-col items-center justify-start mb-1 h-6">
                    <span
                      className="text-[11px] font-bold leading-none"
                      style={{ color: "rgba(84, 20, 36, 0.5)" }}
                    >
                      {rowNum}
                    </span>
                    {isExitRow && (
                      <Badge
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 leading-none"
                        style={{
                          backgroundColor: "rgba(234, 179, 8, 0.2)",
                          color: "#a16207",
                        }}
                      >
                        EXIT
                      </Badge>
                    )}
                  </div>

                  {/* Seats Column - Vertical arrangement from bottom to top (A to F) */}
                  <div className="h-[300px] flex justify-center items-center">
                    <div className="flex flex-col gap-2">
                      {/* Window Seat F (Right side) - TOP */}
                      {["F"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}

                      {/* Middle Seat E (Right side) */}
                      {["E"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}

                      {/* Aisle Seat D (Right side) */}
                      {["D"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}

                      {/* Aisle Separator */}
                      <div className="h-4 flex items-center justify-center">
                        <div
                          className="w-full h-[2px]"
                          style={{
                            backgroundColor: "rgba(147, 197, 253, 0.4)",
                          }}
                        />
                      </div>

                      {/* Aisle Seat C (Left side) */}
                      {["C"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}

                      {/* Middle Seat B (Left side) */}
                      {["B"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}

                      {/* Window Seat A (Left side) - BOTTOM */}
                      {["A"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={selectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Row Number Bottom - Fixed height container */}
                  <div className="flex items-center justify-center mt-4 h-5">
                    <span
                      className="text-[11px] font-bold leading-none"
                      style={{ color: "rgba(84, 20, 36, 0.5)" }}
                    >
                      {rowNum}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* Tail */}
            <div className="w-20 ml-3 flex flex-col">
              {/* Top spacing to match row labels */}
              <div className="h-11" />
              <div
                className="w-16 h-[340px] rounded-r-[32px] border-2 flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(84, 20, 36, 0.1)",
                  borderColor: "rgba(84, 20, 36, 0.2)",
                }}
              >
                <div className="flex flex-col items-center">
                  <DoorOpen className="h-6 w-6" style={{ color: "#541424" }} />
                  <span
                    className="text-[10px] font-bold mt-2"
                    style={{ color: "#541424" }}
                  >
                    TAIL
                  </span>
                </div>
              </div>
              {/* Bottom spacing to match row numbers */}
              <div className="h-6" />
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center mb-6"
        >
          {[
            { color: "#a855f7", label: "First" },
            { color: "#3b82f6", label: "Business" },
            { color: "#6b7280", label: "Economy" },
            { color: "#eab308", label: "Extra Legroom" },
            { color: "#dc2626", label: "Occupied" },
            { color: "#541424", label: "Selected" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Bottom Section - Total and Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div
            className="rounded-[20px] p-4 mb-4 border"
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
                Total Fare
              </span>
              <span className="font-bold text-xl" style={{ color: "#541424" }}>
                ₹ {totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base rounded-full"
            onClick={handleContinue}
            disabled={selectedSeats.length === 0}
          >
            Continue to Passenger Details
          </Button>
        </motion.div>
      </div>

      {/* Document Required Modal */}
      <AnimatePresence>
        {showDocumentModal && (
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
              className="bg-background rounded-[32px] border-2 max-w-md w-full overflow-hidden"
              style={{ borderColor: "rgba(84, 20, 36, 0.15)" }}
            >
              <div className="p-8 text-center">
                {/* Icon */}
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                >
                  <FileText
                    className="h-12 w-12"
                    style={{ color: "#541424" }}
                  />
                </div>

                {/* Title */}
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "#541424" }}
                >
                  Document Required
                </h2>

                {/* Subtitle */}
                <p
                  className="text-base mb-6"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Please add your identification document (Aadhar or Passport)
                  to continue booking
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base rounded-full"
                    onClick={() => {
                      setShowDocumentModal(false);
                      navigate("/account?tab=profile");
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      navigate(-1);
                    }}
                    className="w-full py-4 rounded-full text-base font-semibold transition-colors"
                    style={{
                      backgroundColor: "rgba(84, 20, 36, 0.1)",
                      color: "#541424",
                    }}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
