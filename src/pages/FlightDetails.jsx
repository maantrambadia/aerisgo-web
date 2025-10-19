import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Plane, Wifi, Utensils, Tv, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";

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

export default function FlightDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Get flight data from location state or sessionStorage
  const getFlightData = () => {
    // First try location state
    if (location.state?.flight) {
      return location.state;
    }
    // Then try sessionStorage (persists through auth redirect)
    const stored = sessionStorage.getItem(`flight_${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  };

  const flightData = getFlightData();
  const { flight, from, to, date, passengers } = flightData || {};

  useDocumentTitle("Flight Details");

  useEffect(() => {
    if (!flight) {
      navigate("/");
      return;
    }
    setTimeout(() => setLoading(false), 300);
  }, [flight, navigate]);

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

  if (loading || !flight) {
    return <LoadingFallback />;
  }

  const departTime = formatTime(flight.departureTime);
  const arriveTime = formatTime(flight.arrivalTime);
  const duration = calculateDuration(flight.departureTime, flight.arrivalTime);
  const price = flight.baseFare?.toLocaleString("en-IN") || "0";

  const amenities = [
    { icon: Wifi, label: "Wi-Fi" },
    { icon: Utensils, label: "Meals" },
    { icon: Tv, label: "Entertainment" },
    { icon: Briefcase, label: "Baggage" },
  ];

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
            <h1 className="text-lg font-semibold">Flight Details</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
              Selected
            </h2>
            <h2
              className="text-3xl font-bold leading-9 -mt-1"
              style={{ color: "#541424" }}
            >
              Flight
            </h2>
          </div>
          <RoutePill from={from} to={to} />
        </motion.div>

        {/* Flight Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-4"
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
                  {departTime}
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
                  {arriveTime}
                </p>
              </div>
            </div>

            {/* Duration */}
            <p
              className="font-medium text-[11px] text-center mt-2"
              style={{ color: "rgba(227, 215, 203, 0.7)" }}
            >
              {duration}
            </p>

            {/* Bottom brand/price bar */}
            <div className="flex items-center justify-between mt-4">
              <p className="font-bold text-2xl" style={{ color: "#e3d7cb" }}>
                AerisGo
              </p>
              <p className="font-bold text-xl" style={{ color: "#e3d7cb" }}>
                ₹ {price}
              </p>
            </div>
          </div>

          {/* Ticket notches */}
          <Notch side="left" />
          <Notch side="right" />
        </motion.div>

        {/* Flight Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-[24px] p-5 border"
          style={{
            backgroundColor: "rgba(227, 215, 203, 0.4)",
            borderColor: "rgba(84, 20, 36, 0.1)",
          }}
        >
          <h3 className="font-bold text-base mb-4" style={{ color: "#541424" }}>
            Flight Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Flight Number
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                {flight.flightNumber || "AG-101"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Aircraft
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                {flight.aircraftType || "A320 Neo"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Date
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="font-medium text-sm"
                style={{ color: "rgba(84, 20, 36, 0.7)" }}
              >
                Passengers
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#541424" }}
              >
                {passengers || 1}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Amenities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 mb-4"
        >
          <h3 className="font-bold text-base mb-4" style={{ color: "#541424" }}>
            Amenities
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {amenities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="rounded-[20px] px-3 py-4 flex flex-col items-center border"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.4)",
                  borderColor: "rgba(84, 20, 36, 0.1)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: "#541424" }} />
                </div>
                <span
                  className="font-medium text-xs text-center"
                  style={{ color: "#541424" }}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 mb-8"
        >
          <Button
            size="lg"
            className="w-full h-12 text-base rounded-full"
            onClick={() => {
              // Store flight data and navigate to seat selection
              sessionStorage.setItem(
                `flight_${flight._id}`,
                JSON.stringify({ flight, from, to, date, passengers })
              );
              navigate(`/seat-selection/${flight._id}`);
            }}
          >
            Select Seat
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
