import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Utensils, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAvailableMeals, updateMealPreference } from "@/lib/meals";
import { getBookingById } from "@/lib/bookings";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";

// Meal category icons/emojis
const categoryIcons = {
  vegetarian: "🥗",
  "non-vegetarian": "🍗",
  vegan: "🌱",
  seafood: "🐟",
  custom: "👨‍🍳",
  none: "🚫",
};

export default function MealSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(null);
  const [meals, setMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState({});

  useDocumentTitle("Select Meals");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // Load booking first
      const booking = await getBookingById(id);
      setBooking(booking);

      // Get available meals for travel class
      const mealsRes = await getAvailableMeals(booking.travelClass);
      setMeals(mealsRes.meals || []);

      // Initialize selected meals
      const initialSelections = {};

      // For multi-passenger bookings
      if (booking.passengers && booking.passengers.length > 0) {
        booking.passengers.forEach((passenger) => {
          initialSelections[passenger.seatNumber] =
            passenger.mealPreference || "no-meal";
        });
      } else {
        // Single passenger
        initialSelections[booking.seatNumber] =
          booking.mealPreference || "no-meal";
      }

      setSelectedMeals(initialSelections);
    } catch (error) {
      console.error("Load meals error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "We couldn't load meal options.";
      toast.error(errorMessage);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    try {
      setSaving(true);

      // Prepare passenger meals array
      const passengerMeals = Object.entries(selectedMeals).map(
        ([seatNumber, mealId]) => ({
          seatNumber,
          mealId,
        }),
      );

      await updateMealPreference(id, { passengerMeals });
      toast.success("Meal preferences saved.");

      // Navigate to next step
      const from = location.state?.from;
      if (from === "booking") {
        navigate(`/baggage-selection/${id}`, { state: { from: "booking" } });
      } else if (from === "checkin") {
        navigate(`/check-in/${id}`);
      } else {
        navigate("/account");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "We couldn't save your meal preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    const from = location.state?.from;
    if (from === "booking") {
      navigate(`/baggage-selection/${id}`, { state: { from: "booking" } });
    } else if (from === "checkin") {
      navigate(`/check-in/${id}`);
    } else {
      navigate("/account");
    }
  }

  if (loading) {
    return <LoadingFallback />;
  }

  if (!booking) {
    return null;
  }

  const passengers =
    booking.passengers && booking.passengers.length > 0
      ? booking.passengers
      : [{ seatNumber: booking.seatNumber, name: "Passenger" }];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Utensils className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Select Your Meals</h1>
          </div>
          <p className="text-muted-foreground mb-2">
            Choose your preferred meal for the flight
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium mb-8">
            <Check className="h-4 w-4" />
            Complimentary - No additional charges
          </div>

          {/* Travel Class Badge */}
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm capitalize">
              {booking.travelClass} Class
            </Badge>
          </div>

          {/* Meal Selection for Each Passenger */}
          <div className="space-y-6">
            {passengers.map((passenger, index) => (
              <Card key={passenger.seatNumber}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{passenger.name || `Passenger ${index + 1}`}</span>
                    <Badge variant="outline">Seat {passenger.seatNumber}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedMeals[passenger.seatNumber] || "no-meal"}
                    onValueChange={(value) =>
                      setSelectedMeals((prev) => ({
                        ...prev,
                        [passenger.seatNumber]: value,
                      }))
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meals.map((meal) => (
                        <div key={meal.id}>
                          <Label
                            htmlFor={`${passenger.seatNumber}-${meal.id}`}
                            className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary hover:bg-accent"
                            style={{
                              borderColor:
                                selectedMeals[passenger.seatNumber] === meal.id
                                  ? "hsl(var(--primary))"
                                  : "hsl(var(--border))",
                              backgroundColor:
                                selectedMeals[passenger.seatNumber] === meal.id
                                  ? "hsl(var(--accent))"
                                  : "transparent",
                            }}
                          >
                            <RadioGroupItem
                              value={meal.id}
                              id={`${passenger.seatNumber}-${meal.id}`}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">
                                  {categoryIcons[meal.category] || "🍽️"}
                                </span>
                                <span className="font-semibold">
                                  {meal.name}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {meal.description}
                              </p>
                              {meal.price > 0 && (
                                <p className="text-sm font-medium text-primary mt-1">
                                  ₹{meal.price}
                                </p>
                              )}
                            </div>
                            {selectedMeals[passenger.seatNumber] ===
                              meal.id && (
                              <Check className="h-5 w-5 text-primary mt-1" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={saving}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1"
              disabled={saving}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  Save & Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            💡 You can change your meal preference anytime before check-in
          </p>
        </motion.div>
      </div>
    </div>
  );
}
