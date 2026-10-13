import {
  StyleSheet,
  Text as NativeText,
  type TextProps,
  type TextStyle,
} from "react-native";
import { mada } from "../theme/tokens";
import type { MadaTextFamily, MadaTextWeight } from "../theme/fonts";

type MadaTextProps = TextProps & {
  family?: MadaTextFamily;
  weight?: MadaTextWeight;
};

function inferWeight(value?: TextStyle["fontWeight"]): MadaTextWeight {
  switch (String(value ?? "400")) {
    case "500":
    case "medium":
      return "medium";
    case "600":
    case "semibold":
      return "semiBold";
    case "700":
    case "bold":
      return "bold";
    case "800":
    case "900":
    case "heavy":
      return "extraBold";
    default:
      return "regular";
  }
}

export function MadaText({
  family = "arabic",
  weight,
  style,
  ...props
}: MadaTextProps) {
  const flattenedStyle = StyleSheet.flatten(style);
  const resolvedWeight = weight ?? inferWeight(flattenedStyle?.fontWeight);
  return (
    <NativeText
      {...props}
      style={[
        styles.base,
        flattenedStyle,
        { fontFamily: mada.fontFamily[family][resolvedWeight] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
