import { motion, AnimatePresence } from "motion/react";
import { X, Plane } from "lucide-react";

export default function BoardingPassModal({ isOpen, onClose, booking }) {
  if (!booking || !booking.flightId) return null;

  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getCityCode = (city) => {
    const codes = {
      Rajkot: "RAJ",
      Mumbai: "BOM",
      Delhi: "DEL",
      Bangalore: "BLR",
      Hyderabad: "HYD",
      Chennai: "MAA",
      Kolkata: "CCU",
      Ahmedabad: "AMD",
      Pune: "PNQ",
      Jaipur: "JAI",
    };
    return codes[city] || city.substring(0, 3).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-background rounded-[32px] overflow-hidden max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5" style={{ backgroundColor: "#541424" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: "#e3d7cb" }}>
                  Boarding Pass
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(227, 215, 203, 0.2)" }}
                >
                  <X className="h-5 w-5" style={{ color: "#e3d7cb" }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Airline */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: "#541424" }}>
                  AerisGo Airlines
                </h3>
                <p
                  className="text-sm font-medium"
                  style={{ color: "rgba(84, 20, 36, 0.6)" }}
                >
                  {flight.flightNumber}
                </p>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "rgba(84, 20, 36, 0.7)" }}
                  >
                    {formatTime(departureDate)}
                  </p>
                  <p
                    className="text-4xl font-bold mt-1"
                    style={{ color: "#541424" }}
                  >
                    {getCityCode(flight.source)}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                    style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                  >
                    <Plane
                      className="h-5 w-5 rotate-90"
                      style={{ color: "#541424" }}
                    />
                  </div>
                  <p
                    className="text-xs font-medium mt-1"
                    style={{ color: "#541424" }}
                  >
                    {formatDate(departureDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "rgba(84, 20, 36, 0.7)" }}
                  >
                    {formatTime(arrivalDate)}
                  </p>
                  <p
                    className="text-4xl font-bold mt-1"
                    style={{ color: "#541424" }}
                  >
                    {getCityCode(flight.destination)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(84, 20, 36, 0.6)" }}
                    >
                      Passenger
                    </p>
                    <p
                      className="text-base font-semibold mt-1"
                      style={{ color: "#541424" }}
                    >
                      {booking.userId?.name || "Passenger"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(84, 20, 36, 0.6)" }}
                    >
                      Seat
                    </p>
                    <p
                      className="text-base font-semibold mt-1"
                      style={{ color: "#541424" }}
                    >
                      {booking.seatNumber}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(84, 20, 36, 0.6)" }}
                    >
                      Class
                    </p>
                    <p
                      className="text-base font-semibold mt-1 capitalize"
                      style={{ color: "#541424" }}
                    >
                      {booking.travelClass}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(84, 20, 36, 0.6)" }}
                    >
                      Gate
                    </p>
                    <p
                      className="text-base font-semibold mt-1"
                      style={{ color: "#541424" }}
                    >
                      A{Math.floor(Math.random() * 20) + 1}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 h-16 rounded-2xl overflow-x-auto overflow-y-hidden"
                style={{ backgroundColor: "rgba(84, 20, 36, 0.1)" }}
              >
                <div className="flex h-full items-end px-2 w-max">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="mr-1"
                      style={{
                        width: Math.random() > 0.5 ? "2px" : "3px",
                        height: "100%",
                        backgroundColor: "#541424",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Booking ID */}
              <p
                className="text-center text-xs font-medium mt-3"
                style={{ color: "rgba(84, 20, 36, 0.6)" }}
              >
                Booking ID: {booking._id?.substring(0, 12).toUpperCase()}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
