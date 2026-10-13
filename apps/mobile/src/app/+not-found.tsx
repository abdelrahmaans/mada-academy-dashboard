import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { MadaText as Text } from "../components/MadaText";
import { mada } from "../theme/tokens";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "غير موجودة" }} />
      <Text style={styles.title}>الصفحة غير متاحة</Text>
      <Text style={styles.copy}>
        الرابط غير صحيح أو أن هذه الشاشة غير مفعّلة لهذا التطبيق.
      </Text>
      <Link href="/" style={styles.link}>
        العودة إلى البداية
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: mada.space.xl,
    backgroundColor: mada.color.page,
    direction: "rtl",
  },
  title: {
    color: mada.color.navy,
    fontSize: mada.type.heading,
    fontWeight: "800",
  },
  copy: {
    marginTop: mada.space.md,
    color: mada.color.muted,
    fontSize: mada.type.body,
    textAlign: "center",
    lineHeight: 26,
  },
  link: {
    marginTop: mada.space.xl,
    color: mada.color.teal,
    fontFamily: mada.fontFamily.arabic.bold,
    fontSize: mada.type.body,
    fontWeight: "700",
  },
});
