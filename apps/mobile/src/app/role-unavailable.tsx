import { Redirect } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { getRoleDefinition } from "../authorization/roles";
import {
  AppPage,
  MadaCard,
  PageHeading,
  PrimaryButton,
} from "../components/AppUi";
import { mada } from "../theme/tokens";

export default function RoleUnavailableScreen() {
  const { status, identity, logout } = useAuth();
  if (status === "loading") return null;
  if (!identity) return <Redirect href="/login" />;
  const definition = getRoleDefinition(identity.role);
  return (
    <AppPage>
      <PageHeading
        eyebrow="Mada Mobile"
        title="مساحتك محفوظة"
        subtitle="تم التعرف على حسابك ودوره، لكن شاشات هذا الدور لم تُفعّل في نسخة الموبايل الحالية."
      />
      <MadaCard>
        <Text style={styles.role}>
          {identity.roleLabel ?? definition?.label ?? identity.role}
        </Text>
        <Text style={styles.meta}>النطاق: {identity.scopeLevel}</Text>
        <Text style={styles.meta}>
          الأكاديمية: {identity.academy?.name ?? "—"}
        </Text>
        <Text style={styles.note}>
          لم نعرض شاشات دور آخر، ولم نستخدم بيانات تجريبية. استخدم واجهة الويب
          المخصصة لهذا الدور إلى أن تُبنى واجهته المحمولة.
        </Text>
      </MadaCard>
      <PrimaryButton
        title="تسجيل الخروج من هذا الجهاز"
        onPress={() => void logout()}
      />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  role: {
    color: mada.color.navy,
    fontSize: mada.type.heading,
    fontWeight: "800",
    textAlign: "right",
  },
  meta: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  note: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    lineHeight: 24,
    textAlign: "right",
  },
});
