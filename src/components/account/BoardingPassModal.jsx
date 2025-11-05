import { motion, AnimatePresence } from "motion/react";
import { X, Plane } from "lucide-react";

export default function BoardingPassModal({ isOpen, onClose, booking }) {
  if (!booking || !booking.flightId) return null;

  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);

  // Get all passengers or fallback to single booking
  const passengers =
    booking.passengers && booking.passengers.length > 0
      ? booking.passengers
      : [
          {
            fullName: booking.userId?.name || "Passenger",
            seatNumber: booking.seatNumber,
          },
        ];

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
      // Popular airports
      Mumbai: "BOM",
      Delhi: "DEL",
      Bangalore: "BLR",
      Hyderabad: "HYD",
      Chennai: "MAA",
      Kolkata: "CCU",
      Pune: "PNQ",
      Ahmedabad: "AMD",
      // Other major cities
      Jaipur: "JAI",
      Lucknow: "LKO",
      Chandigarh: "IXC",
      Bhopal: "BHO",
      Patna: "PAT",
      Thiruvananthapuram: "TRV",
      Kochi: "COK",
      Guwahati: "GAU",
      Bhubaneswar: "BBI",
      Ranchi: "IXR",
      Raipur: "RPR",
      Indore: "IDR",
      Nagpur: "NAG",
      Surat: "STV",
      Vadodara: "BDQ",
      Coimbatore: "CJB",
      Visakhapatnam: "VTZ",
      Vijayawada: "VGA",
      Amritsar: "ATQ",
      Varanasi: "VNS",
      Agra: "AGR",
      Goa: "GOI",
      Srinagar: "SXR",
      Jammu: "IXJ",
      Dehradun: "DED",
      Shimla: "SLV",
      Imphal: "IMF",
      Shillong: "SHL",
      Aizawl: "AJL",
      Dimapur: "DMU",
      Agartala: "IXA",
      Bagdogra: "IXB",
      "Port Blair": "IXZ",
      Rajkot: "RAJ",
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
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
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

              {/* Passengers - Show all boarding passes */}
              {passengers.map((passenger, index) => (
                <div key={index}>
                  {index > 0 && (
                    <div
                      className="my-6 border-t-2 border-dashed"
                      style={{ borderColor: "rgba(84, 20, 36, 0.2)" }}
                    />
                  )}

                  {/* Passenger Header */}
                  {passengers.length > 1 && (
                    <p
                      className="text-sm font-bold mb-4"
                      style={{ color: "#541424" }}
                    >
                      Passenger {index + 1} of {passengers.length}
                    </p>
                  )}

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
                          {passenger.fullName}
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
                          {passenger.seatNumber}
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
                          {booking.boardingPass?.gate || flight.gate || "TBA"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barcode for each passenger */}
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
                </div>
              ))}

              {/* PNR */}
              <p
                className="text-center text-xs font-medium mt-3"
                style={{ color: "rgba(84, 20, 36, 0.6)" }}
              >
                PNR: {booking.pnr}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
