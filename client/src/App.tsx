import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Redirect, Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Students = lazy(() => import("./pages/Students"));
const Classes = lazy(() => import("./pages/Classes"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Secretary = lazy(() => import("./pages/Secretary"));
const SecretaryDesk = lazy(() => import("./pages/SecretaryDesk"));
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
const AcademyBootstrap = lazy(() => import("./pages/AcademyBootstrap"));
const Login = lazy(() => import("./pages/Login"));
const ConsumerInvitationAccept = lazy(() => import("./pages/ConsumerInvitationAccept"));
const AcademyRoles = lazy(() => import("./pages/AcademyRoles"));
const AcademyBranches = lazy(() => import("./pages/AcademyBranches"));
const AcademyClassrooms = lazy(() => import("./pages/AcademyClassrooms"));

function FinanceRedirect() {
  return <Redirect to="/finance-desk" />;
}

function ProtectedAcademyBootstrap() {
  return <ProtectedRoute roles={["R00_PLATFORM_ADMIN"]}><AcademyBootstrap /></ProtectedRoute>;
}

function ProtectedAcademyRoles() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} permission="roles.manage"><AcademyRoles /></ProtectedRoute>;
}

function ProtectedAcademyBranches() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} permission="branch.create"><AcademyBranches /></ProtectedRoute>;
}

function ProtectedAcademyClassrooms() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} permission="classrooms.manage"><AcademyClassrooms /></ProtectedRoute>;
}

const APP_ROUTES = [
  ["/login", Login],
  ["/accept-invitation", ConsumerInvitationAccept],
  ["/workspace", WorkspaceHub],
  ["/platform/academies/new", ProtectedAcademyBootstrap],
  ["/academy/roles", ProtectedAcademyRoles],
  ["/academy/branches", ProtectedAcademyBranches],
  ["/academy/classrooms", ProtectedAcademyClassrooms],
  ["/", Home],
  ["/students", Students],
  ["/classes", Classes],
  ["/schedule", Schedule],
  ["/secretary", Secretary],
  ["/secretary-desk", SecretaryDesk],
  ["/finance", FinanceRedirect],
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
    <Suspense fallback={<div className="route-loading">جارٍ تحميل الصفحة…</div>}>
      <WouterRouter base={basePath}>
        <Switch>
          {APP_ROUTES.map(([path, component]) => <Route key={path} path={path} component={component} />)}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
