import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./components/MadaTheme.css";
import { AuthProvider } from "./contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
