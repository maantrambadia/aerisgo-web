import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import LoadingFallback from "@/components/LoadingFallback.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";
import RequireGuest from "@/components/RequireGuest.jsx";

// Lazy load pages
const Home = lazy(() => import("@/pages/Home.jsx"));
const SearchResults = lazy(() => import("@/pages/SearchResults.jsx"));
const FlightDetails = lazy(() => import("@/pages/FlightDetails.jsx"));
const SignIn = lazy(() => import("@/pages/SignIn.jsx"));
const SignUp = lazy(() => import("@/pages/SignUp.jsx"));
const VerifyOTP = lazy(() => import("@/pages/VerifyOTP.jsx"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: "/search-results",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        s
        <SearchResults />
      </Suspense>
    ),
  },
  {
    path: "/flight/:id",
    element: (
      <RequireAuth>
        <Suspense fallback={<LoadingFallback />}>
          <FlightDetails />
        </Suspense>
      </RequireAuth>
    ),
  },
  {
    path: "/sign-in",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <SignIn />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/sign-up",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <SignUp />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/verify-otp",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <VerifyOTP />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <ForgotPassword />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <ResetPassword />
        </Suspense>
      </RequireGuest>
    ),
  },
]);

export default router;
