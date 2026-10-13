import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { canAccessMobileRoute } from "../../authorization/routeAccess";
import { AppPage, PageHeading } from "../../components/AppUi";
import { RouteGuard } from "../../components/RouteGuard";
import { SessionCard } from "../../features/sessions/SessionCard";
import { SessionListState } from "../../features/sessions/SessionListState";
import { useAssignedSessions } from "../../features/sessions/useAssignedSessions";
import { canWriteEvaluations } from "../../features/sessions/sessionAccess";

function ScheduleScreen() {
  const { sessions, loading, error, refresh } = useAssignedSessions();
  const { identity } = useAuth();
  const router = useRouter();

  return (
    <AppPage>
      <PageHeading
        eyebrow="الجلسات المسندة إليك"
        title="الجدول"
        subtitle="بيانات الجلسات تُحمّل مباشرة من الخادم، ويُعاد تحديثها عند الرجوع إلى الشاشة."
      />
      <SessionListState
        loading={loading}
        error={error}
        empty={!sessions.length}
        onRetry={() => void refresh()}
      />
      {!loading && !error
        ? sessions.map(session => {
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
            if (identity && canWriteEvaluations(identity, session)) {
              actions.push({
                title: "التقييمات",
                accessibilityLabel: `فتح تقييمات ${session.courseName ?? `الجلسة ${session.sessionNumber}`}`,
                onPress: () =>
                  router.push({
                    pathname: "/(instructor)/evaluations",
                    params: { sessionId: session.id },
                  }),
                secondary: true,
              });
            }
            return (
              <SessionCard
                key={session.id}
                session={session}
                actions={actions}
              />
            );
          })
        : null}
    </AppPage>
  );
}

export default function InstructorScheduleRoute() {
  return (
    <RouteGuard route="schedule">
      <ScheduleScreen />
    </RouteGuard>
  );
}
