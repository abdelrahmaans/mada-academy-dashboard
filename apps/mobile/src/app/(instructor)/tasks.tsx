import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import {
  canAccessMobileRoute,
  hasPermission,
} from "../../authorization/routeAccess";
import { AppPage, PageHeading } from "../../components/AppUi";
import { RouteGuard } from "../../components/RouteGuard";
import { SessionCard } from "../../features/sessions/SessionCard";
import { SessionListState } from "../../features/sessions/SessionListState";
import { canWriteEvaluations } from "../../features/sessions/sessionAccess";
import { useAssignedSessions } from "../../features/sessions/useAssignedSessions";

function TasksScreen() {
  const { sessions, loading, error, refresh, asOf } = useAssignedSessions();
  const { identity } = useAuth();
  const router = useRouter();
  const now = asOf;
  const upcoming = useMemo(
    () =>
      sessions.filter(
        session =>
          session.status.toUpperCase() !== "CANCELLED" &&
          session.status.toUpperCase() !== "COMPLETED" &&
          (Date.parse(session.endAt) >= now ||
            session.status.toUpperCase() === "IN_PROGRESS")
      ),
    [now, sessions]
  );
  const past = useMemo(
    () =>
      sessions.filter(
        session =>
          session.status.toUpperCase() !== "CANCELLED" &&
          (Date.parse(session.endAt) < now ||
            session.status.toUpperCase() === "COMPLETED")
      ),
    [now, sessions]
  );

  const buildCard = (session: (typeof sessions)[number]) => {
    const actions = [];
    if (identity && canAccessMobileRoute(identity, "attendance")) {
      actions.push({
        title: "الحضور",
        accessibilityLabel: `فتح حضور ${session.courseName ?? `الجلسة ${session.sessionNumber}`}`,
        onPress: () =>
          router.push({
            pathname: "/(instructor)/attendance",
            params: { sessionId: session.id },
          }),
      });
    }
    if (
      identity &&
      hasPermission(identity, "evaluations.write") &&
      canWriteEvaluations(identity, session)
    ) {
      actions.push({
        title: "فتح التقييمات",
        accessibilityLabel: `فتح تقييمات ${session.courseName ?? `الجلسة ${session.sessionNumber}`}`,
        onPress: () =>
          router.push({
            pathname: "/(instructor)/evaluations",
            params: { sessionId: session.id },
          }),
        secondary: true,
      });
    }
    return <SessionCard key={session.id} session={session} actions={actions} />;
  };

  return (
    <AppPage>
      <PageHeading
        eyebrow="جلساتك والإجراءات المتاحة"
        title="المهام"
        subtitle="الجلسات من API المسند إليك. نعرض الحضور والتقييم حسب الإسناد والصلاحية، ولا نخترع حالة (مطلوب) دون تأكيد من الخادم."
      />
      <SessionListState
        loading={loading}
        error={error}
        empty={!sessions.length}
        onRetry={() => void refresh()}
      />
      {!loading && !error ? (
        <>
          {upcoming.length ? (
            <>
              <PageHeading title="الجلسات القادمة" />
              {upcoming.map(buildCard)}
            </>
          ) : null}
          {past.length ? (
            <>
              <PageHeading title="الجلسات السابقة" />
              {past.map(buildCard)}
            </>
          ) : null}
          {!upcoming.length && !past.length && sessions.length ? (
            <PageHeading title="لا توجد إجراءات في الفترة الحالية" />
          ) : null}
        </>
      ) : null}
    </AppPage>
  );
}

export default function InstructorTasksRoute() {
  return (
    <RouteGuard route="tasks">
      <TasksScreen />
    </RouteGuard>
  );
}
