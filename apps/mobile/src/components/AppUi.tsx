import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mada } from "../theme/tokens";

export function AppPage({
  children,
  contentStyle,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function MadaCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  secondary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled || loading),
        busy: Boolean(loading),
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        pressed && !disabled && !loading ? styles.pressed : null,
        disabled || loading ? styles.buttonDisabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={secondary ? mada.color.teal : mada.color.surface}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          secondary ? styles.buttonTextSecondary : null,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function MessageCard({
  title,
  detail,
  tone = "info",
  action,
}: {
  title: string;
  detail?: string;
  tone?: "info" | "error" | "warning";
  action?: ReactNode;
}) {
  const toneStyle =
    tone === "error"
      ? styles.errorCard
      : tone === "warning"
        ? styles.warningCard
        : styles.infoCard;
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "summary"}
      style={[styles.messageCard, toneStyle]}
    >
      <Text style={styles.messageTitle}>{title}</Text>
      {detail ? <Text style={styles.messageDetail}>{detail}</Text> : null}
      {action ? <View style={styles.messageAction}>{action}</View> : null}
    </View>
  );
}

export function LoadingScreen({
  title = "جارٍ التحقق من الجلسة…",
}: {
  title?: string;
}) {
  return (
    <SafeAreaView style={styles.loading}>
      <ActivityIndicator size="large" color={mada.color.teal} />
      <Text style={styles.loadingText}>{title}</Text>
    </SafeAreaView>
  );
}

export function SmallLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.smallLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: mada.color.page, direction: "rtl" },
  content: {
    flexGrow: 1,
    paddingHorizontal: mada.space.lg,
    paddingTop: mada.space.lg,
    paddingBottom: mada.space.xl,
    gap: mada.space.lg,
    direction: "rtl",
  },
  heading: { gap: mada.space.xs },
  eyebrow: {
    color: mada.color.teal,
    fontSize: mada.type.caption,
    fontWeight: "700",
    textAlign: "right",
  },
  title: {
    color: mada.color.navy,
    fontSize: mada.type.heading,
    fontWeight: "800",
    textAlign: "right",
  },
  subtitle: {
    color: mada.color.muted,
    fontSize: mada.type.body,
    lineHeight: 24,
    textAlign: "right",
  },
  card: {
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.large,
    backgroundColor: mada.color.surface,
    padding: mada.space.lg,
    gap: mada.space.md,
  },
  button: {
    minHeight: 50,
    borderRadius: mada.radius.medium,
    paddingHorizontal: mada.space.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: mada.space.sm,
  },
  buttonPrimary: { backgroundColor: mada.color.teal },
  buttonSecondary: {
    backgroundColor: mada.color.surface,
    borderWidth: 1,
    borderColor: mada.color.border,
  },
  buttonText: {
    color: mada.color.surface,
    fontSize: mada.type.body,
    fontWeight: "800",
  },
  buttonTextSecondary: { color: mada.color.navy },
  buttonDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  messageCard: {
    borderRadius: mada.radius.medium,
    padding: mada.space.md,
    gap: mada.space.xs,
    borderWidth: 1,
  },
  infoCard: { backgroundColor: mada.color.tealSoft, borderColor: "#C9EAE3" },
  errorCard: { backgroundColor: "#FFF5F5", borderColor: "#F0C9CC" },
  warningCard: {
    backgroundColor: mada.color.amberSoft,
    borderColor: "#F1DCA8",
  },
  messageTitle: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "700",
    textAlign: "right",
  },
  messageDetail: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    lineHeight: 21,
    textAlign: "right",
  },
  messageAction: { marginTop: mada.space.xs },
  loading: {
    flex: 1,
    backgroundColor: mada.color.page,
    alignItems: "center",
    justifyContent: "center",
    gap: mada.space.md,
    padding: mada.space.xl,
  },
  loadingText: { color: mada.color.muted, fontSize: mada.type.body },
  smallLabel: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
});
