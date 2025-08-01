import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/error-boundary";
import "./index.css";
import "./styles/design-system/animations.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
