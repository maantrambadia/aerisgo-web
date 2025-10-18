import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import LoadingFallback from "@/components/LoadingFallback";

export default function RequireGuest({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
