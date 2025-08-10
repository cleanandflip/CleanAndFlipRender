import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal test component to check if React mounting works
function TestApp() {
  return (
    <div style={{ 
      backgroundColor: "#1a1a1a", 
      color: "white", 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      fontSize: "24px"
    }}>
      <div>
        <h1>✅ React App is Working!</h1>
        <p>Clean & Flip - Debug Test</p>
        <button 
          onClick={() => console.log("Button clicked!")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);