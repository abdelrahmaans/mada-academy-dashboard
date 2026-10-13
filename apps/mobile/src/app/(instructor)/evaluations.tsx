import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import type {
  AttendanceResponse,
  SessionEvaluationRecord,
  SessionRecord,
} from "../../api/apiClient";
import { ApiRequestError, apiClient } from "../../api/apiClient";
import { useAuth } from "../../auth/AuthProvider";
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
import { canWriteEvaluations } from "../../features/sessions/sessionAccess";
import { mada } from "../../theme/tokens";

type EvaluationDraft = { score: string; notes: string };

function EvaluationsScreen() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const { identity } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [roster, setRoster] = useState<AttendanceResponse["items"]>([]);
  const [evaluations, setEvaluations] = useState<SessionEvaluationRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setError("لم يصل معرّف الجلسة. ارجع إلى الجدول وافتح تقييمات الجلسة.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const sessionResult = await apiClient.getSession(sessionId);
      setSession(sessionResult);
      if (!identity || !canWriteEvaluations(identity, sessionResult)) {
        setError(
          "التقييم متاح للمدرب المسند أو البديل فقط، ولا تمنح صلاحية الإشراف صلاحية الكتابة."
        );
        setLoading(false);
        return;
      }
      const [attendanceResult, evaluationResult] = await Promise.all([
        apiClient.getSessionAttendance(sessionId),
        apiClient.listSessionEvaluations(sessionId),
      ]);
      const rosterItems = attendanceResult.items;
      setRoster(rosterItems);
      setEvaluations(evaluationResult.items);
      const existingByStudent = new Map(
        evaluationResult.items.map(item => [item.studentId, item])
      );
      setDrafts(
        Object.fromEntries(
          rosterItems.map(student => {
            const saved = existingByStudent.get(student.studentId);
            return [
              student.studentId,
              {
                score: saved?.score == null ? "" : String(saved.score),
                notes: saved?.notes ?? "",
              },
            ];
          })
        )
      );
      setSelectedStudentId(current =>
        current && rosterItems.some(student => student.studentId === current)
          ? current
          : (rosterItems[0]?.studentId ?? null)
      );
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError && cause.status === 403
          ? "ليس لديك صلاحية تقييم هذه الجلسة."
          : cause instanceof Error
            ? cause.message
            : "تعذر تحميل بيانات التقييم."
      );
    } finally {
      setLoading(false);
    }
  }, [identity, sessionId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const selectedStudent = useMemo(
    () =>
      roster.find(student => student.studentId === selectedStudentId) ?? null,
    [roster, selectedStudentId]
  );
  const existingEvaluation = useMemo(
    () =>
      evaluations.find(item => item.studentId === selectedStudentId) ?? null,
    [evaluations, selectedStudentId]
  );
  const currentDraft = selectedStudentId
    ? (drafts[selectedStudentId] ?? { score: "", notes: "" })
    : { score: "", notes: "" };
  const isLocked = ["SUBMITTED", "PUBLISHED"].includes(
    existingEvaluation?.status.toUpperCase() ?? ""
  );
  const isMutating = saving || submitting;

  const updateDraft = (update: Partial<EvaluationDraft>) => {
    if (!selectedStudentId || isMutating) return;
    setDrafts(current => ({
      ...current,
      [selectedStudentId]: { ...currentDraft, ...update },
    }));
    setActionError(null);
    setMessage(null);
  };

  const parsedScore = currentDraft.score.trim()
    ? Number(currentDraft.score)
    : null;
  const validateScore = () => {
    if (
      parsedScore !== null &&
      (!Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > 100)
    ) {
      setActionError("الدرجة يجب أن تكون رقمًا صحيحًا من 0 إلى 100.");
      return false;
    }
    if (currentDraft.notes.length > 2000) {
      setActionError("الملاحظة لا يمكن أن تتجاوز 2000 حرف.");
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    if (!sessionId || !selectedStudentId || isLocked || !validateScore())
      return;
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      await apiClient.saveSessionEvaluations(sessionId, [
        {
          studentId: selectedStudentId,
          score: parsedScore,
          notes: currentDraft.notes,
        },
      ]);
      setMessage("تم حفظ المسودة على الخادم.");
      await load();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "تعذر حفظ المسودة."
      );
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!sessionId || !selectedStudentId || isLocked || !validateScore())
      return;
    if (parsedScore === null || !currentDraft.notes.trim()) {
      setActionError("أدخل درجة وملاحظة بناءة قبل الإرسال للمراجعة.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setMessage(null);
    try {
      await apiClient.saveSessionEvaluations(sessionId, [
        {
          studentId: selectedStudentId,
          score: parsedScore,
          notes: currentDraft.notes,
        },
      ]);
      await apiClient.submitSessionEvaluations(sessionId, [selectedStudentId]);
      setMessage("تم إرسال التقييم للمراجعة الأكاديمية. لم يُنشر لولي الأمر.");
      await load();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? `تعذر إتمام الإرسال: ${cause.message}`
          : "تعذر إرسال التقييم للمراجعة."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen title="جارٍ تحميل الطلاب والتقييمات…" />;

  return (
    <AppPage>
      <PageHeading
        eyebrow="تقييم الجلسة"
        title="تقييم الطلاب"
        subtitle={session?.courseName ?? "درجة واحدة وملاحظة بناءة لكل طالب."}
      />
      {error ? (
        <MessageCard
          title="تعذر فتح التقييم"
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
      {!error && session ? (
        <>
          <MadaCard style={styles.summary}>
            <Text style={styles.sessionTitle}>
              {session.courseName ?? `الجلسة ${session.sessionNumber}`}
            </Text>
            <Text style={styles.summaryText}>
              الطلاب: {roster.length} · الدرجة من 100
            </Text>
          </MadaCard>
          {roster.length === 0 ? (
            <MessageCard
              title="لا يوجد طلاب لتقييمهم"
              detail="لم يُرجع الخادم طلابًا مسجلين في المجموعة المرتبطة بهذه الجلسة."
            />
          ) : null}
          {roster.length > 0 ? (
            <>
              <View style={styles.studentPicker}>
                {roster.map(student => {
                  const selected = student.studentId === selectedStudentId;
                  const status = evaluations.find(
                    item => item.studentId === student.studentId
                  )?.status;
                  return (
                    <Pressable
                      key={student.studentId}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: isMutating }}
                      disabled={isMutating}
                      accessibilityLabel={`اختيار الطالب ${student.studentName}${status ? `، ${status}` : "، لا يوجد تقييم محفوظ"}`}
                      onPress={() => setSelectedStudentId(student.studentId)}
                      style={[
                        styles.studentChoice,
                        selected ? styles.studentChoiceSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.studentChoiceText,
                          selected ? styles.studentChoiceTextSelected : null,
                        ]}
                      >
                        {student.studentName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedStudent ? (
                <MadaCard style={styles.form}>
                  <Text style={styles.studentName}>
                    {selectedStudent.studentName}
                  </Text>
                  {existingEvaluation ? (
                    <MessageCard
                      title={`حالة التقييم: ${existingEvaluation.status}`}
                      detail={
                        existingEvaluation.reviewNote ??
                        (isLocked
                          ? "أُرسل التقييم ولا يمكن تعديله حتى تعيده المراجعة للتعديل."
                          : "يمكنك متابعة المسودة أو تعديلها قبل الإرسال.")
                      }
                      tone={isLocked ? "info" : "warning"}
                    />
                  ) : null}
                  {isLocked ? null : (
                    <>
                      <Text style={styles.label}>الدرجة (0–100)</Text>
                      <TextInput
                        accessibilityLabel="درجة الطالب من صفر إلى مئة"
                        editable={!isLocked && !isMutating}
                        keyboardType="number-pad"
                        value={currentDraft.score}
                        onChangeText={value =>
                          updateDraft({
                            score: value.replace(/\D/g, "").slice(0, 3),
                          })
                        }
                        placeholder="مثال: 85"
                        placeholderTextColor={mada.color.muted}
                        style={styles.scoreInput}
                      />
                      <Text style={styles.label}>ملاحظة بنّاءة</Text>
                      <TextInput
                        accessibilityLabel="ملاحظة التقييم"
                        editable={!isLocked && !isMutating}
                        multiline
                        maxLength={2000}
                        value={currentDraft.notes}
                        onChangeText={value => updateDraft({ notes: value })}
                        placeholder="اكتب ملاحظة واضحة تساعد الطالب على التطور…"
                        placeholderTextColor={mada.color.muted}
                        textAlignVertical="top"
                        style={styles.notesInput}
                      />
                      <Text style={styles.counter}>
                        {currentDraft.notes.length} / 2000
                      </Text>
                    </>
                  )}
                  {actionError ? (
                    <MessageCard
                      title="لم يكتمل الإجراء"
                      detail={actionError}
                      tone="error"
                    />
                  ) : null}
                  {message ? <MessageCard title="تم" detail={message} /> : null}
                  {!isLocked ? (
                    <>
                      <PrimaryButton
                        title="حفظ المسودة"
                        onPress={() => void saveDraft()}
                        loading={saving}
                        disabled={isMutating}
                      />
                      <PrimaryButton
                        title="إرسال للمراجعة الأكاديمية"
                        onPress={() => void submitForReview()}
                        loading={submitting}
                        disabled={isMutating}
                        secondary
                      />
                    </>
                  ) : null}
                </MadaCard>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </AppPage>
  );
}

export default function InstructorEvaluationsRoute() {
  return (
    <RouteGuard route="evaluations">
      <EvaluationsScreen />
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
  studentPicker: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: mada.space.sm,
  },
  studentChoice: {
    minHeight: 44,
    paddingHorizontal: mada.space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mada.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mada.color.surface,
  },
  studentChoiceSelected: {
    borderColor: mada.color.teal,
    backgroundColor: mada.color.tealSoft,
  },
  studentChoiceText: { color: mada.color.muted, fontSize: mada.type.caption },
  studentChoiceTextSelected: { color: mada.color.tealDark, fontWeight: "800" },
  form: { gap: mada.space.md },
  studentName: {
    color: mada.color.navy,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  label: {
    color: mada.color.navy,
    fontSize: mada.type.caption,
    fontWeight: "700",
    textAlign: "right",
  },
  scoreInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.small,
    paddingHorizontal: mada.space.md,
    color: mada.color.navy,
    fontFamily: mada.fontFamily.arabic.regular,
    fontSize: 18,
    textAlign: "center",
    writingDirection: "ltr",
    backgroundColor: mada.color.surface,
  },
  notesInput: {
    minHeight: 136,
    borderWidth: 1,
    borderColor: mada.color.border,
    borderRadius: mada.radius.small,
    padding: mada.space.md,
    color: mada.color.navy,
    fontFamily: mada.fontFamily.arabic.regular,
    fontSize: mada.type.body,
    lineHeight: 24,
    textAlign: "right",
    backgroundColor: mada.color.surface,
  },
  counter: { color: mada.color.muted, fontSize: 11, textAlign: "left" },
});
