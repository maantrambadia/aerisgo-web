import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import LoadingFallback from "@/components/LoadingFallback";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    // Save the current location they were trying to access
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children;
}
