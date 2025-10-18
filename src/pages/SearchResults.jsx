import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchFlights } from "@/lib/flights";
import { toast } from "sonner";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";

// Ticket notch component - matches mobile design exactly
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

// Flight Card Component - Matches mobile ticket design exactly
const FlightCard = ({ flight, onClick }) => {
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
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
      const diff = Math.max(0, end - start) / 60000; // minutes
      const hours = Math.floor(diff / 60);
      const minutes = Math.round(diff % 60);
      return `${hours}h ${minutes}m`;
    } catch {
      return "--";
    }
  };

  const departTime = formatTime(flight.departureTime);
  const arriveTime = formatTime(flight.arrivalTime);
  const duration = calculateDuration(flight.departureTime, flight.arrivalTime);
  const price = flight.baseFare?.toLocaleString("en-IN") || "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="relative cursor-pointer mt-4"
      onClick={onClick}
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
              {flight.source}
            </p>
            <p className="font-bold text-2xl mt-1" style={{ color: "#e3d7cb" }}>
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
              {flight.destination}
            </p>
            <p className="font-bold text-2xl mt-1" style={{ color: "#e3d7cb" }}>
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
  );
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState("");

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengers = searchParams.get("passengers") || "1";

  useDocumentTitle(`${from} → ${to} Flights`);

  useEffect(() => {
    if (!from || !to || !date) {
      toast.error("Missing search parameters");
      navigate("/");
      return;
    }

    loadFlights();
  }, [from, to, date, passengers]);

  const loadFlights = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await searchFlights({
        source: from,
        destination: to,
        date,
        passengers: Number(passengers),
      });
      setFlights(data.flights || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch flights");
      toast.error(err?.response?.data?.message || "Failed to fetch flights");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {from} → {to}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formattedDate} • {passengers} Passenger
                {passengers !== "1" ? "s" : ""}
              </p>
            </div>
            <Link to="/">
              <img
                src="/images/welcome-logo-2.png"
                alt="AerisGo"
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <LoadingFallback />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <Plane className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Flights Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} className="rounded-full">
              Search Again
            </Button>
          </motion.div>
        ) : flights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Flights Available</h2>
            <p className="text-muted-foreground mb-6">
              No flights found for this route on the selected date.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-full">
              Search Again
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-2">Available Flights</h2>
              <p className="text-muted-foreground">
                {flights.length} flight{flights.length !== 1 ? "s" : ""} found
              </p>
            </motion.div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              {flights.map((flight, index) => (
                <FlightCard
                  key={flight._id || index}
                  flight={flight}
                  onClick={() => {
                    // Store flight data in sessionStorage to persist through auth redirect
                    sessionStorage.setItem(
                      `flight_${flight._id}`,
                      JSON.stringify({ flight, from, to, date, passengers })
                    );
                    // Navigate to flight details
                    navigate(`/flight/${flight._id}`);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
