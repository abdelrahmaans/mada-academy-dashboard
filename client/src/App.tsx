import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
const Home = lazy(() => import("./pages/Home"));
const Students = lazy(() => import("./pages/Students"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Classes = lazy(() => import("./pages/Classes"));
const Finance = lazy(() => import("./pages/Finance"));
const Team = lazy(() => import("./pages/Team"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Reports = lazy(() => import("./pages/Reports"));
const Instructor = lazy(() => import("./pages/Instructor"));
const Secretary = lazy(() => import("./pages/Secretary"));
const HeadInstructors = lazy(() => import("./pages/HeadInstructors"));
const AcademyOwner = lazy(() => import("./pages/AcademyOwner"));
function Router() {
  return (
    <Suspense
      fallback={<div className="route-loading">جارٍ تحميل الصفحة…</div>}
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/students"} component={Students} />
        <Route path={"/schedule"} component={Schedule} />
        <Route path={"/classes"} component={Classes} />
        <Route path={"/finance"} component={Finance} />
        <Route path={"/team"} component={Team} />
        <Route path={"/approvals"} component={Approvals} />
        <Route path={"/reports"} component={Reports} />
        <Route path={"/instructor"} component={Instructor} />
        <Route path={"/secretary"} component={Secretary} />
        <Route path={"/head-instructors"} component={HeadInstructors} />
        <Route path={"/academy-owner"} component={AcademyOwner} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
