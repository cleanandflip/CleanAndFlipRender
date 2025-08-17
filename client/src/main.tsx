import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { SocketProvider } from "./hooks/useWebSocketState";
import "./index.css";

// ALL ERROR TRACKING COMPLETELY REMOVED

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </SocketProvider>
);