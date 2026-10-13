import { StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { RouteGuard } from "../../components/RouteGuard";
import { AppPage, MadaCard, PageHeading } from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { mada } from "../../theme/tokens";

function ScheduleScreen() {
  return (
    <AppPage>
      <PageHeading
        eyebrow="الجلسات المسندة إليك"
        title="الجدول"
        subtitle="جلساتك مرتبة حسب اليوم والوقت."
      />
      <MadaCard style={styles.emptyCard}>
        <View style={styles.calendarMark} accessible={false}>
          <SymbolView
            name={{
              ios: "calendar",
              android: "calendar_month",
              web: "calendar_month",
            }}
            tintColor={mada.color.teal}
            size={23}
          />
        </View>
        <Text style={styles.title}>جدولك هيظهر هنا</Text>
        <Text style={styles.copy}>
          عند ربط الجلسات المسندة من الخادم، هتظهر مواعيدك هنا من غير جلسات أو
          أوقات تجريبية.
        </Text>
      </MadaCard>
    </AppPage>
  );
}

export default function InstructorScheduleRoute() {
  return (
    <RouteGuard route="schedule">
      <ScheduleScreen />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  emptyCard: { alignItems: "flex-end", paddingVertical: mada.space.xl },
  calendarMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.tealSoft,
  },
  title: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "800",
    textAlign: "right",
  },
  copy: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    lineHeight: 22,
    textAlign: "right",
  },
});
