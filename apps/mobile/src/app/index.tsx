import { Redirect } from "expo-router";
import {
  LoadingScreen,
  AppPage,
  MessageCard,
  PrimaryButton,
} from "../components/AppUi";
import { useAuth } from "../auth/AuthProvider";

export default function IndexRoute() {
  const { status, identity, error, retryRestore } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <AppPage>
        <MessageCard
          title="تعذر استعادة الجلسة"
          detail={error ?? "تحقق من اتصالك ثم أعد المحاولة."}
          tone="error"
        />
        <PrimaryButton
          title="إعادة المحاولة"
          onPress={() => void retryRestore()}
        />
      </AppPage>
    );
  }
  if (!identity || status === "anonymous") return <Redirect href="/login" />;
  if (identity.role === "R04_INSTRUCTOR")
    return <Redirect href="/(instructor)" />;
  return <Redirect href="/role-unavailable" />;
}
