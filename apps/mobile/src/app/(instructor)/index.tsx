import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import {
  canAccessMobileRoute,
  hasPermission,
} from "../../authorization/routeAccess";
import {
  AppPage,
  MadaCard,
  MessageCard,
  PrimaryButton,
} from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { RouteGuard } from "../../components/RouteGuard";
import { useAssignedSessions } from "../../features/sessions/useAssignedSessions";
import { canWriteEvaluations } from "../../features/sessions/sessionAccess";
import { mada } from "../../theme/tokens";

function InstructorHome() {
  const { identity } = useAuth();
  const router = useRouter();
  const { sessions, loading, error, refresh, asOf } = useAssignedSessions();
  const now = asOf;
  const prioritySession = useMemo(() => {
    const eligible = sessions.filter(
      session => session.status.toUpperCase() !== "CANCELLED"
    );
    return (
      eligible.find(
        session =>
          Date.parse(session.startAt) <= now && Date.parse(session.endAt) >= now
      ) ??
      eligible.find(session => Date.parse(session.startAt) > now) ??
      [...eligible].reverse()[0] ??
      null
    );
  }, [now, sessions]);
  if (!identity) return null;

  const name = identity.user?.displayName?.trim() || "المدرب";
  const initial = [...name][0] ?? "م";
  const assignedForPriority = prioritySession
    ? canWriteEvaluations(identity, prioritySession)
    : false;
  const priorityEnded = prioritySession
    ? Date.parse(prioritySession.endAt) < now
    : false;
  const priorityTitle = prioritySession
    ? prioritySession.courseName?.trim() ||
      `الجلسة ${prioritySession.sessionNumber}`
    : null;

  const openPriority = () => {
    if (!prioritySession) {
      router.push("/(instructor)/schedule");
      return;
    }
    if (
      priorityEnded &&
      assignedForPriority &&
      hasPermission(identity, "evaluations.write")
    ) {
      router.push({
        pathname: "/(instructor)/evaluations",
        params: { sessionId: prioritySession.id },
      });
      return;
    }
    if (canAccessMobileRoute(identity, "attendance")) {
      router.push({
        pathname: "/(instructor)/attendance",
        params: { sessionId: prioritySession.id },
      });
    } else {
      router.push("/(instructor)/schedule");
    }
  };

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  return (
    <AppPage contentStyle={styles.page}>
      <View style={styles.topRow}>
        <View style={styles.brand} accessibilityLabel="مدى">
          <View style={styles.brandMark}>
            <Text family="latin" style={styles.brandMarkText}>
              M
            </Text>
          </View>
          <Text style={styles.brandText}>مدى</Text>
        </View>
        <View style={styles.topActions}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {identity.roleLabel ?? "المدرب"}
            </Text>
          </View>
          <View style={styles.avatar} accessibilityLabel={`حساب ${name}`}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
      </View>

      <View style={styles.greeting}>
        <Text accessibilityRole="header" style={styles.greetingTitle}>
          أهلًا، {name}
        </Text>
        <Text style={styles.greetingSubtitle}>
          أولوية يومك من الجلسات المسندة فعليًا
        </Text>
      </View>

      <MadaCard style={styles.priorityCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>مهمتك الآن</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {loading ? "جارٍ التحديث" : "بيانات الخادم"}
            </Text>
          </View>
        </View>
        {loading ? (
          <MessageCard
            title="جارٍ تحميل الجلسات"
            detail="يتم جلب الجلسات المسندة دون بيانات تجريبية."
          />
        ) : error ? (
          <MessageCard
            title="تعذر تحميل الأولوية"
            detail={error}
            tone="error"
            action={
              <PrimaryButton
                title="إعادة المحاولة"
                onPress={() => void refresh()}
                secondary
              />
            }
          />
        ) : prioritySession ? (
          <>
            <Text style={styles.priorityTitle}>{priorityTitle}</Text>
            <Text style={styles.bodyCopy}>
              {formatTime(prioritySession.startAt)}
            </Text>
            {prioritySession.classroomName ? (
              <Text style={styles.bodyCopy}>
                المكان: {prioritySession.classroomName}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                priorityEnded ? "فتح تقييمات الجلسة" : "فتح حضور الجلسة"
              }
              onPress={openPriority}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryActionText}>
                {priorityEnded && assignedForPriority
                  ? "فتح التقييمات"
                  : "فتح الحضور"}
              </Text>
              <Text
                family="latin"
                style={styles.actionArrow}
                accessible={false}
              >
                ‹
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.priorityTitle}>لا توجد جلسات قريبة</Text>
            <Text style={styles.bodyCopy}>
              لم يُرجع الخادم جلسة مسندة خلال الفترة الحالية.
            </Text>
            {canAccessMobileRoute(identity, "schedule") ? (
              <PrimaryButton
                title="عرض الجدول"
                onPress={() => router.push("/(instructor)/schedule")}
              />
            ) : null}
          </>
        )}
      </MadaCard>

      <View style={styles.nextSection}>
        <Text style={styles.sectionTitle}>إجراءات الجلسات</Text>
        <MadaCard style={styles.nextCard}>
          <View style={styles.nextIcon} accessible={false}>
            <Text style={styles.nextIconText}>✓</Text>
          </View>
          <View style={styles.nextCopy}>
            <Text style={styles.nextTitle}>الحضور والتقييم</Text>
            <Text style={styles.nextDescription}>
              افتح قائمة الجلسات المسندة للوصول إلى الإجراء المناسب. الحالات لا
              تُوسم كمستحقة قبل تأكيدها من الخادم.
            </Text>
          </View>
          {canAccessMobileRoute(identity, "tasks") ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عرض إجراءات الجلسات"
              onPress={() => router.push("/(instructor)/tasks")}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryActionText}>عرض</Text>
            </Pressable>
          ) : null}
        </MadaCard>
      </View>

      <View style={styles.updateNote}>
        <Text style={styles.updateTitle}>التحديثات</Text>
        <Text style={styles.updateCopy}>
          لا يظهر التطبيق تنبيهًا أو عددًا إلا بعد ربط مصدر إشعارات مؤكد؛
          الإشعارات ليست بديلًا عن قائمة المهام.
        </Text>
      </View>
    </AppPage>
  );
}

