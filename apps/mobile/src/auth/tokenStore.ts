import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthTokens } from "./types";

const ACCESS_TOKEN_KEY = "mada.mobile.access-token.v1";
const REFRESH_TOKEN_KEY = "mada.mobile.refresh-token.v1";

function assertNativeSecureStorage() {
  if (Platform.OS === "web") {
    throw new Error(
      "تسجيل الدخول متاح في تطبيق iOS وAndroid فقط؛ لا نخزن الرموز في المتصفح."
    );
  }
}

export async function readTokens() {
  assertNativeSecureStorage();
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(tokens: AuthTokens) {
  assertNativeSecureStorage();
  // Persist the rotated refresh token first so a mid-write interruption can still recover.
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
}

export async function clearTokens() {
  if (Platform.OS === "web") return;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
