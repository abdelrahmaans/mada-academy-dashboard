import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import {
  canAccessMobileRoute,
  hasPermission,
} from "../../authorization/routeAccess";
import { RouteGuard } from "../../components/RouteGuard";
import {
  AppPage,
  MadaCard,
  PageHeading,
  SmallLabel,
} from "../../components/AppUi";
import { mada } from "../../theme/tokens";

function InstructorHome() {
  const { identity } = useAuth();
  const router = useRouter();
  if (!identity) return null;
  const name = identity.user?.displayName?.trim() || "المدرب";

  return (
    <AppPage>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Text style={styles.brandText}>مدى</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>
            {identity.roleLabel ?? "المدرب"}
          </Text>
        </View>
      </View>
      <PageHeading
        eyebrow="مساحة المدرب · R04"
        title={`أهلًا، ${name}`}
        subtitle={identity.academy?.name ?? "متابعة الجلسات والمهام المصرح بها"}
      />

      <MadaCard style={styles.priorityCard}>
        <SmallLabel>أولوية اليوم</SmallLabel>
        <Text style={styles.cardTitle}>ابدأ من جدول جلساتك</Text>
        <Text style={styles.copy}>
          ستظهر الجلسات المسندة إليك بعد ربط شاشة الجدول ببيانات الـAPI الحية.
        </Text>
        {canAccessMobileRoute(identity, "schedule") ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(instructor)/schedule")}
            style={({ pressed }) => [
              styles.action,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.actionText}>فتح الجدول</Text>
            <Text style={styles.arrow} accessible={false}>
              ‹
            </Text>
          </Pressable>
        ) : null}
      </MadaCard>

      <Text style={styles.sectionTitle}>صلاحيات دورك</Text>
      <MadaCard>
        <Capability
          label="عرض الجلسات المسندة"
          enabled={hasPermission(identity, "sessions.assigned.read")}
        />
        <Capability
          label="قراءة الحضور"
          enabled={hasPermission(identity, "attendance.read")}
        />
        <Capability
          label="تسجيل الحضور"
          enabled={hasPermission(identity, "attendance.write")}
        />
        <Capability
          label="كتابة التقييمات"
          enabled={hasPermission(identity, "evaluations.write")}
          last
        />
      </MadaCard>
      <Text style={styles.scopeNote}>
        النطاق يحدده الخادم ويرتبط بهويتك: {identity.scopeLevel}. لا يرسل
        التطبيق tenant أو branch كاختيار صلاحية.
      </Text>
    </AppPage>
  );
}

function Capability({
  label,
  enabled,
  last = false,
}: {
  label: string;
  enabled: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.capability, !last ? styles.capabilityBorder : null]}>
      <Text
        style={[
          styles.capabilityMark,
          enabled ? styles.allowed : styles.denied,
        ]}
      >
        {enabled ? "✓" : "—"}
      </Text>
      <Text style={styles.capabilityLabel}>{label}</Text>
    </View>
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
  topRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.teal,
  },
  brandText: { color: mada.color.surface, fontSize: 18, fontWeight: "900" },
  rolePill: {
    paddingHorizontal: mada.space.md,
    paddingVertical: mada.space.sm,
    borderRadius: 999,
    backgroundColor: mada.color.tealSoft,
  },
  rolePillText: {
    color: mada.color.tealDark,
    fontSize: mada.type.caption,
    fontWeight: "700",
  },
  priorityCard: { borderColor: "#C9EAE3", backgroundColor: "#FBFEFD" },
  cardTitle: {
    color: mada.color.navy,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right",
  },
  copy: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    lineHeight: 22,
    textAlign: "right",
  },
  action: {
    minHeight: 48,
    paddingHorizontal: mada.space.md,
    borderRadius: mada.radius.medium,
    backgroundColor: mada.color.teal,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionText: {
    color: mada.color.surface,
    fontSize: mada.type.body,
    fontWeight: "800",
  },
  arrow: { color: mada.color.surface, fontSize: 27, fontWeight: "700" },
  pressed: { opacity: 0.82 },
  sectionTitle: {
    color: mada.color.navy,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  capability: {
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: mada.space.md,
  },
  capabilityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: mada.color.border,
  },
  capabilityMark: {
    width: 24,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },
  allowed: { color: mada.color.teal },
  denied: { color: mada.color.muted },
  capabilityLabel: {
    flex: 1,
    color: mada.color.navy,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  scopeNote: {
    color: mada.color.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "right",
  },
});
