import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
const Home = lazy(() => import("./pages/Home"));
const Students = lazy(() => import("./pages/Students"));
const Classes = lazy(() => import("./pages/Classes"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Secretary = lazy(() => import("./pages/Secretary"));
const SecretaryDesk = lazy(() => import("./pages/SecretaryDesk"));
const Finance = lazy(() => import("./pages/Finance"));
const FinanceDesk = lazy(() => import("./pages/FinanceDesk"));
const MarketingDesk = lazy(() => import("./pages/MarketingDesk"));
const Team = lazy(() => import("./pages/Team"));
const BranchOperations = lazy(() => import("./pages/BranchOperations"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Reports = lazy(() => import("./pages/Reports"));
const Instructor = lazy(() => import("./pages/Instructor"));
const InstructorDesk = lazy(() => import("./pages/InstructorDesk"));
const HeadInstructors = lazy(() => import("./pages/HeadInstructors"));
const AcademicPrograms = lazy(() => import("./pages/AcademicPrograms"));
const AcademyOwner = lazy(() => import("./pages/AcademyOwner"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const PlatformConsole = lazy(() => import("./pages/PlatformConsole"));
const FamilyPortal = lazy(() => import("./pages/FamilyPortal"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const WorkspaceHub = lazy(() => import("./pages/WorkspaceHub"));

const APP_ROUTES = [
  ["/workspace", WorkspaceHub],
  ["/", Home],
  ["/students", Students],
  ["/classes", Classes],
  ["/schedule", Schedule],
  ["/secretary", Secretary],
  ["/secretary-desk", SecretaryDesk],
  ["/finance", Finance],
  ["/finance-desk", FinanceDesk],
  ["/marketing-desk", MarketingDesk],
  ["/team", Team],
  ["/branch-operations", BranchOperations],
  ["/approvals", Approvals],
  ["/reports", Reports],
  ["/instructor", Instructor],
  ["/instructor-desk", InstructorDesk],
  ["/head-instructors", HeadInstructors],
  ["/academic-programs", AcademicPrograms],
  ["/academy-owner", AcademyOwner],
  ["/executive-dashboard", ExecutiveDashboard],
  ["/platform-console", PlatformConsole],
  ["/family-portal", FamilyPortal],
  ["/student-portal", StudentPortal],
] as const;

function Router() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <Suspense
      fallback={<div className="route-loading">جارٍ تحميل الصفحة…</div>}
    >
      <WouterRouter base={basePath}>
        <Switch>
          {APP_ROUTES.map(([path, component]) => (
            <Route key={path} path={path} component={component} />
          ))}
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
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
