import { Cairo_400Regular } from "@expo-google-fonts/cairo/400Regular";
import { Cairo_500Medium } from "@expo-google-fonts/cairo/500Medium";
import { Cairo_600SemiBold } from "@expo-google-fonts/cairo/600SemiBold";
import { Cairo_700Bold } from "@expo-google-fonts/cairo/700Bold";
import { Cairo_800ExtraBold } from "@expo-google-fonts/cairo/800ExtraBold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_800ExtraBold } from "@expo-google-fonts/inter/800ExtraBold";

export const madaFontAssets = {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
};

export const madaFontFamily = {
  arabic: {
    regular: "Cairo_400Regular",
    medium: "Cairo_500Medium",
    semiBold: "Cairo_600SemiBold",
    bold: "Cairo_700Bold",
    extraBold: "Cairo_800ExtraBold",
  },
  latin: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    extraBold: "Inter_800ExtraBold",
  },
} as const;

export type MadaTextWeight = keyof typeof madaFontFamily.arabic;
export type MadaTextFamily = keyof typeof madaFontFamily;
