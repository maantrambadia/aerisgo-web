import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane,
  Ticket,
  Gift,
  User,
  LogOut,
  Phone,
  UserCircle,
} from "lucide-react";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import TicketsTab from "@/components/account/TicketsTab";
import RewardsTab from "@/components/account/RewardsTab";
import ProfileTab from "@/components/account/ProfileTab";

export default function Account() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets");
  useDocumentTitle("My Account");

  const getAvatarSrc = () => {
    const gender = user?.gender?.toLowerCase();
    if (gender === "male") return "/images/male.png";
    if (gender === "female") return "/images/female.png";
    return null;
  };

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
            className="bg-background/70 border border-border/40 rounded-full shadow-xl px-4 sm:px-6 py-3 pointer-events-auto"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/images/welcome-logo-2.png"
                  alt="AerisGo"
                  className="h-7 w-auto"
                />
              </Link>
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-9 px-3 sm:px-4"
                    >
                      <Plane className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Book Flight</span>
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="rounded-full h-9 px-3 sm:px-4"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Profile Header Card */}
          <Card className="mb-6 sm:mb-8 overflow-hidden border-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary to-primary/80">
            <div className="p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {getAvatarSrc() ? (
                    <img
                      src={getAvatarSrc()}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {user?.name || "Traveler"}
                  </h1>
                  <p className="text-white/80 mt-1 text-sm sm:text-base break-all">
                    {user?.email}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <Phone className="w-3 h-3" />
                      <span className="text-xs sm:text-sm">{user?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <User className="w-3 h-3" />
                      <span className="text-xs sm:text-sm capitalize">
                        {user?.gender || "other"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
              <TabsTrigger
                value="tickets"
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">My Tickets</span>
                <span className="sm:hidden">Tickets</span>
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Gift className="w-4 h-4" />
                <span>Rewards</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              <TicketsTab />
            </TabsContent>

            <TabsContent value="rewards">
              <RewardsTab />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
