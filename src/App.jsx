import { Navigate, Route, Routes } from "react-router-dom";
import RequireLogin from "./auth/RequireLogin";
import Symbols from "./components/Symbols";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import SuggestedPage from "./pages/SuggestedPage";
import ResumePage from "./pages/ResumePage";
import TailoredPage from "./pages/TailoredPage";
import ProfilePage from "./pages/ProfilePage";

// Every screen and its address.
export default function App() {
  return (
    <>
      <Symbols />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireLogin />}>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/suggested" element={<SuggestedPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/tailored" element={<TailoredPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
