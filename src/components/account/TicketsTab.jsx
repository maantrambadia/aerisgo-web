import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getMyBookings, cancelBooking } from "@/lib/bookings";
import { Plane, Ticket, Calendar, MapPin, ChevronRight } from "lucide-react";
import BoardingPassModal from "./BoardingPassModal";
import CancellationDialog from "./CancellationDialog";
import { useNavigate } from "react-router";

export default function TicketsTab() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyBookings({ limit: 100 });
      setBookings(data.items || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't load your bookings.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowDetails(false);
    setTimeout(() => setShowCancellation(true), 300);
  };

  const handleCancellationSuccess = () => {
    loadBookings();
  };

  // Process bookings to group round-trip bookings
  const processedBookings = useMemo(() => {
    const seen = new Set();
    const grouped = [];

    bookings.forEach((booking) => {
      // Skip if already processed as part of a round-trip
      if (seen.has(booking._id)) return;

      // Check if this is part of a round-trip
      if (booking.bookingType === "round-trip" && booking.linkedBookingId) {
        // Find the linked booking
        const linkedBooking = bookings.find(
          (b) => b._id === booking.linkedBookingId,
        );

        if (linkedBooking) {
          // Determine which is outbound and which is return based on departure time
          const isOutbound =
            new Date(booking.flightId.departureTime) <
            new Date(linkedBooking.flightId.departureTime);

          grouped.push({
            ...booking,
            isRoundTrip: true,
            outboundBooking: isOutbound ? booking : linkedBooking,
            returnBooking: isOutbound ? linkedBooking : booking,
          });

          // Mark both as seen
          seen.add(booking._id);
          seen.add(linkedBooking._id);
        } else {
          // Linked booking not found, treat as regular
          grouped.push(booking);
          seen.add(booking._id);
        }
      } else {
        // Regular one-way booking
        grouped.push(booking);
        seen.add(booking._id);
      }
    });

    return grouped;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return processedBookings.filter((booking) => {
      // For round-trip, use outbound flight for filtering
      const flightToCheck = booking.isRoundTrip
        ? booking.outboundBooking.flightId
        : booking.flightId;

      if (filter === "cancelled") return booking.status === "cancelled";
      if (filter === "past") {
        return (
          new Date(flightToCheck.departureTime) < now &&
          booking.status !== "cancelled"
        );
      }
      return (
        new Date(flightToCheck.departureTime) >= now &&
        booking.status === "confirmed"
      );
    });
  }, [processedBookings, filter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {["upcoming", "past", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl">
          <Ticket className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No {filter} bookings</h3>
          <p className="text-muted-foreground">
            {filter === "upcoming"
              ? "Book your next flight to see it here"
              : filter === "past"
                ? "Your completed flights will appear here"
                : "Your cancelled bookings will appear here"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 max-w-2xl mx-auto">
          {filteredBookings.map((booking) => {
            // Use outbound flight for display if round-trip
            const displayFlight = booking.isRoundTrip
              ? booking.outboundBooking.flightId
              : booking.flightId;
            const departureDate = new Date(displayFlight.departureTime);
            const arrivalDate = new Date(displayFlight.arrivalTime);
            const duration = Math.round((arrivalDate - departureDate) / 60000);
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;

            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div
                  className="cursor-pointer bg-primary rounded-[28px] overflow-hidden relative transition-shadow hover:shadow-xl"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowDetails(true);
                  }}
                >
                  {/* Round Trip Badge */}
                  {booking.isRoundTrip && (
                    <div className="absolute top-2 right-2 z-20">
                      <Badge
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(34, 197, 94, 0.2)",
                          color: "#16a34a",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                        }}
                      >
                        ⇄ ROUND TRIP
                      </Badge>
                    </div>
                  )}
                  {/* Notches */}
                  <div className="absolute w-4 h-4 rounded-full bg-background border border-secondary/30 -left-2 top-1/2 -translate-y-1/2 z-10" />
                  <div className="absolute w-4 h-4 rounded-full bg-background border border-secondary/30 -right-2 top-1/2 -translate-y-1/2 z-10" />

                  <div className="p-3 sm:p-4">
                    {/* Top row: Cities and Times with Arc */}
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-secondary/80 text-[10px] font-medium">
                          {displayFlight.source}
                        </p>
                        <p className="text-secondary text-xl sm:text-2xl font-bold mt-0.5">
                          {formatTime(displayFlight.departureTime)}
                        </p>
                      </div>

                      {/* Arc with plane icon */}
                      <div className="flex flex-col items-center mx-2 sm:mx-3">
                        <div className="relative w-16 sm:w-20 h-8 sm:h-10">
                          <svg className="w-full h-full" viewBox="0 0 100 50">
                            <path
                              d="M 10 45 Q 50 -5 90 45"
                              fill="none"
                              stroke="rgba(227, 215, 203, 0.4)"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                          </svg>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary border border-secondary/40 flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5 text-secondary rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-secondary/80 text-[10px] font-medium">
                          {displayFlight.destination}
                        </p>
                        <p className="text-secondary text-xl sm:text-2xl font-bold mt-0.5">
                          {formatTime(displayFlight.arrivalTime)}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <p className="text-secondary/70 text-[10px] text-center mb-3">
                      {hours}h {minutes}m
                    </p>

                    {/* Bottom info */}
                    <div className="flex items-center justify-between pt-2 border-t border-secondary/20">
                      <div>
                        <p className="text-secondary/70 text-[10px]">
                          {displayFlight.flightNumber} •{" "}
                          {booking.passengers && booking.passengers.length > 0
                            ? `${booking.passengers.length} Passenger${
                                booking.passengers.length > 1 ? "s" : ""
                              }`
                            : `Seat ${booking.seatNumber}`}
                          {booking.isRoundTrip && " • Round Trip"}
                        </p>
                        <p className="text-secondary text-sm sm:text-base font-bold mt-0.5 capitalize">
                          {booking.travelClass}
                          {booking.passengers &&
                            booking.passengers.length > 0 && (
                              <span className="text-[10px] ml-1">
                                (
                                {booking.passengers
                                  .map((p) => p.seatNumber)
                                  .join(", ")}
                                )
                              </span>
                            )}
                        </p>
                      </div>
                      <p className="text-secondary text-lg sm:text-xl font-bold">
                        ₹{booking.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Boarding pass indicator */}
                    {(() => {
                      const now = new Date();
                      const hoursUntilDeparture =
                        (departureDate - now) / (1000 * 60 * 60);

                      // Check-in opens 24h before, closes 1h before
                      const checkInOpen =
                        hoursUntilDeparture <= 24 && hoursUntilDeparture > 1;
                      const canShowBoardingPass =
                        booking.isCheckedIn &&
                        booking.status === "confirmed" &&
                        hoursUntilDeparture > 0;

                      return (
                        <>
                          {/* Check-in Status */}
                          {checkInOpen &&
                            !booking.isCheckedIn &&
                            booking.status === "confirmed" && (
                              <div className="mt-3 pt-3 border-t border-secondary/20">
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                  <svg
                                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    Check-in is now open! Complete check-in to
                                    get your boarding pass.
                                  </span>
                                </div>
                              </div>
                            )}

                          {/* Boarding Pass Available */}
                          {canShowBoardingPass && (
                            <div className="mt-3 pt-3 border-t border-secondary/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-green-500 font-semibold text-xs">
                                    Boarding pass ready
                                  </span>
                                </div>
                                {(booking.boardingPass?.gate ||
                                  booking.flightId?.gate) && (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/20">
                                    <span className="text-secondary/70 text-[10px]">
                                      Gate:
                                    </span>
                                    <span className="text-secondary font-bold text-sm">
                                      {booking.boardingPass?.gate ||
                                        booking.flightId?.gate}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Status badge at bottom */}
                    <div className="flex justify-center mt-2 pt-2 border-t border-secondary/20">
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] px-2.5 py-0.5"
                      >
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?._id}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Flight Number
                  </p>
                  <p className="font-semibold">
                    {selectedBooking.flightId.flightNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge>{selectedBooking.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <p className="font-semibold">
                    {selectedBooking.flightId.source}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">To</p>
                  <p className="font-semibold">
                    {selectedBooking.flightId.destination}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Departure
                  </p>
                  <p className="font-semibold">
                    {formatDate(selectedBooking.flightId.departureTime)} at{" "}
                    {formatTime(selectedBooking.flightId.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Arrival</p>
                  <p className="font-semibold">
                    {formatDate(selectedBooking.flightId.arrivalTime)} at{" "}
                    {formatTime(selectedBooking.flightId.arrivalTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Seat Number
                    {selectedBooking.passengers &&
                    selectedBooking.passengers.length > 1
                      ? "s"
                      : ""}
                  </p>
                  <p className="font-semibold">
                    {selectedBooking.passengers &&
                    selectedBooking.passengers.length > 0
                      ? selectedBooking.passengers
                          .map((p) => p.seatNumber)
                          .join(", ")
                      : selectedBooking.seatNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Class</p>
                  <p className="font-semibold capitalize">
                    {selectedBooking.travelClass}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="font-semibold">
                    ₹{selectedBooking.price.toLocaleString()}
                  </p>
                </div>
                {selectedBooking.rewardPointsUsed > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Reward Points Used
                    </p>
                    <p className="font-semibold">
                      {selectedBooking.rewardPointsUsed}
                    </p>
                  </div>
                )}
              </div>

              {/* Passenger Details */}
              {selectedBooking.passengers &&
                selectedBooking.passengers.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">
                      Passenger Details ({selectedBooking.passengers.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedBooking.passengers.map((passenger, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">
                                {passenger.fullName}
                                {passenger.isPrimary && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    You
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Seat {passenger.seatNumber} •{" "}
                                {passenger.gender.charAt(0).toUpperCase() +
                                  passenger.gender.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Document</p>
                              <p className="font-medium">
                                {passenger.documentType.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Document No.
                              </p>
                              <p className="font-medium">
                                {passenger.documentNumber}
                              </p>
                            </div>
                            {passenger.email && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-medium">{passenger.email}</p>
                              </div>
                            )}
                            {passenger.phone && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{passenger.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {selectedBooking.status === "confirmed" &&
                (() => {
                  const departureDate = new Date(
                    selectedBooking.flightId.departureTime,
                  );
                  const now = new Date();
                  const hoursUntilDeparture =
                    (departureDate - now) / (1000 * 60 * 60);

                  const checkInOpen =
                    hoursUntilDeparture <= 24 && hoursUntilDeparture > 1;
                  const canShowBoardingPass =
                    selectedBooking.isCheckedIn && hoursUntilDeparture > 0;
                  const canCancel =
                    hoursUntilDeparture > 24 && !selectedBooking.isCheckedIn;
                  const isPast = departureDate < now;

                  return (
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      {/* Check-in Button */}
                      {checkInOpen && !selectedBooking.isCheckedIn && (
                        <Button
                          variant="default"
                          onClick={() => {
                            navigate(`/check-in/${selectedBooking._id}`);
                          }}
                        >
                          <Plane className="h-4 w-4 mr-2" />
                          Check-in Now
                        </Button>
                      )}

                      {/* Boarding Pass Button */}
                      {canShowBoardingPass && (
                        <Button
                          variant="default"
                          onClick={() => {
                            setShowDetails(false);
                            setTimeout(() => setShowBoardingPass(true), 300);
                          }}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          View Boarding Pass
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="destructive"
                          onClick={handleCancelClick}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </DialogFooter>
                  );
                })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Boarding Pass Modal */}
      <BoardingPassModal
        isOpen={showBoardingPass}
        onClose={() => setShowBoardingPass(false)}
        booking={selectedBooking}
      />

      {/* Cancellation Dialog */}
      <CancellationDialog
        open={showCancellation}
        onClose={() => setShowCancellation(false)}
        booking={selectedBooking}
        onSuccess={handleCancellationSuccess}
      />
    </div>
  );
}
