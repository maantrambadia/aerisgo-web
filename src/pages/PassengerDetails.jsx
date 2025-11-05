import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plane,
  User,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      className="rounded-full px-2 py-1 flex items-center gap-2 border"
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

// Ticket notch decoration
const Notch = ({ side = "left" }) => (
  <div
    className="absolute w-4 h-4 rounded-full"
    style={{
      [side]: "-8px",
      top: "50%",
      marginTop: "-8px",
      backgroundColor: "#e3d7cb",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "rgba(84, 20, 36, 0.1)",
    }}
  />
);

export default function PassengerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [passengers, setPassengers] = useState([]);

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
    passengers: passengersCount,
    tripType,
  } = bookingData || {};

  const isRoundTrip = tripType === "round-trip";
  const displayFlight = outboundFlight || flight;
  const displaySeats = outboundSeats || seats;

  useDocumentTitle("Passenger Details");

  useEffect(() => {
    if (!displayFlight || !displaySeats) {
      navigate("/");
      return;
    }
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUserProfile() {
    try {
      const res = await api.get("/profile");
      setUserProfile(res.data);

      // Initialize passengers array with empty forms
      const initialPassengers = displaySeats.map((seat, index) => ({
        seatNumber: seat.seatNumber,
        isPrimary: index === 0, // First passenger is primary
        fullName: index === 0 ? res.data.user.name : "",
        dateOfBirth: "",
        gender: index === 0 ? res.data.user.gender : "",
        email: index === 0 ? res.data.user.email : "",
        phone: index === 0 ? res.data.user.phone : "",
        documentType: "",
        documentNumber: "",
      }));

      // Pre-fill primary passenger document if available
      if (res.data.documents && res.data.documents.length > 0) {
        const primaryDoc = res.data.documents[0];
        initialPassengers[0].documentType = primaryDoc.documentType;
        initialPassengers[0].documentNumber = primaryDoc.documentNumber;
      }

      setPassengers(initialPassengers);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }

  // Name formatting helper (only letters and spaces, capitalize first letter of each word)
  const formatNameLive = (raw) => {
    const src = String(raw || "");
    const onlyLetters = src.replace(/[^a-zA-Z\s]/g, "");
    const hadTrailing = /\s$/.test(onlyLetters);
    const collapsed = onlyLetters.replace(/\s{2,}/g, " ");
    const parts = collapsed.split(" ");
    const titleCased = parts
      .map((w) =>
        w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");
    // Avoid double trailing spaces
    return hadTrailing && !titleCased.endsWith(" ")
      ? `${titleCased} `
      : titleCased;
  };

  // Document validation functions
  const isValidAadhar = (v) => /^\d{12}$/.test(v);
  const isValidPassport = (v) => /^[A-Z][0-9]{7}$/.test(v);

  function handlePassengerChange(index, field, value) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function validatePassengers() {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName || !p.fullName.trim()) {
        toast.error(`Please enter name for passenger ${i + 1}`);
        return false;
      }
      if (!p.dateOfBirth) {
        toast.error(`Please enter date of birth for passenger ${i + 1}`);
        return false;
      }
      if (!p.gender) {
        toast.error(`Please select gender for passenger ${i + 1}`);
        return false;
      }
      if (!p.documentType) {
        toast.error(`Please select document type for passenger ${i + 1}`);
        return false;
      }
      if (!p.documentNumber || !p.documentNumber.trim()) {
        toast.error(`Please enter document number for passenger ${i + 1}`);
        return false;
      }
      // Validate document number format
      if (p.documentType === "aadhar" && !isValidAadhar(p.documentNumber)) {
        toast.error(`Aadhar must be 12 digits for passenger ${i + 1}`);
        return false;
      }
      if (p.documentType === "passport" && !isValidPassport(p.documentNumber)) {
        toast.error(
          `Passport format: 1 letter + 7 digits (e.g., A1234567) for passenger ${
            i + 1
          }`
        );
        return false;
      }
    }
    return true;
  }

  function handleContinue() {
    if (!validatePassengers()) {
      return;
    }

    // Update booking data with passenger details
    const updatedBookingData = {
      ...bookingData,
      passengers,
    };

    sessionStorage.setItem(
      `booking_${displayFlight._id}`,
      JSON.stringify(updatedBookingData)
    );

    navigate(`/booking-confirmation/${displayFlight._id}`);
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

  if (loading || !displayFlight || !displaySeats) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "#541424" }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-bold" style={{ color: "#541424" }}>
              Passenger Details
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Flight Info Card - Outbound */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[28px] p-6 mb-6 overflow-hidden"
          style={{
            backgroundColor: "#541424",
          }}
        >
          {isRoundTrip && (
            <div className="mb-3">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.3)",
                  color: "#e3d7cb",
                }}
              >
                Outbound Flight
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <RoutePill from={from} to={to} />
            <span
              className="text-sm font-medium"
              style={{ color: "rgba(227, 215, 203, 0.7)" }}
            >
              {new Date(date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold" style={{ color: "#e3d7cb" }}>
                {displayFlight.flightNumber}
              </div>
              <div
                className="text-sm mt-1"
                style={{ color: "rgba(227, 215, 203, 0.7)" }}
              >
                {formatTime(displayFlight.departureTime)} -{" "}
                {formatTime(displayFlight.arrivalTime)}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-sm font-medium"
                style={{ color: "rgba(227, 215, 203, 0.7)" }}
              >
                {displaySeats.length} Seat{displaySeats.length > 1 ? "s" : ""}
              </div>
              <div className="text-lg font-bold" style={{ color: "#e3d7cb" }}>
                {displaySeats.map((s) => s.seatNumber).join(", ")}
              </div>
            </div>
          </div>
          {/* Ticket notches */}
          <Notch side="left" />
          <Notch side="right" />
        </motion.div>

        {/* Return Flight Info Card */}
        {isRoundTrip && returnFlight && returnSeats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-[28px] p-6 mb-6 overflow-hidden"
            style={{
              backgroundColor: "#541424",
            }}
          >
            <div className="mb-3">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(227, 215, 203, 0.3)",
                  color: "#e3d7cb",
                }}
              >
                Return Flight
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <RoutePill from={to} to={from} />
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(227, 215, 203, 0.7)" }}
              >
                {new Date(returnDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#e3d7cb" }}
                >
                  {returnFlight.flightNumber}
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: "rgba(227, 215, 203, 0.7)" }}
                >
                  {formatTime(returnFlight.departureTime)} -{" "}
                  {formatTime(returnFlight.arrivalTime)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm font-medium"
                  style={{ color: "rgba(227, 215, 203, 0.7)" }}
                >
                  {returnSeats.length} Seat{returnSeats.length > 1 ? "s" : ""}
                </div>
                <div className="text-lg font-bold" style={{ color: "#e3d7cb" }}>
                  {returnSeats.map((s) => s.seatNumber).join(", ")}
                </div>
              </div>
            </div>
            {/* Ticket notches */}
            <Notch side="left" />
            <Notch side="right" />
          </motion.div>
        )}

        {/* Passenger Forms */}
        {passengers.map((passenger, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-[24px] p-6 mb-6 border"
            style={{
              backgroundColor: "rgba(227, 215, 203, 0.4)",
              borderColor: "rgba(84, 20, 36, 0.1)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
              >
                <User className="h-5 w-5" style={{ color: "#541424" }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "#541424" }}>
                  Passenger {index + 1}
                  {passenger.isPrimary && (
                    <span
                      className="ml-2 text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(84, 20, 36, 0.1)",
                        color: "#541424",
                      }}
                    >
                      You
                    </span>
                  )}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "rgba(84, 20, 36, 0.6)" }}
                >
                  Seat {passenger.seatNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor={`name-${index}`}>
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`name-${index}`}
                  placeholder="As per ID proof"
                  value={passenger.fullName}
                  onChange={(e) => {
                    const formatted = formatNameLive(e.target.value);
                    handlePassengerChange(index, "fullName", formatted);
                  }}
                  disabled={passenger.isPrimary}
                />
                {passenger.isPrimary && passenger.fullName && (
                  <p
                    className="text-xs"
                    style={{ color: "rgba(84, 20, 36, 0.5)" }}
                  >
                    Pre-filled from profile
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor={`dob-${index}`}>
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`dob-${index}`}
                  type="date"
                  value={passenger.dateOfBirth}
                  onChange={(e) =>
                    handlePassengerChange(index, "dateOfBirth", e.target.value)
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor={`gender-${index}`}>
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) =>
                    handlePassengerChange(index, "gender", value)
                  }
                  disabled={passenger.isPrimary}
                >
                  <SelectTrigger id={`gender-${index}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor={`docType-${index}`}>
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={passenger.documentType}
                  onValueChange={(value) =>
                    handlePassengerChange(index, "documentType", value)
                  }
                  disabled={passenger.isPrimary && passenger.documentType}
                >
                  <SelectTrigger id={`docType-${index}`}>
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document Number */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`docNumber-${index}`}>
                  Document Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`docNumber-${index}`}
                  placeholder={
                    passenger.documentType === "aadhar"
                      ? "123456789012"
                      : passenger.documentType === "passport"
                      ? "A1234567"
                      : "Enter document number"
                  }
                  value={passenger.documentNumber}
                  onChange={(e) => {
                    let formatted = "";
                    const value = e.target.value;
                    if (passenger.documentType === "aadhar") {
                      // Aadhar: Only digits, max 12
                      formatted = value.replace(/\D/g, "").slice(0, 12);
                    } else if (passenger.documentType === "passport") {
                      // Passport: 1 uppercase letter + 7 digits (e.g., A1234567)
                      const upper = value.toUpperCase();
                      if (upper.length === 0) {
                        formatted = "";
                      } else if (upper.length === 1) {
                        // First character must be a letter
                        formatted = upper.replace(/[^A-Z]/g, "");
                      } else {
                        // First char is letter, rest are digits
                        const firstChar = upper
                          .charAt(0)
                          .replace(/[^A-Z]/g, "");
                        const restDigits = upper
                          .slice(1)
                          .replace(/\D/g, "")
                          .slice(0, 7);
                        formatted = firstChar + restDigits;
                      }
                    } else {
                      // No document type selected yet
                      formatted = value.toUpperCase().slice(0, 20);
                    }
                    handlePassengerChange(index, "documentNumber", formatted);
                  }}
                  disabled={passenger.isPrimary && passenger.documentNumber}
                  type={passenger.documentType === "aadhar" ? "tel" : "text"}
                  maxLength={
                    passenger.documentType === "aadhar"
                      ? 12
                      : passenger.documentType === "passport"
                      ? 8
                      : 20
                  }
                  className="uppercase"
                />
                {passenger.isPrimary && passenger.documentNumber && (
                  <p
                    className="text-xs"
                    style={{ color: "rgba(84, 20, 36, 0.5)" }}
                  >
                    Pre-filled from profile
                  </p>
                )}
              </div>

              {/* Email (Optional for non-primary) */}
              {!passenger.isPrimary && (
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="email@example.com"
                    value={passenger.email}
                    onChange={(e) =>
                      handlePassengerChange(index, "email", e.target.value)
                    }
                  />
                </div>
              )}

              {/* Phone (Optional for non-primary) */}
              {!passenger.isPrimary && (
                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Phone (Optional)</Label>
                  <div className="flex">
                    <div
                      className="flex items-center px-3 border border-r-0 rounded-l-md"
                      style={{
                        backgroundColor: "rgba(227, 215, 203, 0.3)",
                        borderColor: "rgba(84, 20, 36, 0.2)",
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: "rgba(84, 20, 36, 0.7)" }}
                      >
                        +91
                      </span>
                    </div>
                    <Input
                      id={`phone-${index}`}
                      type="tel"
                      placeholder="9000000000"
                      value={passenger.phone}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handlePassengerChange(index, "phone", digits);
                      }}
                      maxLength={10}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {passenger.isPrimary && (
              <div
                className="mt-4 p-3 rounded-2xl flex items-start gap-2"
                style={{ backgroundColor: "rgba(84, 20, 36, 0.05)" }}
              >
                <Info
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#541424" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  Your details have been pre-filled from your profile.
                </p>
              </div>
            )}
          </motion.div>
        ))}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: passengers.length * 0.1 }}
        >
          <Button
            size="lg"
            className="w-full h-12 text-base rounded-full"
            onClick={handleContinue}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Continue to Payment
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