export default function InstructorHomeRoute() {
  return (
    <RouteGuard route="home">
      <InstructorHome />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  page: { gap: mada.space.lg, paddingTop: mada.space.md },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: mada.space.sm },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: mada.radius.small,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.tealSoft,
  },
  brandMarkText: { color: mada.color.teal, fontSize: 21, fontWeight: "800" },
  brandText: { color: mada.color.navy, fontSize: 21, fontWeight: "800" },
  topActions: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  rolePill: {
    paddingHorizontal: mada.space.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: mada.color.tealSoft,
  },
  rolePillText: {
    color: mada.color.tealDark,
    fontSize: mada.type.caption,
    fontWeight: "700",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2F8",
  },
  avatarText: { color: mada.color.navy, fontSize: 18, fontWeight: "700" },
  greeting: { alignItems: "flex-end", gap: 2, paddingVertical: 4 },
  greetingTitle: {
    color: mada.color.navy,
    fontSize: 25,
    lineHeight: 36,
    fontWeight: "800",
    textAlign: "right",
  },
  greetingSubtitle: {
    color: mada.color.muted,
    fontSize: mada.type.body,
    lineHeight: 24,
    textAlign: "right",
  },
  priorityCard: {
    borderColor: "#D4EBE6",
    backgroundColor: mada.color.surface,
    padding: mada.space.lg,
    gap: mada.space.md,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: mada.space.sm,
  },
  sectionLabel: { color: mada.color.muted, fontSize: mada.type.caption },
  statusPill: {
    paddingHorizontal: mada.space.sm,
    paddingVertical: mada.space.xs,
    borderRadius: 999,
    backgroundColor: mada.color.tealSoft,
  },
  statusText: { color: mada.color.tealDark, fontSize: 11, fontWeight: "700" },
  priorityTitle: {
    color: mada.color.navy,
    fontSize: 22,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "right",
  },
  bodyCopy: {
    color: mada.color.muted,
    fontSize: mada.type.body,
    lineHeight: 25,
    textAlign: "right",
  },
  primaryAction: {
    minHeight: 54,
    paddingHorizontal: mada.space.lg,
    borderRadius: mada.radius.large,
    backgroundColor: mada.color.teal,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryActionText: {
    color: mada.color.surface,
    fontSize: mada.type.body,
    fontWeight: "800",
  },
  actionArrow: { color: mada.color.surface, fontSize: 28, fontWeight: "700" },
  nextSection: { gap: mada.space.sm },
  sectionTitle: {
    color: mada.color.navy,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right",
  },
  nextCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: mada.space.md,
    padding: mada.space.md,
  },
  nextIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.tealSoft,
  },
  nextIconText: { color: mada.color.teal, fontSize: 23, fontWeight: "700" },
  nextCopy: { flex: 1, gap: 3, alignItems: "flex-end" },
  nextTitle: { color: mada.color.navy, fontSize: 16, fontWeight: "700" },
  nextDescription: {
    color: mada.color.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "right",
  },
  secondaryAction: {
    minHeight: 44,
    paddingHorizontal: mada.space.md,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: mada.color.tealDark,
    fontSize: 13,
    fontWeight: "700",
  },
  updateNote: { gap: mada.space.xs, paddingHorizontal: 2 },
  updateTitle: {
    color: mada.color.navy,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  updateCopy: {
    color: mada.color.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
  },
  pressed: { opacity: 0.82 },
});
