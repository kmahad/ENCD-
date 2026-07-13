import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import { ActivityProvider } from "./hooks/useActivity";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ActivityProvider>
      <App />
      <Analytics />
    </ActivityProvider>
  </StrictMode>
);
