import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { clientErrorLogger } from "./lib/errorLogger";
import { FrontendErrorCatcher } from "./services/globalErrorCatcher";
import { SocketProvider } from "./hooks/useWebSocketState";
import "./index.css";

// Initialize client-side error logging
clientErrorLogger.setup();

// Initialize additional global error catching
FrontendErrorCatcher.init();

// Initialize new local Sentry-style error tracking
import { installGlobalErrorHandlers } from "./lib/errorTracking";
installGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </SocketProvider>
);