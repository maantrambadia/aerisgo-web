import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, AlertCircle, Info } from "lucide-react";
import { getMyNotifications, markNotificationRead } from "@/lib/notifications";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";
import { toast } from "sonner";

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useDocumentTitle("Notifications");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const list = await getMyNotifications({ limit: 50 });
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || "We couldn't load notifications.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(value) {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  }

  function getTypeMeta(type) {
    switch (type) {
      case "alert":
        return {
          label: "Alert",
          icon: AlertCircle,
          badgeVariant: "destructive",
        };
      case "reminder":
        return {
          label: "Reminder",
          icon: Bell,
          badgeVariant: "secondary",
        };
      default:
        return {
          label: "Info",
          icon: Info,
          badgeVariant: "outline",
        };
    }
  }

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );

  async function handleClickNotification(item) {
    if (!item?._id) return;

    // Optimistic update for read state
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((n) =>
          n._id === item._id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );

      await markNotificationRead(item._id);
    }

    // TODO: In future, deep link to booking/flight using item.data
  }

  if (loading) {
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
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount} unread notification
                  {unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="w-10" />
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {error && items.length === 0 ? (
          <Card className="p-8 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadNotifications} className="rounded-full">
              Try Again
            </Button>
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-8 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground mb-4">
              Booking updates, flight changes, and reminders will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const meta = getTypeMeta(item.type);
              const Icon = meta.icon;
              const isRead = item.isRead;

              return (
                <Card
                  key={item._id}
                  className={`rounded-3xl transition-colors cursor-pointer border flex flex-col sm:flex-row gap-4 items-start sm:items-center px-4 py-4 sm:px-6 sm:py-5 ${
                    isRead
                      ? "bg-card border-border/60"
                      : "bg-primary/5 border-primary/30"
                  }`}
                  onClick={() => handleClickNotification(item)}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={meta.badgeVariant}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {meta.label.toUpperCase()}
                      </Badge>
                      {!isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
