import { StyleSheet, View } from "react-native";
import { RouteGuard } from "../../components/RouteGuard";
import { AppPage, MadaCard, PageHeading } from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { mada } from "../../theme/tokens";

function TasksScreen() {
  return (
    <AppPage>
      <PageHeading
        eyebrow="مساحة المدرب"
        title="المهام"
        subtitle="الإجراءات التي تحتاج إلى استكمال ستظهر هنا."
      />
      <MadaCard style={styles.emptyCard}>
        <View style={styles.emptyMark} accessible={false}>
          <Text style={styles.emptyMarkText}>✓</Text>
        </View>
        <Text style={styles.title}>لسه ما فيش مهام محمّلة</Text>
        <Text style={styles.copy}>
          هنعرِض مهام الحضور والتقييم من مصدرها الفعلي لما يتوفر. مش هنعرض
          أعدادًا أو حالات افتراضية.
        </Text>
      </MadaCard>
    </AppPage>
  );
}

export default function InstructorTasksRoute() {
  return (
    <RouteGuard route="tasks">
      <TasksScreen />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  emptyCard: { alignItems: "flex-end", paddingVertical: mada.space.xl },
  emptyMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.tealSoft,
  },
  emptyMarkText: { color: mada.color.teal, fontSize: 24, fontWeight: "700" },
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
