import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router";

export const PublicOnlyRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen grid place-items-center text-sm theme-transition"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-tertiary)",
        }}
      >
        Loading&hellip;
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};
