import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { inject } from "@vercel/analytics"

inject()
import "./styles/globals.css";
import "./styles/utilities.css";
import "./styles/tnu-hub.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "TNU Hub Service Worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "TNU Hub Service Worker registration failed:",
          error
        );
      });
  });
}