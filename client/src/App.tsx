import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Redirect, Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { subscribeApiErrors } from "./lib/apiClient";

const Home = lazy(() => import("./pages/Home"));
const Students = lazy(() => import("./pages/Students"));
const Classes = lazy(() => import("./pages/Classes"));
const Schedule = lazy(() => import("./pages/Schedule"));
const SecretaryDesk = lazy(() => import("./pages/SecretaryDesk"));
const FinanceDesk = lazy(() => import("./pages/FinanceDesk"));
const MarketingDesk = lazy(() => import("./pages/MarketingDesk"));
const Team = lazy(() => import("./pages/Team"));
const BranchOperations = lazy(() => import("./pages/BranchOperations"));
const SupervisionAssignments = lazy(() => import("./pages/SupervisionAssignments"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Reports = lazy(() => import("./pages/Reports"));
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

function Guard({ children, roles, permission }: { children: ReactNode; roles?: string[]; permission?: string }) {
  return <ProtectedRoute roles={roles} permission={permission}>{children}</ProtectedRoute>;
}

const APP_ROUTES = [
  ["/login", Login],
  ["/accept-invitation", ConsumerInvitationAccept],
  ["/workspace", () => <Guard><WorkspaceHub /></Guard>],
  ["/platform/academies/new", ProtectedAcademyBootstrap],
  ["/academy/roles", ProtectedAcademyRoles],
  ["/academy/branches", ProtectedAcademyBranches],
  ["/academy/classrooms", ProtectedAcademyClassrooms],
  ["/", () => <Guard roles={["R02_BRANCH_MANAGER"]}><Home /></Guard>],
  ["/students", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R05_SECRETARY"]}><Students /></Guard>],
  ["/classes", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS"]}><Classes /></Guard>],
  ["/schedule", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]}><Schedule /></Guard>],
  ["/secretary", () => <Guard roles={["R05_SECRETARY"]}><Redirect to="/secretary-desk" /></Guard>],
  ["/secretary-desk", () => <Guard roles={["R05_SECRETARY"]}><SecretaryDesk /></Guard>],
  ["/finance", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]}><FinanceRedirect /></Guard>],
  ["/finance-desk", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]}><FinanceDesk /></Guard>],
  ["/marketing-desk", () => <Guard roles={["R07_MEDIA_MANAGER"]} permission="marketing.read"><MarketingDesk /></Guard>],
  ["/team", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS"]}><Team /></Guard>],
  ["/branch-operations", () => <Guard roles={["R02_BRANCH_MANAGER"]}><BranchOperations /></Guard>],
  ["/supervision-assignments", () => <Guard roles={["R02_BRANCH_MANAGER"]}><SupervisionAssignments /></Guard>],
  ["/approvals", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R05_SECRETARY", "R06_ACCOUNTANT"]}><Approvals /></Guard>],
  ["/reports", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R06_ACCOUNTANT"]}><Reports /></Guard>],
  ["/instructor", () => <Guard roles={["R04_INSTRUCTOR"]}><Redirect to="/instructor-desk" /></Guard>],
  ["/instructor-desk", () => <Guard roles={["R04_INSTRUCTOR"]}><InstructorDesk /></Guard>],
  ["/head-instructors", () => <Guard roles={["R03_HEAD_INSTRUCTORS"]}><HeadInstructors /></Guard>],
  ["/academic-programs", () => <Guard roles={["R03_HEAD_INSTRUCTORS"]}><AcademicPrograms /></Guard>],
  ["/academy-owner", () => <Guard roles={["R01_ACADEMY_OWNER"]}><AcademyOwner /></Guard>],
  ["/academy-owner/branches", () => <Guard roles={["R01_ACADEMY_OWNER"]}><AcademyOwner /></Guard>],
  ["/academy-owner/tickets", () => <Guard roles={["R01_ACADEMY_OWNER"]}><AcademyOwner /></Guard>],
  ["/academy-owner/reports", () => <Guard roles={["R01_ACADEMY_OWNER"]}><AcademyOwner /></Guard>],
  ["/executive-dashboard", () => <Guard roles={["R01_ACADEMY_OWNER"]}><ExecutiveDashboard /></Guard>],
  ["/platform-console", () => <Guard roles={["R00_PLATFORM_ADMIN"]}><PlatformConsole /></Guard>],
  ["/family-portal", () => <Guard roles={["R08_PARENT"]}><FamilyPortal /></Guard>],
  ["/student-portal", () => <Guard roles={["R09_STUDENT"]}><StudentPortal /></Guard>],
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

function ApiFeedbackBridge() {
  useEffect(() => subscribeApiErrors(({ error, path }) => {
    if (path.startsWith("/auth/") || path.startsWith("/consumer-invitations/")) return;
    if (error.status === 401) {
      toast.error("انتهت جلسة الدخول، سجّل الدخول مرة أخرى.", { id: "mada-session-expired" });
    } else if (error.status === 403) {
      toast.error("ليس لديك صلاحية لتنفيذ هذا الإجراء.", { id: "mada-api-forbidden" });
    } else if (error.status >= 500) {
      toast.error("حدث خطأ في الخادم، حاول مرة أخرى.", { id: "mada-api-server-error" });
    }
  }), []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ApiFeedbackBridge />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
