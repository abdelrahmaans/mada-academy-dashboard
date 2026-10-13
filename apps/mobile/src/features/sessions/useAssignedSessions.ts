import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiClient, type SessionRecord } from "../../api/apiClient";

export function useAssignedSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    setAsOf(now.getTime());
    const from = new Date(now);
    from.setDate(from.getDate() - 14);
    const to = new Date(now);
    to.setDate(to.getDate() + 45);
    try {
      const result = await apiClient.listSessions({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setSessions(
        [...result.items].sort(
          (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)
        )
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر تحميل الجلسات المسندة."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { sessions, loading, error, refresh, asOf };
}
