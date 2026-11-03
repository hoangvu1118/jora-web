import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AppLayout from "../components/AppLayout";

// Wraps every screen that needs a logged-in user.
export default function RequireLogin() {
  const auth = useAuth();
  if (!auth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}
