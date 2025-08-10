import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { clientErrorLogger } from "./lib/errorLogger";
import "./index.css";

// Initialize client-side error logging
clientErrorLogger.setup();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);