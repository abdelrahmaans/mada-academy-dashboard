import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingScreen } from "../../components/AppUi";
import { useAuth } from "../../auth/AuthProvider";
import { getVisibleMobileTabs } from "../../authorization/routeAccess";
import { INSTRUCTOR_ROLE } from "../../authorization/roles";
import { mada } from "../../theme/tokens";

const icons = {
  index: { ios: "house.fill", android: "home", web: "home" },
  schedule: {
    ios: "calendar",
    android: "calendar_month",
    web: "calendar_month",
  },
  tasks: { ios: "checklist", android: "checklist", web: "checklist" },
  account: { ios: "person.crop.circle", android: "person", web: "person" },
} as const;

export default function InstructorTabsLayout() {
  const { status, identity } = useAuth();
  const insets = useSafeAreaInsets();
  if (status === "loading") return <LoadingScreen />;
  if (!identity || status === "anonymous") return <Redirect href="/login" />;
  if (identity.role !== INSTRUCTOR_ROLE)
    return <Redirect href="/role-unavailable" />;

  const visibleRoutes = new Set(
    getVisibleMobileTabs(identity).map(item => item.route)
  );
  const options = (
    route: "home" | "schedule" | "tasks" | "account",
    title: string,
    icon: keyof typeof icons
  ) => ({
    title,
    href: visibleRoutes.has(route) ? undefined : null,
    tabBarIcon: ({ color }: { color: ColorValue }) => (
      <SymbolView name={icons[icon]} tintColor={color} size={21} />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: mada.color.teal,
        tabBarInactiveTintColor: mada.color.muted,
        tabBarLabelStyle: {
          fontFamily: mada.fontFamily.arabic.bold,
          fontSize: 12,
          lineHeight: 18,
          fontWeight: "700",
        },
        tabBarStyle: {
          height: 76 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 6,
          backgroundColor: mada.color.surface,
          borderTopColor: mada.color.border,
        },
        sceneStyle: { backgroundColor: mada.color.page },
      }}
    >
      <Tabs.Screen
        name="index"
        options={options("home", "الرئيسية", "index")}
      />
      <Tabs.Screen
        name="schedule"
        options={options("schedule", "الجدول", "schedule")}
      />
      <Tabs.Screen name="tasks" options={options("tasks", "المهام", "tasks")} />
      <Tabs.Screen
        name="account"
        options={options("account", "حسابي", "account")}
      />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="evaluations" options={{ href: null }} />
    </Tabs>
  );
}
