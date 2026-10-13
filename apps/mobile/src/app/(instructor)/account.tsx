import { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { getRoleDefinition } from "../../authorization/roles";
import { MadaText as Text } from "../../components/MadaText";
import { RouteGuard } from "../../components/RouteGuard";
import {
  AppPage,
  MadaCard,
  PageHeading,
  PrimaryButton,
} from "../../components/AppUi";
import { mada } from "../../theme/tokens";

const PERMISSION_LABELS: Record<string, string> = {
  "sessions.assigned.read": "عرض الجلسات المسندة إليّ",
  "attendance.read": "قراءة الحضور في النطاق المسموح",
  "attendance.write": "تسجيل الحضور للجلسات المسندة",
  "evaluations.write": "كتابة تقييمات الطلاب المسندين",
};

function AccountScreen() {
  const { identity, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!identity) return null;
  const role = getRoleDefinition(identity.role);

  const signOut = async () => {
    setBusy(true);
    const serverRevoked = await logout();
    setBusy(false);
    if (!serverRevoked)
      Alert.alert(
        "تم الخروج من الجهاز",
        "تعذر تأكيد إلغاء الجلسة لدى الخادم بسبب انقطاع الاتصال."
      );
    router.replace("/login");
  };

  return (
    <AppPage>
      <PageHeading
        eyebrow="الحساب والجلسة"
        title={identity.user?.displayName || "حسابي"}
        subtitle={identity.user?.phone}
      />
      <MadaCard>
        <Text style={styles.sectionTitle}>هوية الوصول النشطة</Text>
        <InfoRow
          label="الدور"
          value={identity.roleLabel ?? role?.label ?? identity.role}
        />
        <InfoRow label="رمز الدور" value={identity.role} ltr />
        <InfoRow label="نطاق البيانات" value={identity.scopeLevel} ltr />
        <InfoRow label="الأكاديمية" value={identity.academy?.name ?? "—"} />
        <InfoRow
          label="الفرع"
          value={identity.branchId ?? "يحدده الخادم"}
          ltr
          last
        />
      </MadaCard>
      <MadaCard>
        <Text style={styles.sectionTitle}>الصلاحيات من /me</Text>
        {identity.permissions.length ? (
          identity.permissions.map(permission => (
            <InfoRow
              key={permission}
              label={PERMISSION_LABELS[permission] ?? permission}
              value="ممنوحة"
            />
          ))
        ) : (
          <Text style={styles.muted}>لا توجد صلاحيات معادة لهذا الحساب.</Text>
        )}
      </MadaCard>
      <PrimaryButton
        title="تسجيل الخروج"
        onPress={() => void signOut()}
        loading={busy}
      />
    </AppPage>
  );
}

function InfoRow({
  label,
  value,
  ltr = false,
  last = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  last?: boolean;
}) {
  return (
    <Text style={[styles.infoRow, !last ? styles.rowBorder : null]}>
      <Text style={styles.infoLabel}>{label} </Text>
      <Text
        family={ltr ? "latin" : "arabic"}
        style={[styles.infoValue, ltr ? styles.ltr : null]}
      >
        {value}
      </Text>
    </Text>
  );
}

export default function InstructorAccountRoute() {
  return (
    <RouteGuard route="account">
      <AccountScreen />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "800",
    textAlign: "right",
  },
  infoRow: {
    minHeight: 42,
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
    textAlignVertical: "center",
    writingDirection: "rtl",
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: mada.color.border },
  infoLabel: { color: mada.color.muted },
  infoValue: { color: mada.color.navy, fontWeight: "700" },
  ltr: { writingDirection: "ltr", textAlign: "left" },
  muted: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
});
