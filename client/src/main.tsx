import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
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

createRoot(document.getElementById("root")!).render(<AuthProvider><App /></AuthProvider>);
