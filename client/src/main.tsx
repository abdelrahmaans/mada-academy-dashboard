import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import "./components/MadaTheme.css";

createRoot(document.getElementById("root")!).render(<AuthProvider><App /></AuthProvider>);
