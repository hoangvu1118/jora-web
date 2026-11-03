import { Outlet, useLocation } from "react-router-dom";
import AppNav from "./AppNav";

// The frame every logged-in screen sits in: nav on top (bottom tabs on phones), screen below.
export default function AppLayout() {
  const location = useLocation();

  // Job detail hides the phone tab bar and shows its own action bar instead.
  let frameClass = "frame";
  if (location.pathname.startsWith("/jobs/")) {
    frameClass = "frame page-job";
  }

  return (
    <div className={frameClass}>
      <AppNav />
      <Outlet />
    </div>
  );
}
