import { Pressable, StyleSheet, View } from "react-native";
import type { SessionRecord } from "../../api/apiClient";
import { MadaCard } from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { mada } from "../../theme/tokens";

export type SessionAction = {
  title: string;
  accessibilityLabel: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "SCHEDULED":
      return "مجدولة";
    case "IN_PROGRESS":
      return "جارية";
    case "COMPLETED":
      return "مكتملة";
    case "CANCELLED":
      return "ملغاة";
    default:
      return status || "غير محددة";
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function SessionCard({
  session,
  actions = [],
}: {
  session: SessionRecord;
  actions?: SessionAction[];
}) {
  const title = session.courseName?.trim() || `الجلسة ${session.sessionNumber}`;
  const subtitle = [session.classroomName, session.branchName]
    .filter((item): item is string => Boolean(item?.trim()))
    .join(" · ");

  return (
    <MadaCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(session.startAt)}</Text>
          <Text family="latin" style={styles.time}>
            {formatTime(session.startAt)} – {formatTime(session.endAt)}
          </Text>
        </View>
        <View style={styles.status}>
          <Text style={styles.statusText}>{statusLabel(session.status)}</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {session.notes ? (
          <Text style={styles.notes}>{session.notes}</Text>
        ) : null}
      </View>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map(action => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              accessibilityState={{ disabled: Boolean(action.disabled) }}
              disabled={action.disabled}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                action.secondary
                  ? styles.actionSecondary
                  : styles.actionPrimary,
                action.disabled ? styles.disabled : null,
                pressed && !action.disabled ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  action.secondary ? styles.actionTextSecondary : null,
                ]}
              >
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </MadaCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: mada.space.md, padding: mada.space.md },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: mada.space.sm,
  },
  meta: { alignItems: "flex-end", gap: 4 },
  date: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  time: {
    color: mada.color.navy,
    fontSize: 14,
    fontWeight: "700",
    writingDirection: "ltr",
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: mada.space.sm,
    paddingVertical: mada.space.xs,
    backgroundColor: mada.color.tealSoft,
  },
  statusText: { color: mada.color.tealDark, fontSize: 11, fontWeight: "700" },
  copy: { alignItems: "flex-end", gap: 4 },
  title: {
    color: mada.color.navy,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  subtitle: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  notes: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    lineHeight: 20,
    textAlign: "right",
  },
  actions: { flexDirection: "row-reverse", gap: mada.space.sm },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: mada.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: mada.space.sm,
  },
  actionPrimary: { backgroundColor: mada.color.teal },
  actionSecondary: {
    backgroundColor: mada.color.surface,
    borderWidth: 1,
    borderColor: mada.color.border,
  },
  actionText: {
    color: mada.color.surface,
    fontSize: mada.type.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  actionTextSecondary: { color: mada.color.navy },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
});
