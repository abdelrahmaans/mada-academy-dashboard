import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthProvider";
import type { AccountType } from "../auth/types";
import { MadaText as Text } from "../components/MadaText";
import { mada } from "../theme/tokens";

const MOBILE_ACCOUNT_TYPE: AccountType = "staff";

export default function LoginScreen() {
  const router = useRouter();
  const { status, error: authError, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") return <Redirect href="/" />;

  const submit = async () => {
    if (!phone.trim() || !password) {
      setError("اكتب رقم الهاتف وكلمة المرور.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(phone.trim(), password, MOBILE_ACCOUNT_TYPE);
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand} accessibilityLabel="مدى">
          <View style={styles.brandMark}>
            <Text family="latin" style={styles.brandMarkText}>
              M
            </Text>
          </View>
          <Text style={styles.brandText}>مدى</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          أهلًا بك في مدى
        </Text>
        <Text style={styles.subtitle}>سجّل الدخول لمتابعة يومك</Text>

        <View style={styles.form}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            accessibilityLabel="رقم الهاتف"
            autoCapitalize="none"
            autoComplete="tel"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder="01X XXX XXXX"
            placeholderTextColor={mada.color.muted}
            style={styles.inputLtr}
            textAlign="left"
            value={phone}
          />

          <Text style={styles.label}>كلمة المرور</Text>
          <View style={styles.passwordRow}>
            <TextInput
              accessibilityLabel="كلمة المرور"
              autoCapitalize="none"
              autoComplete="current-password"
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor={mada.color.muted}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              textAlign="right"
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
              onPress={() => setShowPassword(value => !value)}
              hitSlop={8}
            >
              <Text style={styles.showPassword}>
                {showPassword ? "إخفاء" : "إظهار"}
              </Text>
            </Pressable>
          </View>

          {error || authError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error ?? authError}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submit,
              pressed && !busy ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={mada.color.surface} />
            ) : (
              <Text style={styles.submitText}>تسجيل الدخول</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.secureNote}>
          <Text style={styles.footnote}>دخول آمن لحساب الأكاديمية</Text>
        </View>
        <Text style={styles.recoveryNote}>
          الدور والصلاحيات يحددهما الخادم بعد تسجيل الدخول. استعادة كلمة المرور
          غير مفعّلة في الـAPI الحالي.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: mada.color.surface },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: mada.space.xl,
    paddingVertical: mada.space.xxl,
    gap: mada.space.sm,
    direction: "rtl",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: mada.space.sm,
    marginBottom: mada.space.md,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.tealSoft,
  },
  brandMarkText: { color: mada.color.teal, fontSize: 28, fontWeight: "800" },
  brandText: { color: mada.color.navy, fontSize: 28, fontWeight: "800" },
  title: {
    marginTop: mada.space.sm,
    color: mada.color.navy,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginBottom: mada.space.xl,
    color: mada.color.muted,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
  },
  form: { gap: mada.space.sm },
  label: {
    marginTop: mada.space.sm,
    color: mada.color.navy,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
  },
  inputLtr: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.medium,
    paddingHorizontal: mada.space.lg,
    backgroundColor: "#FCFDFE",
    color: mada.color.navy,
    fontFamily: mada.fontFamily.latin.medium,
    fontSize: mada.type.body,
    writingDirection: "ltr",
  },
  passwordRow: {
    minHeight: 56,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.medium,
    paddingHorizontal: mada.space.md,
    backgroundColor: "#FCFDFE",
  },
  passwordInput: {
    flex: 1,
    color: mada.color.navy,
    fontFamily: mada.fontFamily.arabic.regular,
    fontSize: mada.type.body,
    paddingVertical: mada.space.sm,
    writingDirection: "rtl",
  },
  showPassword: {
    padding: mada.space.xs,
    color: mada.color.tealDark,
    fontSize: mada.type.caption,
    fontWeight: "700",
  },
  error: {
    marginTop: mada.space.sm,
    color: mada.color.danger,
    fontSize: mada.type.caption,
    lineHeight: 21,
    textAlign: "right",
  },
  submit: {
    minHeight: 58,
    marginTop: mada.space.lg,
    borderRadius: mada.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.teal,
    ...mada.shadow.card,
  },
  submitText: {
    color: mada.color.surface,
    fontSize: 19,
    fontWeight: "800",
  },
  secureNote: { marginTop: mada.space.lg },
  footnote: {
    color: mada.color.muted,
    fontSize: 15,
    textAlign: "center",
  },
  recoveryNote: {
    marginTop: mada.space.md,
    color: mada.color.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  disabled: { opacity: 0.62 },
  pressed: { opacity: 0.82 },
});
