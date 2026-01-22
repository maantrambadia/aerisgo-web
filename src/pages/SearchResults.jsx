import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Plane, ArrowUpDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  const [returnFlights, setReturnFlights] = useState([]);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("price-low");
  const [selectedOutbound, setSelectedOutbound] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const tripType = searchParams.get("tripType") || "one-way";
  const passengers = searchParams.get("passengers") || "1";
  const isRoundTrip = tripType === "round-trip";

  useDocumentTitle(
    isRoundTrip ? `${from} ⇄ ${to} Flights` : `${from} → ${to} Flights`,
  );

  useEffect(() => {
    if (!from || !to || !date) {
      toast.error("Missing search details. Please try again.");
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
        returnDate: isRoundTrip ? returnDate : undefined,
        passengers: Number(passengers),
      });
      setFlights(data.flights || []);
      setReturnFlights(data.returnFlights || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch flights");
      toast.error(err?.response?.data?.message || "We couldn't load flights.");
    } finally {
      setLoading(false);
    }
  };

  // Sort flights based on selected option
  const sortedFlights = useMemo(() => {
    const flightsCopy = [...flights];

    switch (sortBy) {
      case "price-low":
        return flightsCopy.sort(
          (a, b) => (a.baseFare || 0) - (b.baseFare || 0),
        );
      case "price-high":
        return flightsCopy.sort(
          (a, b) => (b.baseFare || 0) - (a.baseFare || 0),
        );
      case "duration-short":
        return flightsCopy.sort((a, b) => {
          const durationA = new Date(a.arrivalTime) - new Date(a.departureTime);
          const durationB = new Date(b.arrivalTime) - new Date(b.departureTime);
          return durationA - durationB;
        });
      case "duration-long":
        return flightsCopy.sort((a, b) => {
          const durationA = new Date(a.arrivalTime) - new Date(a.departureTime);
          const durationB = new Date(b.arrivalTime) - new Date(b.departureTime);
          return durationB - durationA;
        });
      case "departure-early":
        return flightsCopy.sort(
          (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
        );
      case "departure-late":
        return flightsCopy.sort(
          (a, b) => new Date(b.departureTime) - new Date(a.departureTime),
        );
      default:
        return flightsCopy;
    }
  }, [flights, sortBy]);

  const sortOptions = [
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "duration-short", label: "Duration: Shortest" },
    { id: "duration-long", label: "Duration: Longest" },
    { id: "departure-early", label: "Departure: Earliest" },
    { id: "departure-late", label: "Departure: Latest" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.id === sortBy)?.label || "Sort";

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
                {from} {isRoundTrip ? "⇄" : "→"} {to}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formattedDate}
                {isRoundTrip && returnDate && (
                  <>
                    {" • "}
                    {new Date(returnDate).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </>
                )}
                {" • "}
                {passengers} Passenger{passengers !== "1" ? "s" : ""}
                {isRoundTrip && " • Round Trip"}
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
        ) : flights.length === 0 &&
          (!isRoundTrip || returnFlights.length === 0) ? (
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
            {/* Outbound Flights Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {isRoundTrip
                      ? "Select Outbound Flight"
                      : "Available Flights"}
                  </h2>
                  <p className="text-muted-foreground">
                    {from} → {to} • {sortedFlights.length} flight
                    {sortedFlights.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {currentSortLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                      Price: High to Low
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSortBy("duration-short")}
                    >
                      Duration: Shortest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("duration-long")}
                    >
                      Duration: Longest
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSortBy("departure-early")}
                    >
                      Departure: Earliest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("departure-late")}
                    >
                      Departure: Latest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              {sortedFlights.map((flight, index) => (
                <div key={flight._id || index} className="relative">
                  <FlightCard
                    flight={flight}
                    onClick={() => {
                      if (isRoundTrip) {
                        setSelectedOutbound(flight);
                        toast.success(
                          "Outbound flight selected. Now choose your return flight.",
                        );
                        // Scroll to return flights section
                        setTimeout(() => {
                          document
                            .getElementById("return-flights")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 300);
                      } else {
                        // Store flight data in sessionStorage
                        sessionStorage.setItem(
                          `flight_${flight._id}`,
                          JSON.stringify({
                            flight,
                            from,
                            to,
                            date,
                            passengers,
                            tripType: "one-way",
                          }),
                        );
                        navigate(`/flight/${flight._id}`);
                      }
                    }}
                  />
                  {isRoundTrip && selectedOutbound?._id === flight._id && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <ArrowLeftRight className="h-3 w-3" />
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Return Flights Section */}
            {isRoundTrip && (
              <>
                {returnFlights.length > 0 ? (
                  <motion.div
                    id="return-flights"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          Select Return Flight
                        </h2>
                        <p className="text-muted-foreground">
                          {to} → {from} • {returnFlights.length} flight
                          {returnFlights.length !== 1 ? "s" : ""} found
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 max-w-2xl mx-auto">
                      {returnFlights.map((flight, index) => (
                        <div key={flight._id || index} className="relative">
                          <FlightCard
                            flight={flight}
                            onClick={() => {
                              if (!selectedOutbound) {
                                toast.error(
                                  "Please select an outbound flight first.",
                                );
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                return;
                              }
                              setSelectedReturn(flight);

                              // Store both flights in sessionStorage
                              sessionStorage.setItem(
                                `flight_${selectedOutbound._id}`,
                                JSON.stringify({
                                  outboundFlight: selectedOutbound,
                                  returnFlight: flight,
                                  from,
                                  to,
                                  date,
                                  returnDate,
                                  passengers,
                                  tripType: "round-trip",
                                }),
                              );

                              toast.success("Both flights selected.");
                              navigate(`/flight/${selectedOutbound._id}`);
                            }}
                          />
                          {selectedReturn?._id === flight._id && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                              <ArrowLeftRight className="h-3 w-3" />
                              Selected
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12 text-center py-12 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-4">
                      <Plane className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      No Return Flights Available
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Unfortunately, there are no return flights available from{" "}
                      <span className="font-semibold">{to}</span> to{" "}
                      <span className="font-semibold">{from}</span> on{" "}
                      {returnDate && (
                        <span className="font-semibold">
                          {new Date(returnDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      .
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Try selecting a different return date or search for
                      one-way flights instead.
                    </p>
                    <Button
                      onClick={() => navigate("/")}
                      className="rounded-full"
                    >
                      Modify Search
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
