import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plane,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Check,
  Clock,
  AlertCircle,
  UtensilsCrossed,
  Luggage,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { checkEligibility, performCheckIn } from "@/lib/checkin";
import { getBookingById } from "@/lib/bookings";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";

export default function CheckIn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  useDocumentTitle("Web Check-in");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [booking, eligibilityRes] = await Promise.all([
        getBookingById(id),
        checkEligibility(id).catch(() => null),
      ]);

      setBooking(booking);
      setEligibility(eligibilityRes);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load booking");
      navigate("/account");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    try {
      setChecking(true);
      const response = await performCheckIn(id);
      const gate =
        response.boardingPass?.gate || booking.flightId?.gate || "TBA";
      toast.success(`Check-in successful! Gate: ${gate}`);

      // Navigate to account page to view boarding pass
      setTimeout(() => {
        navigate("/account");
      }, 1500);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Check-in failed");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <LoadingFallback />;
  }

  if (!booking || !booking.flightId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/account")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tickets
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find this booking. Please try again or contact
              support.
            </p>
            <Button onClick={() => navigate("/account")}>
              Go to My Tickets
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const flight = booking.flightId;
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Check if already checked in
  if (booking.isCheckedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/account")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tickets
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Already Checked In</h1>
            <p className="text-muted-foreground mb-4">
              You have already completed check-in for this flight.
            </p>
            {(booking.boardingPass?.gate || booking.flightId?.gate) && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold mb-6">
                <span className="text-sm">Gate:</span>
                <span className="text-2xl">
                  {booking.boardingPass?.gate || booking.flightId?.gate}
                </span>
              </div>
            )}
            <Button onClick={() => navigate("/account")}>
              View Boarding Pass
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check eligibility
  const isEligible = eligibility?.eligible === true;
  const hoursUntilCheckIn = eligibility?.hoursUntilCheckIn;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/account")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tickets
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Web Check-in</h1>
          <p className="text-muted-foreground mb-8">
            Complete your check-in to get your boarding pass
          </p>

          {/* Flight Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight {flight.flightNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-semibold">
                      {flight.source} → {flight.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-semibold">
                      {formatDate(flight.departureTime)}
                    </p>
                    <p className="text-sm">
                      {formatTime(flight.departureTime)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passenger Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Passenger Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.passengers && booking.passengers.length > 0 ? (
                <div className="space-y-4">
                  {booking.passengers.map((passenger, index) => {
                    // Calculate age from dateOfBirth
                    const age = passenger.dateOfBirth
                      ? Math.floor(
                          (new Date() - new Date(passenger.dateOfBirth)) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )
                      : null;

                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Name
                            </p>
                            <p className="font-medium">{passenger.fullName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Age</p>
                            <p className="font-medium">{age || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Gender
                            </p>
                            <p className="font-medium capitalize">
                              {passenger.gender}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Seat
                            </p>
                            <p className="font-medium">
                              {passenger.seatNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Seat Number</p>
                    <p className="font-medium">{booking.seatNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium capitalize">
                      {booking.travelClass}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PNR</p>
                    <p className="font-medium font-mono">{booking.pnr}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons Section - Meals & Baggage */}
          {isEligible && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Enhance Your Journey
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Meal Selection Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Select Meals</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {booking.mealPreference ||
                          (booking.passengers &&
                            booking.passengers.some((p) => p.mealPreference))
                            ? "Meals selected - Click to change"
                            : "Pre-order your in-flight meals"}
                        </p>
                        {(booking.mealPreference ||
                          (booking.passengers &&
                            booking.passengers.some(
                              (p) => p.mealPreference
                            ))) && (
                          <div className="mb-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            <span>Meals selected</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/meal-selection/${booking._id}`, {
                              state: { from: "checkin" },
                            })
                          }
                          className="w-full"
                        >
                          {booking.mealPreference ||
                          (booking.passengers &&
                            booking.passengers.some((p) => p.mealPreference))
                            ? "Change Meals"
                            : "Choose Meals"}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Baggage Selection Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Luggage className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          Baggage Allowance
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          View your included baggage allowance
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/baggage-selection/${booking._id}`, {
                              state: { from: "checkin" },
                            })
                          }
                          className="w-full"
                        >
                          View Baggage
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Eligibility Status */}
          {!isEligible && (
            <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {eligibility?.message || "Check-in not available"}
                    </p>
                    {hoursUntilCheckIn > 0 && (
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Check-in opens in {Math.floor(hoursUntilCheckIn)} hours
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in Button */}
          {isEligible && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Ready for Check-in
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Please confirm your details and complete check-in to
                      receive your boarding pass
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleCheckIn}
                    disabled={checking}
                    className="w-full md:w-auto"
                  >
                    {checking ? (
                      <>
                        <Spinner className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plane className="h-4 w-4 mr-2" />
                        Complete Check-in
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
