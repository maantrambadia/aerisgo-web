import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";
import {
  Plane,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Shield,
  Clock,
  CreditCard,
  Star,
  TrendingUp,
  Globe,
} from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const [tripType, setTripType] = useState("one-way");

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
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-muted-foreground hidden md:block mr-2"
                    >
                      {user.name}
                    </motion.span>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        onClick={logout}
                        className="rounded-full h-9 px-4"
                      >
                        Sign out
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        asChild
                        className="rounded-full h-9 px-4"
                      >
                        <Link to="/sign-in">Sign in</Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button asChild className="rounded-full h-9 px-4">
                        <Link to="/sign-up">Sign up</Link>
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        <motion.div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Text */}
            <div className="text-center space-y-4 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Trusted by 10,000+ travelers</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              >
                Your Journey
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Begins Here
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Discover amazing destinations and book flights with ease. Your
                next adventure is just a few clicks away.
              </motion.p>
            </div>

            {/* Flight Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              whileHover={{ y: -5 }}
              className="bg-card border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm"
            >
              {/* Trip Type Selector */}
              <div className="flex gap-3 mb-6">
                {["one-way", "round-trip"].map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => setTripType(type)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                      tripType === type
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "one-way" ? "One Way" : "Round Trip"}
                  </motion.button>
                ))}
              </div>

              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="from" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    From
                  </Label>
                  <Input
                    id="from"
                    placeholder="Departure city"
                    className="h-12 rounded-2xl"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="to" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    To
                  </Label>
                  <Input
                    id="to"
                    placeholder="Arrival city"
                    className="h-12 rounded-2xl"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input id="date" type="date" className="h-12 rounded-2xl" />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label
                    htmlFor="passengers"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Passengers
                  </Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="h-12 rounded-2xl"
                  />
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6"
              >
                <Button
                  size="lg"
                  className="w-full h-12 text-base group rounded-full"
                >
                  Search Flights
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
          }}
          className="absolute top-20 right-10 hidden lg:block"
        >
          <Plane className="h-16 w-16 text-primary/20" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-10 hidden lg:block"
        >
          <Globe className="h-20 w-20 text-primary/10" />
        </motion.div>
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
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
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
              </motion.div>
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
              <motion.div
                key={destination.city}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
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
              </motion.div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
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
