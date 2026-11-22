import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect, type ReactNode, type ComponentType } from "react";
import { Redirect, Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { ROLE_DEFINITIONS } from "./lib/roleNavigation";
import { subscribeApiErrors } from "./lib/apiClient";
import FloatingLanguageToggle from "./components/FloatingLanguageToggle";

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const hasRefreshed = sessionStorage.getItem("mada_chunk_refreshed") === "true";
    try {
      const mod = await factory();
      sessionStorage.setItem("mada_chunk_refreshed", "false");
      return mod;
    } catch (error) {
      if (!hasRefreshed) {
        sessionStorage.setItem("mada_chunk_refreshed", "true");
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }
      throw error;
    }
  });
}

const Home = lazyWithRetry(() => import("./pages/Home"));
const Students = lazyWithRetry(() => import("./pages/Students"));
const Classes = lazyWithRetry(() => import("./pages/Classes"));
const Schedule = lazyWithRetry(() => import("./pages/Schedule"));
const SecretaryDesk = lazyWithRetry(() => import("./pages/SecretaryDesk"));
const FinanceDesk = lazyWithRetry(() => import("./pages/FinanceDesk"));
const MarketingDesk = lazyWithRetry(() => import("./pages/MarketingDesk"));
const Team = lazyWithRetry(() => import("./pages/Team"));
const SupervisionAssignments = lazyWithRetry(() => import("./pages/SupervisionAssignments"));
const Approvals = lazyWithRetry(() => import("./pages/Approvals"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const InstructorDesk = lazyWithRetry(() => import("./pages/InstructorDesk"));
const HeadInstructors = lazyWithRetry(() => import("./pages/HeadInstructors"));
const AcademicPrograms = lazyWithRetry(() => import("./pages/AcademicPrograms"));
const AcademyOwner = lazyWithRetry(() => import("./pages/AcademyOwner"));
const ExecutiveDashboard = lazyWithRetry(() => import("./pages/ExecutiveDashboard"));
const PlatformConsole = lazyWithRetry(() => import("./pages/PlatformConsole"));
const FamilyPortal = lazyWithRetry(() => import("./pages/FamilyPortal"));
const StudentPortal = lazyWithRetry(() => import("./pages/StudentPortal"));
const CertificateVerify = lazyWithRetry(() => import("./pages/CertificateVerify"));
const WorkspaceHub = lazyWithRetry(() => import("./pages/WorkspaceHub"));
const AcademyBootstrap = lazyWithRetry(() => import("./pages/AcademyBootstrap"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const ChangePassword = lazyWithRetry(() => import("./pages/ChangePassword"));
const ConsumerInvitationAccept = lazyWithRetry(() => import("./pages/ConsumerInvitationAccept"));
const AcademyRoles = lazyWithRetry(() => import("./pages/AcademyRoles"));
const AcademyBranches = lazyWithRetry(() => import("./pages/AcademyBranches"));
const AcademyClassrooms = lazyWithRetry(() => import("./pages/AcademyClassrooms"));
const AcademyAuditTrail = lazyWithRetry(() => import("./pages/AcademyAuditTrail"));
const Competitions = lazyWithRetry(() => import("./pages/CompetitionsLive"));
const NurseryDesk = lazyWithRetry(() => import("./pages/NurseryDeskLive"));
const LobbyDisplay = lazyWithRetry(() => import("./pages/LobbyDisplay"));

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
  ["/change-password", () => <Guard><ChangePassword /></Guard>],
  ["/accept-invitation", ConsumerInvitationAccept],
  ["/workspace", () => <Guard><WorkspaceHub /></Guard>],
  ["/platform/academies/new", ProtectedAcademyBootstrap],
  ["/academy/roles", ProtectedAcademyRoles],
  ["/academy/branches", ProtectedAcademyBranches],
  ["/academy/classrooms", ProtectedAcademyClassrooms],
  ["/academy/audit-trail", ProtectedAcademyAuditTrail],
  ["/", SmartRoleHome],
  ["/students", () => <Guard roles={["R02_BRANCH_MANAGER", "R05_SECRETARY"]} anyOfPermissions={["students.read", "students.create"]}><Students /></Guard>],
  ["/classes", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R05_SECRETARY"]} anyOfPermissions={["sessions.read", "branch.read"]}><Classes /></Guard>],
  ["/schedule", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]} anyOfPermissions={["sessions.read", "sessions.assigned.read"]}><Schedule /></Guard>],
  ["/secretary", () => <Guard roles={["R05_SECRETARY"]}><Redirect to="/secretary-desk" /></Guard>],
  ["/secretary-desk", () => <Guard roles={["R05_SECRETARY"]} permission="branch.read"><SecretaryDesk /></Guard>],
  ["/finance", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]}><FinanceRedirect /></Guard>],
  ["/finance-desk", () => <Guard roles={["R05_SECRETARY", "R06_ACCOUNTANT"]} anyOfPermissions={["finance.read", "invoices.read", "payments.create", "finance.expenses.read"]}><FinanceDesk /></Guard>],
  ["/marketing-desk", () => <Guard roles={["R07_MEDIA_MANAGER"]} permission="marketing.read"><MarketingDesk /></Guard>],
  ["/team", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS"]} anyOfPermissions={["staff.read", "branch.read"]}><Team /></Guard>],
  ["/branch-operations", () => <Guard roles={["R02_BRANCH_MANAGER"]} permission="branch.read"><Redirect to="/schedule" /></Guard>],
  ["/supervision-assignments", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER"]} anyOfPermissions={["branch.read", "academy.read"]}><SupervisionAssignments /></Guard>],
  ["/approvals", () => <Guard roles={["R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R05_SECRETARY", "R06_ACCOUNTANT"]} anyOfPermissions={["sessions.create", "evaluations.review", "finance.expenses.approve"]}><Approvals /></Guard>],
  ["/reports", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R06_ACCOUNTANT"]} anyOfPermissions={["reports.read", "finance.summary.read"]}><Reports /></Guard>],
  ["/competitions", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]}><Competitions /></Guard>],
  ["/nursery-desk", () => <Guard roles={["R01_ACADEMY_OWNER", "R02_BRANCH_MANAGER", "R03_HEAD_INSTRUCTORS", "R04_INSTRUCTOR", "R05_SECRETARY"]}><NurseryDesk /></Guard>],
  ["/instructor", () => <Guard roles={["R04_INSTRUCTOR", "R03_HEAD_INSTRUCTORS"]}><Redirect to="/instructor-desk" /></Guard>],
  ["/instructor-desk", () => <Guard roles={["R04_INSTRUCTOR", "R03_HEAD_INSTRUCTORS"]} anyOfPermissions={["sessions.assigned.read", "attendance.write", "evaluations.write"]}><InstructorDesk /></Guard>],
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
          <Route path="/lobby-display" component={LobbyDisplay} />
          <Route path="/verify-certificate/:code" component={CertificateVerify} />
          <Route path="/verify-certificate" component={CertificateVerify} />
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
      const isMutation = path.includes("/create") || path.includes("/update") || path.includes("/delete") || path.includes("/approve") || path.includes("/reject") || path.includes("/handover");
      if (isMutation) {
        toast.error("تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالشبكة.", { id: "mada-api-offline" });
      }
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
