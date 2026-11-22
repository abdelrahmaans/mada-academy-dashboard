import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import "./components/RoleDateBadge.css";
import "./components/MadaTheme.css";
import "./styles/role-surfaces.css";

const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
if (analyticsEndpoint && analyticsWebsiteId) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = analyticsWebsiteId;
  document.head.appendChild(script);
}

// Auto-recover if a new build was deployed to Vercel and old chunks are missing
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const key = "mada_chunk_reload";
  const lastReload = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - lastReload > 8000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element '#root' not found");
}

createRoot(rootEl).render(<AuthProvider><App /></AuthProvider>);
