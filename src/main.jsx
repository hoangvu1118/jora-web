import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { TailorQueueProvider } from "./tailor/TailorQueue";
import App from "./App";
import "./styles/base.css";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TailorQueueProvider>
          <App />
        </TailorQueueProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
