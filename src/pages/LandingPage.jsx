import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import landingHtml from "./landing/landing.html?raw";
import landingCss from "./landing/landing.css?raw";
import { startLandingDeck } from "./landing/landingDeck";

// The public landing page at "/". Logged-in users go straight to their jobs.
//
// This page is the approved design file, kept exactly as it was, so it is built differently
// from the app screens:
// - It sits inside a Shadow DOM: a sealed box where the landing's CSS can't change the app's
//   screens, and the app's CSS can't change the landing.
// - Its markup and CSS are plain files (landing/landing.html, landing/landing.css) loaded as text.
//   That's safe because they are our own files, never user input.
export default function LandingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const hostElement = useRef(null);

  useEffect(function () {
    const host = hostElement.current;
    if (!host) {
      return;
    }
    // React runs effects twice in development, so reuse the box if it already exists.
    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: "open" });
    }
    shadow.innerHTML = "<style>" + landingCss + "</style>" + landingHtml;
    startLandingDeck(shadow);

    // Links inside the box: "#features" scrolls, "/login" changes screen without a page reload.
    function handleClick(event) {
      const link = event.target.closest("a");
      if (!link) {
        return;
      }
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        event.preventDefault();
        const target = shadow.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      } else if (href.startsWith("/")) {
        event.preventDefault();
        navigate(href);
      }
    }
    shadow.addEventListener("click", handleClick);
    return function () {
      shadow.removeEventListener("click", handleClick);
    };
  }, []);

  if (auth.isLoggedIn) {
    return <Navigate to="/jobs" replace />;
  }
  return <div ref={hostElement}></div>;
}
