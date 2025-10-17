import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";
import { Plane, Search } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-svh">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <span className="text-xl font-bold">AerisGo</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.name}
                </span>
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-bold tracking-tight"
          >
            Find Your Next Adventure
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-muted-foreground"
          >
            Search and book flights to destinations around the world
          </motion.p>

          {/* Search Box Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-card border rounded-lg p-8 shadow-lg mt-8"
          >
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <Search className="h-8 w-8" />
              <p className="text-lg">Flight search coming soon...</p>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
