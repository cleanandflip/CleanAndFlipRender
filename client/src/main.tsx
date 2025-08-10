import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { clientErrorLogger } from "./lib/errorLogger";
import { FrontendErrorCatcher } from "./services/globalErrorCatcher";
import "./index.css";

// Initialize client-side error logging
clientErrorLogger.setup();

// Initialize additional global error catching
FrontendErrorCatcher.init();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);