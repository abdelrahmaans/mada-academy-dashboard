import { StyleSheet, Text } from "react-native";
import { RouteGuard } from "../../components/RouteGuard";
import {
  AppPage,
  MadaCard,
  PageHeading,
  MessageCard,
} from "../../components/AppUi";
import { mada } from "../../theme/tokens";

function ScheduleScreen() {
  return (
    <AppPage>
      <PageHeading
        eyebrow="R04 · جلساتك فقط"
        title="الجدول"
        subtitle="هذا المسار لا يظهر إلا إذا أعاد الخادم صلاحية عرض الجلسات المسندة إليك."
      />
      <MessageCard
        title="الواجهة جاهزة للربط"
        detail="الخطوة التالية هي ربط GET /api/v1/sessions بمدى زمني واستخدام نطاق الجلسات الذي يفرضه الخادم."
      />
      <MadaCard>
        <Text style={styles.title}>لا توجد بيانات محلية أو تجريبية</Text>
        <Text style={styles.copy}>
          لم يتم تحميل جدول قبل توصيل مصدر البيانات الحي. لن نعرض جلسات افتراضية
          أو نرسل branchId من التطبيق.
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
