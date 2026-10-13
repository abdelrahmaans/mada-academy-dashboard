import { ActivityIndicator, View } from "react-native";
import { MessageCard, PrimaryButton } from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { mada } from "../../theme/tokens";

export function SessionListState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View
        style={{
          alignItems: "center",
          gap: mada.space.md,
          padding: mada.space.xl,
        }}
      >
        <ActivityIndicator size="large" color={mada.color.teal} />
        <Text style={{ color: mada.color.muted }}>
          جارٍ تحميل الجلسات من الخادم…
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <MessageCard
        title="تعذر تحميل الجلسات"
        detail={error}
        tone="error"
        action={
          <PrimaryButton title="إعادة المحاولة" onPress={onRetry} secondary />
        }
      />
    );
  }
  if (empty) {
    return (
      <MessageCard
        title="لا توجد جلسات في النطاق الحالي"
        detail="لم يُرجع الخادم جلسات مسندة خلال الفترة المعروضة. يمكنك تحديث القائمة أو المحاولة لاحقًا."
        action={
          <PrimaryButton title="تحديث الجلسات" onPress={onRetry} secondary />
        }
      />
    );
  }
  return null;
}
