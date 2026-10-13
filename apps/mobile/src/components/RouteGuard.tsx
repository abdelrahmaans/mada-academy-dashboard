import type { ReactNode } from "react";
import { Redirect } from "expo-router";
import {
  AppPage,
  LoadingScreen,
  MadaCard,
  MessageCard,
  PageHeading,
  PrimaryButton,
} from "./AppUi";
import { useAuth } from "../auth/AuthProvider";
import {
  canAccessMobileRoute,
  type MobileRoute,
} from "../authorization/routeAccess";
import { getRoleDefinition } from "../authorization/roles";
import { mada } from "../theme/tokens";
import { StyleSheet } from "react-native";
import { MadaText as Text } from "./MadaText";

export function RouteGuard({
  route,
  children,
}: {
  route: MobileRoute;
  children: ReactNode;
}) {
  const { status, identity, error, retryRestore } = useAuth();

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <AppPage>
        <MessageCard
          title="تعذر التحقق من صلاحية الجلسة"
          detail={error ?? "تحقق من الاتصال بالخادم ثم أعد المحاولة."}
          tone="error"
        />
        <PrimaryButton
          title="إعادة المحاولة"
          onPress={() => void retryRestore()}
        />
      </AppPage>
    );
  }
  if (!identity || status === "anonymous") return <Redirect href="/login" />;

  if (!getRoleDefinition(identity.role)?.mobileEnabled)
    return <Redirect href="/role-unavailable" />;
  if (!canAccessMobileRoute(identity, route)) {
    return (
      <AppPage>
        <PageHeading
          eyebrow={identity.roleLabel ?? "مدى"}
          title="الوصول غير متاح"
          subtitle="هذه الشاشة خارج صلاحيات الدور النشط. الصلاحيات الفعلية يحددها الخادم، وليس اختيارًا داخل التطبيق."
        />
        <MadaCard>
          <Text style={styles.role}>
            الدور:{" "}
            {identity.roleLabel ??
              getRoleDefinition(identity.role)?.label ??
              identity.role}
          </Text>
          <Text style={styles.scope}>النطاق: {identity.scopeLevel}</Text>
        </MadaCard>
      </AppPage>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  role: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "700",
    textAlign: "right",
  },
  scope: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
});
