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
const Secretary = lazy(() => import("./pages/Secretary"));
const SecretaryDesk = lazy(() => import("./pages/SecretaryDesk"));
const Finance = lazy(() => import("./pages/Finance"));
const FinanceDesk = lazy(() => import("./pages/FinanceDesk"));
const Team = lazy(() => import("./pages/Team"));
const BranchOperations = lazy(() => import("./pages/BranchOperations"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Reports = lazy(() => import("./pages/Reports"));
const Instructor = lazy(() => import("./pages/Instructor"));
const InstructorDesk = lazy(() => import("./pages/InstructorDesk"));
const HeadInstructors = lazy(() => import("./pages/HeadInstructors"));
const AcademicPrograms = lazy(() => import("./pages/AcademicPrograms"));
const AcademyOwner = lazy(() => import("./pages/AcademyOwner"));
const PlatformConsole = lazy(() => import("./pages/PlatformConsole"));
function Router() {
  return (
    <Suspense
      fallback={<div className="route-loading">جارٍ تحميل الصفحة…</div>}
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/students"} component={Students} />
        <Route path={"/schedule"} component={Schedule} />
        <Route path={"/secretary"} component={Secretary} />
        <Route path={"/secretary-desk"} component={SecretaryDesk} />
        <Route path={"/finance"} component={Finance} />
        <Route path={"/finance-desk"} component={FinanceDesk} />
        <Route path={"/team"} component={Team} />
        <Route path={"/branch-operations"} component={BranchOperations} />
        <Route path={"/approvals"} component={Approvals} />
        <Route path={"/reports"} component={Reports} />
        <Route path={"/instructor"} component={Instructor} />
        <Route path={"/instructor-desk"} component={InstructorDesk} />
        <Route path={"/secretary"} component={Secretary} />
        <Route path={"/head-instructors"} component={HeadInstructors} />
        <Route path={"/academic-programs"} component={AcademicPrograms} />
        <Route path={"/academy-owner"} component={AcademyOwner} />
        <Route path={"/platform-console"} component={PlatformConsole} />
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
