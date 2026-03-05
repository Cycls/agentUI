import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router";

export const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen grid place-items-center text-sm theme-transition"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-tertiary)",
        }}
      >
        Loading&hellip;
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to="/auth/sign-in"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};
