import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthProvider";
import type { AccountType } from "../auth/types";
import { mada } from "../theme/tokens";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "staff", label: "فريق الأكاديمية" },
  { value: "parent", label: "ولي أمر" },
  { value: "student", label: "طالب" },
];

export default function LoginScreen() {
  const router = useRouter();
  const { status, error: authError, login } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("staff");
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
      await login(phone.trim(), password, accountType);
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
        <View style={styles.brandMark}>
          <Text style={styles.brandText}>مدى</Text>
        </View>
        <Text style={styles.title}>أهلًا بك في مدى</Text>
        <Text style={styles.subtitle}>
          سجّل الدخول لمتابعة مساحتك في الأكاديمية
        </Text>

        <Text style={styles.label}>نوع الحساب</Text>
        <View accessibilityRole="radiogroup" style={styles.accountTypes}>
          {ACCOUNT_TYPES.map(option => {
            const selected = accountType === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setAccountType(option.value)}
                style={[
                  styles.accountType,
                  selected ? styles.accountTypeSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    selected ? styles.accountTypeTextSelected : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          accessibilityLabel="رقم الهاتف"
          autoCapitalize="none"
          autoComplete="tel"
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="01012345678"
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
          accessibilityState={{ disabled: busy }}
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
        <Text style={styles.footnote}>
          نوع الحساب يحدد مسار المصادقة فقط؛ الدور والصلاحيات يحددهما الخادم بعد
          تسجيل الدخول.
        </Text>
        <Text style={styles.recoveryNote}>
          استعادة كلمة المرور غير مفعّلة في الـAPI الحالي.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: mada.color.page },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: mada.space.xl,
    gap: mada.space.md,
    direction: "rtl",
  },
  brandMark: {
    alignSelf: "flex-end",
    paddingHorizontal: mada.space.md,
    paddingVertical: mada.space.xs,
    borderRadius: mada.radius.medium,
    backgroundColor: mada.color.tealSoft,
  },
  brandText: { color: mada.color.teal, fontSize: 24, fontWeight: "900" },
  title: {
    marginTop: mada.space.md,
    color: mada.color.navy,
    fontSize: 29,
    fontWeight: "900",
    textAlign: "right",
  },
  subtitle: {
    marginBottom: mada.space.md,
    color: mada.color.muted,
    fontSize: mada.type.body,
    lineHeight: 24,
    textAlign: "right",
  },
  label: {
    marginTop: mada.space.sm,
    color: mada.color.navy,
    fontSize: mada.type.caption,
    fontWeight: "700",
    textAlign: "right",
  },
  accountTypes: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: mada.space.sm,
  },
  accountType: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: mada.space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mada.color.border,
    backgroundColor: mada.color.surface,
  },
  accountTypeSelected: {
    borderColor: mada.color.teal,
    backgroundColor: mada.color.tealSoft,
  },
  accountTypeText: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    fontWeight: "700",
  },
  accountTypeTextSelected: { color: mada.color.tealDark },
  inputLtr: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.medium,
    paddingHorizontal: mada.space.md,
    backgroundColor: mada.color.surface,
    color: mada.color.navy,
    fontSize: mada.type.body,
    writingDirection: "ltr",
  },
  passwordRow: {
    minHeight: 52,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.medium,
    paddingHorizontal: mada.space.md,
    backgroundColor: mada.color.surface,
  },
  passwordInput: {
    flex: 1,
    color: mada.color.navy,
    fontSize: mada.type.body,
    paddingVertical: mada.space.sm,
    writingDirection: "rtl",
  },
  showPassword: {
    padding: mada.space.xs,
    color: mada.color.teal,
    fontSize: mada.type.caption,
    fontWeight: "700",
  },
  error: {
    color: mada.color.danger,
    fontSize: mada.type.caption,
    lineHeight: 21,
    textAlign: "right",
  },
  submit: {
    minHeight: 52,
    marginTop: mada.space.md,
    borderRadius: mada.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.teal,
  },
  submitText: {
    color: mada.color.surface,
    fontSize: mada.type.body,
    fontWeight: "800",
  },
  footnote: {
    marginTop: mada.space.xs,
    color: mada.color.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
  },
  recoveryNote: { color: mada.color.muted, fontSize: 12, textAlign: "right" },
  disabled: { opacity: 0.62 },
  pressed: { opacity: 0.82 },
});
