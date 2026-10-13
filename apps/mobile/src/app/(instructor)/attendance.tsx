import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import type {
  AttendanceItem,
  AttendanceStatus,
  SessionRecord,
} from "../../api/apiClient";
import { ApiRequestError, apiClient } from "../../api/apiClient";
import { useAuth } from "../../auth/AuthProvider";
import { hasPermission } from "../../authorization/routeAccess";
import {
  AppPage,
  LoadingScreen,
  MadaCard,
  MessageCard,
  PageHeading,
  PrimaryButton,
} from "../../components/AppUi";
import { MadaText as Text } from "../../components/MadaText";
import { RouteGuard } from "../../components/RouteGuard";
import {
  canEditAttendance,
  isDirectlyAssigned,
} from "../../features/sessions/sessionAccess";
import { mada } from "../../theme/tokens";

const attendanceOptions: {
  value: Exclude<AttendanceStatus, "UNMARKED">;
  label: string;
}[] = [
  { value: "PRESENT", label: "حاضر" },
  { value: "ABSENT", label: "غائب" },
  { value: "LATE", label: "متأخر" },
  { value: "EXCUSED", label: "معذور" },
];

function AttendanceScreen() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const { identity } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setError("لم يصل معرّف الجلسة. ارجع إلى الجدول وافتح الجلسة المطلوبة.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const [sessionResult, attendanceResult] = await Promise.all([
        apiClient.getSession(sessionId),
        apiClient.getSessionAttendance(sessionId),
      ]);
      setSession(sessionResult);
      setItems(attendanceResult.items);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError && cause.status === 403
          ? "لا تملك صلاحية قراءة حضور هذه الجلسة."
          : cause instanceof Error
            ? cause.message
            : "تعذر تحميل كشف الحضور."
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const counts = useMemo(
    () => ({
      marked: items.filter(item => item.status !== "UNMARKED").length,
      present: items.filter(item => item.status === "PRESENT").length,
      absent: items.filter(item => item.status === "ABSENT").length,
    }),
    [items]
  );

  const canSave = Boolean(
    identity && session && canEditAttendance(identity, session)
  );
  const readOnlyReason =
    identity && session && !isDirectlyAssigned(identity, session)
      ? "يمكنك الاطلاع على الحضور ضمن نطاق الإشراف، لكن التعديل متاح للمدرب المسند أو البديل فقط."
      : session &&
          ["COMPLETED", "CANCELLED"].includes(session.status.toUpperCase())
        ? "الجلسة مكتملة أو ملغاة؛ كشف الحضور للقراءة فقط."
        : identity && !hasPermission(identity, "attendance.write")
          ? "دورك يسمح بقراءة الحضور فقط."
          : null;

  const updateItem = (studentId: string, update: Partial<AttendanceItem>) => {
    setItems(current =>
      current.map(item =>
        item.studentId === studentId ? { ...item, ...update } : item
      )
    );
    setMessage(null);
    setActionError(null);
  };

  const save = async () => {
    if (!sessionId || !session || !canSave) return;
    const selected = items.filter(item => item.status !== "UNMARKED");
    if (!selected.length) {
      setActionError("حدد حالة طالب واحد على الأقل قبل الحفظ.");
      return;
    }
    const invalidLate = selected.find(
      item =>
        item.status === "LATE" &&
        (!Number.isInteger(item.lateMinutes) ||
          !item.lateMinutes ||
          item.lateMinutes < 1)
    );
    if (invalidLate) {
      setActionError(
        `أدخل عدد دقائق التأخير للطالب ${invalidLate.studentName}.`
      );
      return;
    }
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      const result = await apiClient.upsertSessionAttendance(
        sessionId,
        selected.map(item => ({
          studentId: item.studentId,
          status: item.status as Exclude<AttendanceStatus, "UNMARKED">,
          lateMinutes: item.status === "LATE" ? item.lateMinutes : null,
        }))
      );
      setItems(result.items);
      setMessage("تم حفظ الحضور من الخادم بنجاح.");
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "تعذر حفظ الحضور."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen title="جارٍ تحميل كشف الحضور…" />;

  return (
    <AppPage>
      <PageHeading
        eyebrow="الجلسة المسندة"
        title="تسجيل الحضور"
        subtitle={
          session?.courseName ??
          "الحضور مرتبط بقائمة الطلاب الفعلية في المجموعة."
        }
      />
      {error ? (
        <MessageCard
          title="تعذر فتح كشف الحضور"
          detail={error}
          tone="error"
          action={
            <PrimaryButton
              title="إعادة المحاولة"
              onPress={() => void load()}
              secondary
            />
          }
        />
      ) : null}
      {session && !error ? (
        <>
          <MadaCard style={styles.summary}>
            <Text style={styles.sessionTitle}>
              {session.courseName ?? `الجلسة ${session.sessionNumber}`}
            </Text>
            <Text style={styles.summaryText}>
              {counts.marked} من {items.length} محدد · حاضر {counts.present} ·
              غائب {counts.absent}
            </Text>
          </MadaCard>
          {readOnlyReason ? (
            <MessageCard
              title="وضع القراءة فقط"
              detail={readOnlyReason}
              tone="warning"
            />
          ) : null}
          {actionError ? (
            <MessageCard
              title="لم يتم الحفظ"
              detail={actionError}
              tone="error"
            />
          ) : null}
          {message ? <MessageCard title="تم الحفظ" detail={message} /> : null}
          {!items.length ? (
            <MessageCard
              title="لا يوجد طلاب في كشف الجلسة"
              detail="لم يُرجع الخادم طلابًا مسجلين في المجموعة المرتبطة بهذه الجلسة."
            />
          ) : null}
          {items.map(item => (
            <MadaCard key={item.studentId} style={styles.studentCard}>
              <Text style={styles.studentName}>{item.studentName}</Text>
              <View style={styles.options}>
                {attendanceOptions.map(option => {
                  const selected = item.status === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                        disabled: !canSave || saving,
                      }}
                      accessibilityLabel={`${item.studentName}: ${option.label}`}
                      disabled={!canSave || saving}
                      onPress={() =>
                        updateItem(item.studentId, {
                          status: option.value,
                          lateMinutes:
                            option.value === "LATE" ? item.lateMinutes : null,
                        })
                      }
                      style={[
                        styles.option,
                        selected ? styles.optionSelected : null,
                        !canSave ? styles.optionDisabled : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected ? styles.optionTextSelected : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {item.status === "LATE" ? (
                <View style={styles.lateRow}>
                  <Text style={styles.lateLabel}>دقائق التأخير</Text>
                  <TextInput
                    accessibilityLabel={`دقائق تأخير ${item.studentName}`}
                    editable={canSave && !saving}
                    keyboardType="number-pad"
                    value={item.lateMinutes?.toString() ?? ""}
                    onChangeText={value => {
                      const parsed = value.replace(/\D/g, "");
                      updateItem(item.studentId, {
                        lateMinutes: parsed ? Number(parsed) : null,
                      });
                    }}
                    placeholder="مثال: 10"
                    placeholderTextColor={mada.color.muted}
                    style={styles.lateInput}
                  />
                </View>
              ) : null}
            </MadaCard>
          ))}
          {canSave ? (
            <PrimaryButton
              title="حفظ الحضور"
              onPress={() => void save()}
              disabled={
                saving || !items.some(item => item.status !== "UNMARKED")
              }
              loading={saving}
            />
          ) : null}
        </>
      ) : null}
    </AppPage>
  );
}

export default function InstructorAttendanceRoute() {
  return (
    <RouteGuard route="attendance">
      <AttendanceScreen />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  summary: { gap: mada.space.xs, padding: mada.space.md },
  sessionTitle: {
    color: mada.color.navy,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  summaryText: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    textAlign: "right",
  },
  studentCard: { gap: mada.space.md, padding: mada.space.md },
  studentName: {
    color: mada.color.navy,
    fontSize: mada.type.body,
    fontWeight: "700",
    textAlign: "right",
  },
  options: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: mada.space.sm,
  },
  option: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: mada.space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mada.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.surface,
  },
  optionSelected: {
    borderColor: mada.color.teal,
    backgroundColor: mada.color.tealSoft,
  },
  optionDisabled: { opacity: 0.65 },
  optionText: {
    color: mada.color.muted,
    fontSize: mada.type.caption,
    fontWeight: "600",
  },
  optionTextSelected: { color: mada.color.tealDark, fontWeight: "800" },
  lateRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: mada.space.md,
  },
  lateLabel: { color: mada.color.muted, fontSize: mada.type.caption },
  lateInput: {
    minWidth: 88,
    minHeight: 44,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.small,
    paddingHorizontal: mada.space.md,
    color: mada.color.navy,
    fontFamily: mada.fontFamily.arabic.regular,
    textAlign: "center",
    writingDirection: "ltr",
    backgroundColor: mada.color.surface,
  },
});
