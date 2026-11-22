import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
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
function handleStaleChunk() {
  const key = "mada_chunk_reload";
  const lastReload = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - lastReload > 8000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
}

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  handleStaleChunk();
});

window.addEventListener("unhandledrejection", (event) => {
  const message = String(event.reason?.message || event.reason || "");
  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Importing a module script failed")
  ) {
    event.preventDefault();
    handleStaleChunk();
  }
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element '#root' not found");
}

createRoot(rootEl).render(
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
);
