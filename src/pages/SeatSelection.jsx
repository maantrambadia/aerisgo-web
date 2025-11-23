import { useState, useEffect, useMemo, useRef } from "react";
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
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";
import api from "@/lib/api";
import { toast } from "sonner";
import { getFlightSeats, lockSeat, unlockSeat } from "@/lib/seats";
import { getDynamicPrice } from "@/lib/pricing";
import { useSeatSocket } from "@/hooks/useSeatSocket";

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
const SeatButton = ({
  seat,
  selected,
  onPress,
  rowClass,
  isLocked,
  isLockedByMe,
  isLoading,
}) => {
  const getSeatColor = () => {
    if (isLoading) return "#f59e0b"; // Amber - Loading state
    if (selected || isLockedByMe) return "#541424"; // Primary - Selected by me
    if (isLocked) return "#f97316"; // Orange - Locked by someone else
    if (!seat.isAvailable) return "#dc2626"; // Red - Occupied
    if (seat.isExtraLegroom) return "#eab308"; // Yellow - Extra Legroom
    if (rowClass === "first") return "#a855f7"; // Purple - First Class
    if (rowClass === "business") return "#3b82f6"; // Blue - Business
    return "#6b7280"; // Grey - Economy
  };

  const getBorderColor = () => {
    if (isLoading) return "#d97706"; // Darker amber for loading
    if (selected || isLockedByMe) return "#6b1a2f";
    if (isLocked) return "#ea580c";
    if (!seat.isAvailable) return "#991b1b";
    if (seat.isExtraLegroom) return "#ca8a04";
    if (rowClass === "first") return "#7c3aed";
    if (rowClass === "business") return "#2563eb";
    return "#4b5563";
  };

  const handleClick = () => {
    if (isLoading) return; // Prevent double-click while loading
    if (!seat.isAvailable) {
      toast.error("This seat is already booked");
      return;
    }
    if (isLocked && !isLockedByMe) {
      toast.error("This seat is being selected by another user");
      return;
    }
    onPress(seat);
  };

  return (
    <motion.button
      whileHover={{ scale: seat.isAvailable && !isLoading ? 1.1 : 1 }}
      whileTap={{ scale: seat.isAvailable && !isLoading ? 0.95 : 1 }}
      onClick={handleClick}
      disabled={!seat.isAvailable || isLoading}
      className="w-11 h-11 rounded-xl flex flex-col items-center justify-center border-2 transition-all"
      style={{
        backgroundColor: getSeatColor(),
        borderColor: getBorderColor(),
        cursor: seat.isAvailable && !isLoading ? "pointer" : "not-allowed",
        opacity: isLoading ? 0.8 : 1,
      }}
      title={
        isLoading
          ? `${seat.seatNumber} - Processing...`
          : !seat.isAvailable
          ? `${seat.seatNumber} - Booked`
          : isLocked && !isLockedByMe
          ? `${seat.seatNumber} - Locked by another user`
          : isLockedByMe
          ? `${seat.seatNumber} - Your selection`
          : `${seat.seatNumber} - Available`
      }
    >
      {isLoading ? (
        <div className="animate-spin">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              style={{ color: "#e3d7cb" }}
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              style={{ color: "#e3d7cb" }}
            ></path>
          </svg>
        </div>
      ) : (
        <>
          <Armchair className="h-4 w-4" style={{ color: "#e3d7cb" }} />
          <span
            className="text-[9px] font-bold mt-0.5"
            style={{ color: "#e3d7cb" }}
          >
            {seat.seatNumber.match(/[A-F]/)}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default function SeatSelection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState([]);
  const [returnSeats, setReturnSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState([]);
  const [showingReturnSeats, setShowingReturnSeats] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [sessionId] = useState(() => {
    // Reuse existing sessionId from sessionStorage if available
    const existingSessionId = sessionStorage.getItem(`seat_session_${id}`);
    if (existingSessionId) {
      return existingSessionId;
    }
    // Generate new sessionId and store it
    const newSessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    sessionStorage.setItem(`seat_session_${id}`, newSessionId);
    return newSessionId;
  });
  const [outboundLockedSeats, setOutboundLockedSeats] = useState(new Map()); // Map<seatNumber, {lockedBy, expiresAt}>
  const [returnLockedSeats, setReturnLockedSeats] = useState(new Map()); // Map<seatNumber, {lockedBy, expiresAt}>
  const userUnlockingRef = useRef(new Set()); // Track seats being unlocked by user
  const [lockStartTime, setLockStartTime] = useState(null); // Track when first seat was locked
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const timerRef = useRef(null);
  const [lockingSeats, setLockingSeats] = useState(new Set()); // Track seats being locked/unlocked

  // Get the appropriate locked seats map based on current view
  const lockedSeats = showingReturnSeats
    ? returnLockedSeats
    : outboundLockedSeats;
  const setLockedSeats = showingReturnSeats
    ? setReturnLockedSeats
    : setOutboundLockedSeats;

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
  const {
    flight,
    outboundFlight,
    returnFlight,
    from,
    to,
    date,
    returnDate,
    passengers,
    tripType,
  } = flightData || {};

  const isRoundTrip = tripType === "round-trip";
  const displayFlight = outboundFlight || flight;
  const maxSeats = parseInt(passengers || 1);

  useDocumentTitle("Select Seats");

  useEffect(() => {
    if (!displayFlight) {
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
          booking.flightId?._id === displayFlight._id &&
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

      // Fetch seats for outbound flight
      const seatsRes = await getFlightSeats(displayFlight._id);

      // Fetch seats for return flight if round-trip
      let returnSeatsRes = null;
      if (isRoundTrip && returnFlight) {
        returnSeatsRes = await getFlightSeats(returnFlight._id);
      }

      // Fetch pricing config
      const pricingRes = await api.get("/pricing/config");

      setSeats(seatsRes.seats || []);
      if (returnSeatsRes) {
        setReturnSeats(returnSeatsRes.seats || []);
      }
      setPricingConfig(pricingRes.data.config);

      // Initialize locked seats from server
      const initialOutboundLocks = new Map();
      const myOutboundSeats = []; // Track seats locked by current user
      (seatsRes.seats || []).forEach((seat) => {
        if (seat.lockedBy && seat.lockExpiresAt) {
          initialOutboundLocks.set(seat.seatNumber, {
            lockedBy: seat.lockedBy,
            expiresAt: new Date(seat.lockExpiresAt),
            sessionId: seat.sessionId, // Store sessionId to identify our locks
          });
          // If this seat is locked by current user, add to selected seats
          if (seat.sessionId === sessionId) {
            myOutboundSeats.push(seat);
          }
        }
      });
      setOutboundLockedSeats(initialOutboundLocks);
      // Restore selected seats if they were locked by current user
      if (myOutboundSeats.length > 0) {
        setSelectedSeats(myOutboundSeats);
        // Restore timer if it was previously started
        const storedLockStartTime = sessionStorage.getItem(`lock_start_${id}`);
        if (storedLockStartTime && !lockStartTime) {
          setLockStartTime(parseInt(storedLockStartTime));
        }
      }

      // Initialize locked seats from server for return flight if round-trip
      if (returnSeatsRes) {
        const initialReturnLocks = new Map();
        const myReturnSeats = []; // Track seats locked by current user
        (returnSeatsRes.seats || []).forEach((seat) => {
          if (seat.lockedBy && seat.lockExpiresAt) {
            initialReturnLocks.set(seat.seatNumber, {
              lockedBy: seat.lockedBy,
              expiresAt: new Date(seat.lockExpiresAt),
              sessionId: seat.sessionId, // Store sessionId to identify our locks
            });
            // If this seat is locked by current user, add to selected seats
            if (seat.sessionId === sessionId) {
              myReturnSeats.push(seat);
            }
          }
        });
        setReturnLockedSeats(initialReturnLocks);
        // Restore selected seats if they were locked by current user
        if (myReturnSeats.length > 0) {
          setSelectedReturnSeats(myReturnSeats);
          // Restore timer if it was previously started
          const storedLockStartTime = sessionStorage.getItem(
            `lock_start_${id}`
          );
          if (storedLockStartTime && !lockStartTime) {
            setLockStartTime(parseInt(storedLockStartTime));
          }
        }
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err?.response?.data?.message || "Failed to load seats");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    }
  }

  // Timer countdown effect
  useEffect(() => {
    if (!lockStartTime) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - lockStartTime) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current);
        toast.error(
          "Time expired! Your seat selection has expired. Please select again."
        );
        setTimeout(() => {
          navigate(-1);
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
  }, [lockStartTime, navigate]);

  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Socket.IO real-time event handlers
  const socketHandlers = useMemo(
    () => ({
      onSeatLocked: (data) => {
        const currentFlightId =
          showingReturnSeats && returnFlight
            ? returnFlight._id
            : displayFlight?._id;
        if (data.flightId !== currentFlightId) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.set(data.seatNumber, {
            lockedBy: data.lockedBy,
            expiresAt: new Date(data.lockExpiresAt),
            sessionId: data.sessionId, // Include sessionId from socket event
          });
          return newLocks;
        });
      },
      onSeatUnlocked: (data) => {
        const currentFlightId =
          showingReturnSeats && returnFlight
            ? returnFlight._id
            : displayFlight?._id;
        if (data.flightId !== currentFlightId) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        // Check if this was our selected seat
        const currentSeats = showingReturnSeats
          ? selectedReturnSeats
          : selectedSeats;
        const wasSelected = currentSeats.some(
          (s) => s.seatNumber === data.seatNumber
        );
        if (wasSelected) {
          if (showingReturnSeats) {
            setSelectedReturnSeats((prev) => {
              const newSeats = prev.filter(
                (s) => s.seatNumber !== data.seatNumber
              );
              // Reset timer if all seats are removed
              const allSeatsCount = selectedSeats.length + newSeats.length;
              if (allSeatsCount === 0) {
                setLockStartTime(null);
                setTimeRemaining(600);
                sessionStorage.removeItem(`lock_start_${id}`);
              }
              return newSeats;
            });
          } else {
            setSelectedSeats((prev) => {
              const newSeats = prev.filter(
                (s) => s.seatNumber !== data.seatNumber
              );
              // Reset timer if all seats are removed
              const allSeatsCount =
                newSeats.length + selectedReturnSeats.length;
              if (allSeatsCount === 0) {
                setLockStartTime(null);
                setTimeRemaining(600);
                sessionStorage.removeItem(`lock_start_${id}`);
              }
              return newSeats;
            });
          }
          // Only show message if we didn't unlock it ourselves
          const wasUserInitiated = userUnlockingRef.current.has(
            data.seatNumber
          );
          if (!wasUserInitiated) {
            toast.warning(`Seat ${data.seatNumber} was released by admin`);
          }
        }
      },
      onSeatBooked: (data) => {
        const currentFlightId =
          showingReturnSeats && returnFlight
            ? returnFlight._id
            : displayFlight?._id;
        if (data.flightId !== currentFlightId) return;
        // Update seat availability
        if (showingReturnSeats) {
          setReturnSeats((prevSeats) =>
            prevSeats.map((s) =>
              s.seatNumber === data.seatNumber
                ? { ...s, isAvailable: false }
                : s
            )
          );
        } else {
          setSeats((prevSeats) =>
            prevSeats.map((s) =>
              s.seatNumber === data.seatNumber
                ? { ...s, isAvailable: false }
                : s
            )
          );
        }
        // Remove from locked seats
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
      },
      onSeatExpired: (data) => {
        const currentFlightId =
          showingReturnSeats && returnFlight
            ? returnFlight._id
            : displayFlight?._id;
        if (data.flightId !== currentFlightId) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        // Check if it was our seat
        const currentSeats = showingReturnSeats
          ? selectedReturnSeats
          : selectedSeats;
        const wasOurSeat = currentSeats.some(
          (s) => s.seatNumber === data.seatNumber
        );
        if (wasOurSeat) {
          toast.warning(
            `Your selection for seat ${data.seatNumber} has expired`
          );
          if (showingReturnSeats) {
            setSelectedReturnSeats((prev) => {
              const newSeats = prev.filter(
                (s) => s.seatNumber !== data.seatNumber
              );
              // Reset timer if all seats are removed
              const allSeatsCount = selectedSeats.length + newSeats.length;
              if (allSeatsCount === 0) {
                setLockStartTime(null);
                setTimeRemaining(600);
                sessionStorage.removeItem(`lock_start_${id}`);
              }
              return newSeats;
            });
          } else {
            setSelectedSeats((prev) => {
              const newSeats = prev.filter(
                (s) => s.seatNumber !== data.seatNumber
              );
              // Reset timer if all seats are removed
              const allSeatsCount =
                newSeats.length + selectedReturnSeats.length;
              if (allSeatsCount === 0) {
                setLockStartTime(null);
                setTimeRemaining(600);
                sessionStorage.removeItem(`lock_start_${id}`);
              }
              return newSeats;
            });
          }
        }
      },
      onSeatCancelled: (data) => {
        const currentFlightId =
          showingReturnSeats && returnFlight
            ? returnFlight._id
            : displayFlight?._id;
        if (data.flightId !== currentFlightId) return;
        // Booking was cancelled, seat becomes available again
        if (showingReturnSeats) {
          setReturnSeats((prevSeats) =>
            prevSeats.map((s) =>
              s.seatNumber === data.seatNumber ? { ...s, isAvailable: true } : s
            )
          );
        } else {
          setSeats((prevSeats) =>
            prevSeats.map((s) =>
              s.seatNumber === data.seatNumber ? { ...s, isAvailable: true } : s
            )
          );
        }
        // Remove from locked seats if it was locked
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
      },
      onError: (error) => {
        console.error("Socket error:", error);
      },
    }),
    [
      displayFlight?._id,
      returnFlight?._id,
      selectedSeats,
      selectedReturnSeats,
      showingReturnSeats,
    ]
  );

  // Initialize Socket.IO connection for current flight
  const currentFlightId =
    showingReturnSeats && returnFlight ? returnFlight._id : displayFlight?._id;
  useSeatSocket(currentFlightId, socketHandlers);

  async function handleSeatSelect(seat) {
    const currentSeats = showingReturnSeats
      ? selectedReturnSeats
      : selectedSeats;
    const setCurrentSeats = showingReturnSeats
      ? setSelectedReturnSeats
      : setSelectedSeats;
    const currentFlightId = showingReturnSeats
      ? returnFlight._id
      : displayFlight._id;

    const isAlreadySelected = currentSeats.some(
      (s) => s.seatNumber === seat.seatNumber
    );

    if (isAlreadySelected) {
      // Unlock the seat - Optimistic UI
      // Show loading state
      setLockingSeats((prev) => {
        const next = new Set(prev);
        next.add(seat.seatNumber);
        return next;
      });

      try {
        // Mark this seat as being unlocked by user
        userUnlockingRef.current.add(seat.seatNumber);

        // Optimistic update - remove immediately
        const newSeats = currentSeats.filter(
          (s) => s.seatNumber !== seat.seatNumber
        );
        setCurrentSeats(newSeats);

        // Reset timer if all seats are deselected
        const allSeatsCount = showingReturnSeats
          ? selectedSeats.length + newSeats.length
          : newSeats.length + selectedReturnSeats.length;
        if (allSeatsCount === 0) {
          setLockStartTime(null);
          setTimeRemaining(600);
          sessionStorage.removeItem(`lock_start_${id}`);
        }

        // Then sync with server
        await unlockSeat({
          flightId: currentFlightId,
          seatNumber: seat.seatNumber,
          sessionId,
        });

        // Remove from tracking after a short delay
        setTimeout(() => {
          userUnlockingRef.current.delete(seat.seatNumber);
        }, 1000);
      } catch (error) {
        console.error("Failed to unlock seat:", error);
        // Rollback - add seat back
        setCurrentSeats((prev) => [...prev, seat]);
        // Restore timer if needed
        if (currentSeats.length === 1 && !lockStartTime) {
          const startTime = Date.now();
          setLockStartTime(startTime);
          sessionStorage.setItem(`lock_start_${id}`, startTime.toString());
        }
        toast.error("Failed to deselect seat");
      } finally {
        setLockingSeats((prev) => {
          const next = new Set(prev);
          next.delete(seat.seatNumber);
          return next;
        });
      }
    } else {
      if (currentSeats.length >= maxSeats) {
        toast.warning(`You can only select ${maxSeats} seat(s)`);
        return;
      }

      // Lock the seat - Optimistic UI
      // Show loading state
      setLockingSeats((prev) => {
        const next = new Set(prev);
        next.add(seat.seatNumber);
        return next;
      });

      try {
        // Optimistic update - add immediately
        setCurrentSeats([...currentSeats, seat]);

        // Start timer when first seat is selected
        const allSeatsCount = showingReturnSeats
          ? selectedSeats.length + currentSeats.length + 1
          : currentSeats.length + 1 + selectedReturnSeats.length;
        if (allSeatsCount === 1 && !lockStartTime) {
          const startTime = Date.now();
          setLockStartTime(startTime);
          sessionStorage.setItem(`lock_start_${id}`, startTime.toString());
        }

        // Then sync with server
        const previousSeat =
          currentSeats.length >= maxSeats
            ? currentSeats[0].seatNumber
            : undefined;
        await lockSeat({
          flightId: currentFlightId,
          seatNumber: seat.seatNumber,
          sessionId,
          previousSeat,
        });
      } catch (error) {
        console.error("Failed to lock seat:", error);

        // Rollback - remove seat
        setCurrentSeats((prev) =>
          prev.filter((s) => s.seatNumber !== seat.seatNumber)
        );

        // Reset timer if this was the only seat
        const allSeatsCount = showingReturnSeats
          ? selectedSeats.length + currentSeats.length
          : currentSeats.length + selectedReturnSeats.length;
        if (allSeatsCount === 0) {
          setLockStartTime(null);
          setTimeRemaining(600);
          sessionStorage.removeItem(`lock_start_${id}`);
        }

        const message =
          error.response?.data?.message ||
          "Failed to select seat. It may be locked by another user.";
        toast.error(message);
      } finally {
        setLockingSeats((prev) => {
          const next = new Set(prev);
          next.delete(seat.seatNumber);
          return next;
        });
      }
    }
  }

  function handleContinue() {
    // For round-trip, check if we're on outbound or return seat selection
    if (isRoundTrip && !showingReturnSeats) {
      // Validate outbound seats
      if (selectedSeats.length === 0) {
        toast.warning("Please select at least one seat for outbound flight");
        return;
      }
      if (selectedSeats.length < maxSeats) {
        toast.warning(`Please select ${maxSeats} seat(s) for outbound flight`);
        return;
      }

      // Switch to return flight seat selection
      setShowingReturnSeats(true);
      toast.success("Outbound seats selected! Now select return flight seats.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validate final selection
    if (selectedSeats.length === 0) {
      toast.warning("Please select at least one seat");
      return;
    }
    if (selectedSeats.length < maxSeats) {
      toast.warning(`Please select ${maxSeats} seat(s)`);
      return;
    }

    // For round-trip, also validate return seats
    if (isRoundTrip) {
      if (selectedReturnSeats.length === 0) {
        toast.warning("Please select at least one seat for return flight");
        return;
      }
      if (selectedReturnSeats.length !== selectedSeats.length) {
        toast.warning(
          "Please select the same number of seats for both flights"
        );
        return;
      }
    }

    // Store selection in sessionStorage and navigate to passenger details
    if (isRoundTrip) {
      sessionStorage.setItem(
        `booking_${displayFlight._id}`,
        JSON.stringify({
          outboundFlight: displayFlight,
          returnFlight,
          outboundSeats: selectedSeats,
          returnSeats: selectedReturnSeats,
          from,
          to,
          date,
          returnDate,
          passengers,
          tripType: "round-trip",
          totalPrice, // Pass dynamic price
          lockStartTime, // Pass timer start time
        })
      );
    } else {
      sessionStorage.setItem(
        `booking_${displayFlight._id}`,
        JSON.stringify({
          flight: displayFlight,
          seats: selectedSeats,
          from,
          to,
          date,
          passengers,
          tripType: "one-way",
          totalPrice, // Pass dynamic price
          lockStartTime, // Pass timer start time
        })
      );
    }

    navigate(`/passenger-details/${displayFlight._id}`);
  }

  // Group seats by row (use current flight's seats)
  const currentSeats = showingReturnSeats ? returnSeats : seats;
  const currentSelectedSeats = showingReturnSeats
    ? selectedReturnSeats
    : selectedSeats;

  const seatsByRow = useMemo(() => {
    const rows = {};
    currentSeats.forEach((seat) => {
      const match = seat.seatNumber.match(/^(\d+)([A-F])$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        if (!rows[rowNum]) rows[rowNum] = {};
        rows[rowNum][match[2]] = seat;
      }
    });
    return rows;
  }, [currentSeats]);

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  // Helper to check if seat is locked
  const getSeatLockStatus = (seatNumber) => {
    const lock = lockedSeats.get(seatNumber);
    if (!lock) return { isLocked: false, isLockedByMe: false };

    const now = new Date();
    if (lock.expiresAt < now) {
      return { isLocked: false, isLockedByMe: false };
    }

    // Check if locked by current user by comparing sessionId
    const isLockedByMe = lock.sessionId === sessionId;
    return { isLocked: true, isLockedByMe };
  };

  // State for dynamic pricing
  const [dynamicPricing, setDynamicPricing] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch dynamic pricing when seat selection changes
  useEffect(() => {
    // Check if we have any seats selected
    if (selectedSeats.length === 0 || !displayFlight?._id) {
      setDynamicPricing(null);
      return;
    }

    const fetchDynamicPricing = async () => {
      try {
        setLoadingPrice(true);
        let totalDynamic = 0;

        // Calculate outbound
        for (const seat of selectedSeats) {
          const seatType =
            seat.seatNumber.includes("A") || seat.seatNumber.includes("F")
              ? "window"
              : seat.seatNumber.includes("C") || seat.seatNumber.includes("D")
              ? "aisle"
              : "middle";

          const priceData = await getDynamicPrice(
            displayFlight._id,
            seat.travelClass,
            seat.isExtraLegroom,
            seatType
          );

          totalDynamic += priceData.pricing.total;
        }

        // Calculate return if round-trip
        if (isRoundTrip && returnFlight && selectedReturnSeats.length > 0) {
          for (const seat of selectedReturnSeats) {
            const seatType =
              seat.seatNumber.includes("A") || seat.seatNumber.includes("F")
                ? "window"
                : seat.seatNumber.includes("C") || seat.seatNumber.includes("D")
                ? "aisle"
                : "middle";

            const priceData = await getDynamicPrice(
              returnFlight._id,
              seat.travelClass,
              seat.isExtraLegroom,
              seatType
            );

            totalDynamic += priceData.pricing.total;
          }
        }

        setDynamicPricing({ total: totalDynamic });
      } catch (error) {
        console.error("Failed to fetch dynamic pricing:", error);
        setDynamicPricing(null);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchDynamicPricing();
  }, [
    selectedSeats,
    selectedReturnSeats,
    displayFlight?._id,
    returnFlight?._id,
    isRoundTrip,
  ]);

  // Calculate total price (use dynamic if available, fallback to static)
  const totalPrice = useMemo(() => {
    if (dynamicPricing) {
      return Math.round(dynamicPricing.total * 100) / 100;
    }

    // Fallback to static pricing
    if (!pricingConfig) return 0;

    let total = 0;

    // Calculate outbound flight price
    selectedSeats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = displayFlight.baseFare * classMultiplier;
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

    // Calculate return flight price if round-trip
    if (isRoundTrip && returnFlight) {
      selectedReturnSeats.forEach((seat) => {
        const classMultiplier =
          pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
        const classPrice = returnFlight.baseFare * classMultiplier;
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
    }

    return Math.round(total * 100) / 100;
  }, [
    selectedSeats,
    selectedReturnSeats,
    pricingConfig,
    displayFlight?.baseFare,
    returnFlight?.baseFare,
    isRoundTrip,
    dynamicPricing,
  ]);

  if (loading || !displayFlight) {
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
              {isRoundTrip && showingReturnSeats
                ? "Return"
                : isRoundTrip
                ? "Outbound"
                : "Choose"}
            </h2>
            <h2
              className="text-3xl font-bold leading-9 -mt-1"
              style={{ color: "#541424" }}
            >
              {isRoundTrip ? "Seats" : "Your Seat"}
            </h2>
            {isRoundTrip && (
              <p
                className="text-sm mt-1"
                style={{ color: "rgba(84, 20, 36, 0.6)" }}
              >
                {showingReturnSeats ? `${to} → ${from}` : `${from} → ${to}`}
              </p>
            )}
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
              {isRoundTrip && showingReturnSeats
                ? "Return Seats"
                : isRoundTrip
                ? "Outbound Seats"
                : "Selected"}
            </span>
            <span className="font-bold text-lg" style={{ color: "#541424" }}>
              {currentSelectedSeats.length} / {maxSeats}
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
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
                          />
                        );
                      })}

                      {/* Middle Seat E (Right side) */}
                      {["E"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
                          />
                        );
                      })}

                      {/* Aisle Seat D (Right side) */}
                      {["D"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
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
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
                          />
                        );
                      })}

                      {/* Middle Seat B (Left side) */}
                      {["B"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
                          />
                        );
                      })}

                      {/* Window Seat A (Left side) - BOTTOM */}
                      {["A"].map((letter) => {
                        const seat = row[letter];
                        if (!seat) return <div key={letter} className="h-11" />;
                        const lockStatus = getSeatLockStatus(seat.seatNumber);
                        return (
                          <SeatButton
                            key={letter}
                            seat={seat}
                            selected={currentSelectedSeats.some(
                              (s) => s.seatNumber === seat.seatNumber
                            )}
                            onPress={handleSeatSelect}
                            rowClass={rowClass}
                            isLocked={lockStatus.isLocked}
                            isLockedByMe={lockStatus.isLockedByMe}
                            isLoading={lockingSeats.has(seat.seatNumber)}
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
          {/* Timer Display */}
          {lockStartTime && (
            <div
              className={`rounded-[20px] p-4 mb-4 border flex items-center gap-3 ${
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
                  Seats will be released after timer expires
                </p>
              </div>
            </div>
          )}

          <div
            className="rounded-[20px] p-4 mb-4 border"
            style={{
              backgroundColor: "rgba(227, 215, 203, 0.4)",
              borderColor: "rgba(84, 20, 36, 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="font-medium text-sm"
                  style={{ color: "rgba(84, 20, 36, 0.7)" }}
                >
                  {isRoundTrip ? "Total Fare (Both Flights)" : "Total Fare"}
                </span>
                {dynamicPricing && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold"
                    style={{
                      backgroundColor: "rgba(84, 20, 36, 0.1)",
                      color: "#541424",
                    }}
                  >
                    LIVE
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {loadingPrice && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "rgba(84, 20, 36, 0.4)" }}
                  >
                    Updating...
                  </span>
                )}
                <span
                  className="font-bold text-xl"
                  style={{ color: "#541424" }}
                >
                  ₹ {totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            {dynamicPricing && (
              <p
                className="text-[10px] mt-1"
                style={{ color: "rgba(84, 20, 36, 0.5)" }}
              >
                Price includes demand & time-based adjustments
              </p>
            )}
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base rounded-full"
            onClick={handleContinue}
            disabled={currentSelectedSeats.length === 0}
          >
            {isRoundTrip && !showingReturnSeats
              ? "Continue to Return Flight"
              : "Continue to Passenger Details"}
          </Button>
          {isRoundTrip && showingReturnSeats && (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-base rounded-full mt-3"
              onClick={() => {
                setShowingReturnSeats(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Back to Outbound Flight
            </Button>
          )}
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
