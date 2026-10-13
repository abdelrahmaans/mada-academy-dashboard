import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { hasPermission } from "../../authorization/routeAccess";
import { RouteGuard } from "../../components/RouteGuard";
import {
  AppPage,
  MadaCard,
  MessageCard,
  PageHeading,
} from "../../components/AppUi";
import { mada } from "../../theme/tokens";

function TasksScreen() {
  const { identity } = useAuth();
  if (!identity) return null;
  const capabilities = [
    { key: "attendance.write", label: "إكمال حضور الجلسة" },
    { key: "evaluations.write", label: "كتابة تقييمات الطلاب" },
  ].filter(item => hasPermission(identity, item.key));

  return (
    <AppPage>
      <PageHeading
        eyebrow="إجراءات تحتاجها"
        title="المهام"
        subtitle="نعرض هنا إجراءات الدور فقط؛ التحديثات المعلوماتية تبقى منفصلة عن المهام."
      />
      <MessageCard
        title="مصدر المهام لم يُربط بعد"
        detail="لا ينشئ الخادم حاليًا endpoint موحدًا لقائمة الأولويات. سنربط المهام بمصادرها قبل عرض أعداد أو بطاقات فعلية."
      />
      <MadaCard>
        <Text style={styles.title}>إمكانات دورك الحالية</Text>
        {capabilities.length ? (
          capabilities.map(item => (
            <View key={item.key} style={styles.row}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>
            لا يملك الدور الحالي صلاحيات كتابة مهام الحضور أو التقييم.
          </Text>
        )}
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
  title: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "800",
    textAlign: "right",
  },
  row: {
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: mada.space.md,
    borderBottomWidth: 1,
    borderBottomColor: mada.color.border,
  },
  check: { color: mada.color.teal, fontSize: 18, fontWeight: "900" },
  label: {
    color: mada.color.navy,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  empty: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
});
