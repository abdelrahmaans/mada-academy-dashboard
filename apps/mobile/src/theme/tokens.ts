import { madaFontFamily } from "./fonts";

export const mada = {
  color: {
    teal: "#0D9488",
    tealDark: "#08776C",
    navy: "#14243A",
    amber: "#D49A2D",
    page: "#F4F7FA",
    surface: "#FFFFFF",
    border: "#E8EDF2",
    muted: "#78879A",
    tealSoft: "#E5F5F1",
    amberSoft: "#FFF4DB",
    blue: "#4F7CA2",
    blueSoft: "#EAF2F8",
    violet: "#7161AD",
    violetSoft: "#EFEDFB",
    danger: "#B45B62",
    dangerSoft: "#FFF0F1",
  },
  radius: { small: 9, medium: 13, large: 15, panel: 19 },
  shadow: {
    card: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.035,
      shadowRadius: 20,
      elevation: 1,
    },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  fontFamily: madaFontFamily,
  type: { body: 16, caption: 13, heading: 24, title: 30 },
} as const;
