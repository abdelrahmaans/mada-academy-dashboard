import "react-native-reanimated";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../auth/AuthProvider";
import { LoadingScreen } from "../components/AppUi";
import { madaFontAssets } from "../theme/fonts";
import { mada } from "../theme/tokens";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(madaFontAssets);
  if (!fontsLoaded && !fontError)
    return <LoadingScreen title="جارٍ تجهيز واجهة مدى…" />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: mada.color.page },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="role-unavailable" />
          <Stack.Screen name="(instructor)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
