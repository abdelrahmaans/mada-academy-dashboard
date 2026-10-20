import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Redirect, Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { ROLE_DEFINITIONS } from "./lib/roleNavigation";
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
const AcademyAuditTrail = lazy(() => import("./pages/AcademyAuditTrail"));
const Competitions = lazy(() => import("./pages/CompetitionsLive"));

function FinanceRedirect() {
  return <Redirect to="/finance-desk" />;
}

function ProtectedAcademyBootstrap() {
  return <ProtectedRoute roles={["R00_PLATFORM_ADMIN"]}><AcademyBootstrap /></ProtectedRoute>;
}

function ProtectedAcademyRoles() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} anyOfPermissions={["roles.read", "roles.manage"]}><AcademyRoles /></ProtectedRoute>;
}

function ProtectedAcademyBranches() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} anyOfPermissions={["branch.read", "branch.create"]}><AcademyBranches /></ProtectedRoute>;
}

function ProtectedAcademyClassrooms() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} permission="classrooms.manage"><AcademyClassrooms /></ProtectedRoute>;
}

function ProtectedAcademyAuditTrail() {
  return <ProtectedRoute roles={["R01_ACADEMY_OWNER"]} permission="reports.read"><AcademyAuditTrail /></ProtectedRoute>;
}

function Guard({
  children,
  roles,
  permission,
  anyOfPermissions,
}: {
  children: ReactNode;
  roles?: readonly string[] | string[];
  permission?: string;
  anyOfPermissions?: readonly string[] | string[];
}) {
  return <ProtectedRoute roles={roles} permission={permission} anyOfPermissions={anyOfPermissions}>{children}</ProtectedRoute>;
}

function SmartRoleHome() {
  const { me, loading } = useAuth();
  if (loading) return <div className="route-loading">جارٍ التحقق من الجلسة…</div>;
  if (!me) return <Redirect to="/login" />;
  const normalizedRole = me.role.match(/^R\d+/)?.[0] ?? me.role;
  const roleDefinition = ROLE_DEFINITIONS[normalizedRole as keyof typeof ROLE_DEFINITIONS];
  const homePath = roleDefinition?.homePath ?? "/workspace";

  if (homePath === "/") {
    return (
      <Guard roles={["R02_BRANCH_MANAGER"]} permission="branch.read">
        <Home />
      </Guard>
    );
  }
  return <Redirect to={homePath} />;
}

const APP_ROUTES = [
  ["/login", Login],
  ["/accept-invitation", ConsumerInvitationAccept],
  ["/workspace", () => <Guard><WorkspaceHub /></Guard>],
  ["/platform/academies/new", ProtectedAcademyBootstrap],
  ["/academy/roles", ProtectedAcademyRoles],
  ["/academy/branches", ProtectedAcademyBranches],
  ["/academy/classrooms", ProtectedAcademyClassrooms],
  ["/academy/audit-trail", ProtectedAcademyAuditTrail],
  ["/", SmartRoleHome],
  ["/students", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R05_SECRETARY"]} anyOfPermissions={["students.read", "students.create"]}><Students /></Guard>],
  ["/classes", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS"]} permission="sessions.read"><Classes /></Guard>],
  ["/schedule", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]} anyOfPermissions={["sessions.read", "sessions.assigned.read"]}><Schedule /></Guard>],
  ["/secretary", () => <Guard roles={["R05_SECRETARY"]}><Redirect to="/secretary-desk" /></Guard>],
  ["/secretary-desk", () => <Guard roles={["R05_SECRETARY"]} permission="branch.read"><SecretaryDesk /></Guard>],
  ["/finance", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]}><FinanceRedirect /></Guard>],
  ["/finance-desk", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]} anyOfPermissions={["finance.read", "invoices.read", "payments.create", "finance.expenses.read"]}><FinanceDesk /></Guard>],
  ["/marketing-desk", () => <Guard roles={["R07_MEDIA_MANAGER"]} permission="marketing.read"><MarketingDesk /></Guard>],
  ["/team", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS"]} anyOfPermissions={["staff.read", "branch.read"]}><Team /></Guard>],
  ["/branch-operations", () => <Guard roles={["R02_BRANCH_MANAGER"]} permission="branch.read"><BranchOperations /></Guard>],
  ["/supervision-assignments", () => <Guard roles={["R02_BRANCH_MANAGER"]} permission="branch.read"><SupervisionAssignments /></Guard>],
  ["/approvals", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R05_SECRETARY", "R06_ACCOUNTANT"]} anyOfPermissions={["sessions.create", "evaluations.review", "finance.expenses.approve"]}><Approvals /></Guard>],
  ["/reports", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R06_ACCOUNTANT"]} anyOfPermissions={["reports.read", "finance.summary.read"]}><Reports /></Guard>],
  ["/competitions", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]}><Competitions /></Guard>],
  ["/instructor", () => <Guard roles={["R04_INSTRUCTOR"]}><Redirect to="/instructor-desk" /></Guard>],
  ["/instructor-desk", () => <Guard roles={["R04_INSTRUCTOR"]} anyOfPermissions={["sessions.assigned.read", "attendance.write", "evaluations.write"]}><InstructorDesk /></Guard>],
  ["/head-instructors", () => <Guard roles={["R03_HEAD_INSTRUCTORS"]} permission="branch.read"><HeadInstructors /></Guard>],
  ["/academic-programs", () => <Guard roles={["R03_HEAD_INSTRUCTORS"]} permission="branch.read"><AcademicPrograms /></Guard>],
  ["/academy-owner", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="academy.read"><AcademyOwner /></Guard>],
  ["/academy-owner/branches", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="branch.read"><AcademyOwner /></Guard>],
  ["/academy-owner/tickets", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="academy.read"><AcademyOwner /></Guard>],
  ["/academy-owner/reports", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="reports.read"><AcademyOwner /></Guard>],
  ["/academy-owner/pnl-retention", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="reports.read"><AcademyOwner /></Guard>],
  ["/executive-dashboard", () => <Guard roles={["R01_ACADEMY_OWNER"]} permission="academy.read"><ExecutiveDashboard /></Guard>],
  ["/platform-console", () => <Guard roles={["R00_PLATFORM_ADMIN"]} permission="platform.read"><PlatformConsole /></Guard>],
  ["/family-portal", () => <Guard roles={["R08_PARENT"]} permission="consumer.students.read"><FamilyPortal /></Guard>],
  ["/student-portal", () => <Guard roles={["R09_STUDENT"]} permission="consumer.self.read"><StudentPortal /></Guard>],
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
    if (error.status === 0) {
      toast.error("تعذر الاتصال بالخادم. تأكد من تشغيل الـ Backend (pnpm backend:dev).", { id: "mada-api-offline" });
    } else if (error.status === 401) {
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
