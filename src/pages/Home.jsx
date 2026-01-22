import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router";
import { AirportSelector } from "@/components/AirportSelector";
import { PassengerSelector } from "@/components/PassengerSelector";
import { parseCityName } from "@/lib/airports";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Shield,
  Clock,
  CreditCard,
  Star,
  TrendingUp,
  UserCircle,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
} from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tripType, setTripType] = useState("one-way");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState({ adults: 1, children: 0 });

  const features = [
    {
      icon: Shield,
      title: "Secure Booking",
      description: "Your data is protected with industry-standard encryption",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Our team is always here to help you with your journey",
    },
    {
      icon: CreditCard,
      title: "Best Prices",
      description: "Get the most competitive fares for your flights",
    },
    {
      icon: Star,
      title: "Rewards Program",
      description: "Earn points on every booking and redeem for discounts",
    },
  ];

  const destinations = [
    {
      city: "Mumbai",
      country: "India",
      image: "/images/destinations/mumbai.jpg",
      flights: "150+ flights",
    },
    {
      city: "Delhi",
      country: "India",
      image: "/images/destinations/delhi.jpg",
      flights: "200+ flights",
    },
    {
      city: "Bangalore",
      country: "India",
      image: "/images/destinations/bangalore.jpg",
      flights: "120+ flights",
    },
    {
      city: "Ahmedabad",
      country: "India",
      image: "/images/destinations/ahmedabad.jpg",
      flights: "80+ flights",
    },
  ];

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 pointer-events-none"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-background/70 border border-border/40 rounded-full shadow-xl px-6 py-3 pointer-events-auto"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src="/images/welcome-logo-2.png"
                  alt="AerisGo"
                  className="h-7 w-auto"
                />
              </Link>
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      aria-label="View notifications"
                      onClick={() => navigate("/notifications")}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Link to="/account">
                      <Button
                        variant="default"
                        className="rounded-full h-9 px-3 sm:px-4"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span className="hidden sm:inline sm:ml-2">
                          My Account
                        </span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={logout}
                      className="rounded-full h-9 px-3 sm:px-4"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline sm:ml-2">Sign Out</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      asChild
                      className="rounded-full h-9 px-3 sm:px-4"
                    >
                      <Link to="/sign-in">
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline sm:ml-2">
                          Sign in
                        </span>
                      </Link>
                    </Button>
                    <Button asChild className="rounded-full h-9 px-3 sm:px-4">
                      <Link to="/sign-up">
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline sm:ml-2">
                          Sign up
                        </span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Text */}
            <div className="text-center space-y-4 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Trusted by 10,000+ travelers</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              >
                Your Journey
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Begins Here
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Discover amazing destinations and book flights with ease. Your
                next adventure is just a few clicks away.
              </motion.p>
            </div>

            {/* Flight Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-card border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm"
            >
              {/* Trip Type Selector */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    setTripType("one-way");
                    setReturnDate("");
                  }}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                    tripType === "one-way"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  One Way
                </button>
                <button
                  onClick={() => setTripType("round-trip")}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                    tripType === "round-trip"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Round Trip
                </button>
              </div>

              {/* Search Form */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  tripType === "round-trip"
                    ? "lg:grid-cols-5"
                    : "lg:grid-cols-4"
                }`}
              >
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    From
                  </Label>
                  <AirportSelector
                    value={from}
                    onValueChange={setFrom}
                    placeholder="Select departure city"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    To
                  </Label>
                  <AirportSelector
                    value={to}
                    onValueChange={setTo}
                    placeholder="Select arrival city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {tripType === "round-trip" ? "Departure" : "Date"}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-12 rounded-2xl"
                  />
                </div>

                {tripType === "round-trip" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="returnDate"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Return
                    </Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={date || new Date().toISOString().split("T")[0]}
                      className="h-12 rounded-2xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Passengers
                  </Label>
                  <PassengerSelector
                    value={passengers}
                    onValueChange={setPassengers}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full h-12 text-base group rounded-full"
                  onClick={() => {
                    // Validation
                    const sourceCity = parseCityName(from);
                    const destCity = parseCityName(to);

                    if (!sourceCity || !destCity) {
                      toast.error("Please select a departure city and an arrival city.");
                      return;
                    }

                    if (sourceCity.toLowerCase() === destCity.toLowerCase()) {
                      toast.error(
                        "Departure and arrival cities must be different."
                      );
                      return;
                    }

                    if (!date) {
                      toast.error("Please select a departure date.");
                      return;
                    }

                    const selectedDate = new Date(date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    selectedDate.setHours(0, 0, 0, 0);

                    if (selectedDate < today) {
                      toast.error("Departure date can't be in the past.");
                      return;
                    }

                    // Validate return date for round-trip
                    if (tripType === "round-trip") {
                      if (!returnDate) {
                        toast.error("Please select a return date.");
                        return;
                      }

                      const selectedReturnDate = new Date(returnDate);
                      selectedReturnDate.setHours(0, 0, 0, 0);

                      if (selectedReturnDate <= selectedDate) {
                        toast.error("Return date must be after the departure date.");
                        return;
                      }
                    }

                    // Navigate to search results
                    const totalPassengers =
                      passengers.adults + passengers.children;
                    const searchUrl = `/search-results?from=${encodeURIComponent(
                      sourceCity
                    )}&to=${encodeURIComponent(
                      destCity
                    )}&date=${date}&passengers=${totalPassengers}&tripType=${tripType}${
                      tripType === "round-trip" && returnDate
                        ? `&returnDate=${returnDate}`
                        : ""
                    }`;
                    navigate(searchUrl);
                  }}
                >
                  Search Flights
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose AerisGo?
            </h2>
            <p className="text-muted-foreground text-lg">
              Experience the best in flight booking
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <feature.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore the most traveled routes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination, index) => (
              <div
                key={destination.city}
                className="group relative overflow-hidden rounded-3xl border bg-card shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  <img
                    src={destination.image}
                    alt={destination.city}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center">
                    <MapPin className="h-16 w-16 text-primary/40" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:translate-y-0">
                  <h3 className="text-xl font-semibold text-white">
                    {destination.city}
                  </h3>
                  <p className="text-sm text-white/90">{destination.country}</p>
                  <p className="text-xs text-white/80 mt-1">
                    {destination.flights}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Join thousands of travelers who trust AerisGo for their flight
              bookings
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-lg rounded-full"
              asChild
            >
              <Link to="/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <img
                src="/images/welcome-logo-2.png"
                alt="AerisGo"
                className="h-6 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AerisGo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
