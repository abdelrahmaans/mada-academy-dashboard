import React, { useEffect, useState } from "react";
import { Trophy, Medal, Award, Flame, Star, Sparkles, RefreshCw } from "lucide-react";
import { apiClient, type GroupLeaderboardItem } from "@/lib/apiClient";

export interface GroupLeaderboardCardProps {
  groupId?: string;
  currentStudentId?: string;
  fallbackItems?: GroupLeaderboardItem[];
}

const BADGE_MAP: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  CHALLENGE_MASTER: { label: "بطل التحدي", icon: "🎯", bg: "#fef3c7", text: "#92400e" },
  CREATIVE_THINKER: { label: "مفكر مبدع", icon: "💡", bg: "#f0fdf4", text: "#166534" },
  TOP_PERFORMER: { label: "أداء استثنائي", icon: "⭐", bg: "#ede9fe", text: "#5b21b6" },
  TEAM_PLAYER: { label: "روح الفريق", icon: "🤝", bg: "#e0f2fe", text: "#0369a1" },
  PERFECT_ATTENDANCE: { label: "حضور مثالي", icon: "🌟", bg: "#fdf2f8", text: "#9d174d" },
};

const DEMO_LEADERBOARD: GroupLeaderboardItem[] = [
  {
    studentId: "demo-s1",
    studentName: "لينا عمر (Lina Omar)",
    rank: 1,
    totalXp: 385,
    attendedSessions: 4,
    totalSessions: 4,
    averageScore: 94,
    bonusPoints: 45,
    badges: ["CHALLENGE_MASTER", "TOP_PERFORMER", "PERFECT_ATTENDANCE"],
  },
  {
    studentId: "demo-s2",
    studentName: "أحمد يوسف (Ahmed Youssef)",
    rank: 2,
    totalXp: 340,
    attendedSessions: 4,
    totalSessions: 4,
    averageScore: 88,
    bonusPoints: 30,
    badges: ["CREATIVE_THINKER", "PERFECT_ATTENDANCE"],
  },
  {
    studentId: "demo-s3",
    studentName: "يوسف كريم (Youssef Karim)",
    rank: 3,
    totalXp: 305,
    attendedSessions: 3,
    totalSessions: 4,
    averageScore: 85,
    bonusPoints: 20,
    badges: ["TEAM_PLAYER"],
  },
  {
    studentId: "demo-s4",
    studentName: "مريم خالد (Mariam Khaled)",
    rank: 4,
    totalXp: 280,
    attendedSessions: 3,
    totalSessions: 4,
    averageScore: 82,
    bonusPoints: 15,
    badges: ["CREATIVE_THINKER"],
  },
];

export default function GroupLeaderboardCard({
  groupId,
  currentStudentId,
  fallbackItems = DEMO_LEADERBOARD,
}: GroupLeaderboardCardProps) {
  const [items, setItems] = useState<GroupLeaderboardItem[]>(fallbackItems);
  const [groupName, setGroupName] = useState<string>("مجموعتي التدريبية");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    let active = true;
    setLoading(true);

    apiClient
      .getConsumerGroupLeaderboard(groupId)
      .then((res) => {
        if (!active) return;
        if (res.items && res.items.length > 0) {
          setItems(res.items);
          if (res.groupName) setGroupName(res.groupName);
        }
      })
      .catch(() => {
        // Fallback to demo items if offline or group not yet evaluated
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [groupId]);

  const top3 = items.slice(0, 3);

  return (
    <section className="consumer-panel" style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #e2ecec", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #fef08a, #f59e0b)", color: "#78350f", display: "grid", placeItems: "center" }}>
            <Trophy size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: 800 }}>لوحة شرف المجموعة (Group Leaderboard)</h2>
            <small style={{ color: "#64748b" }}>{groupName} · ترتيب المتدربين حسب نقاط التحدي والإنجاز (XP)</small>
          </div>
        </div>
        {loading && (
          <span style={{ fontSize: "0.8rem", color: "#0d9488", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={13} className="animate-spin" /> تحديث...
          </span>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "18px" }}>
          {top3.map((student, idx) => {
            const isMe = currentStudentId && student.studentId === currentStudentId;
            const medals = ["🥇", "🥈", "🥉"];
            const colors = [
              { border: "#fde047", bg: "#fefce8", badge: "#ca8a04" },
              { border: "#cbd5e1", bg: "#f8fafc", badge: "#64748b" },
              { border: "#fdba74", bg: "#fff7ed", badge: "#ea580c" },
            ];
            const cfg = colors[idx] ?? colors[1];
            return (
              <div
                key={student.studentId}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: `2px solid ${isMe ? "#0d9488" : cfg.border}`,
                  background: isMe ? "#f0fdfa" : cfg.bg,
                  textAlign: "center",
                  position: "relative",
                  boxShadow: isMe ? "0 0 0 2px #0d948840" : "none",
                }}
              >
                <span style={{ fontSize: "1.3rem", display: "block", marginBottom: "4px" }}>{medals[idx]}</span>
                <strong style={{ fontSize: "0.85rem", color: isMe ? "#0f766e" : "#1e293b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {student.studentName.split(" ")[0]} {isMe ? "(أنت)" : ""}
                </strong>
                <span style={{ display: "inline-block", margin: "4px 0", padding: "2px 8px", borderRadius: "99px", background: cfg.badge, color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>
                  {student.totalXp} XP ⚡
                </span>
                <small style={{ display: "block", color: "#64748b", fontSize: "0.7rem" }}>
                  نسبة التقييم: {student.averageScore}%
                </small>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Detailed Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "right" }}>
              <th style={{ padding: "8px 6px" }}>الترتيب</th>
              <th style={{ padding: "8px 6px" }}>الطالب</th>
              <th style={{ padding: "8px 6px" }}>الأوسمة</th>
              <th style={{ padding: "8px 6px" }}>الحضور</th>
              <th style={{ padding: "8px 6px" }}>متوسط التقييم</th>
              <th style={{ padding: "8px 6px", textAlign: "left" }}>مجموع XP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const isMe = currentStudentId && row.studentId === currentStudentId;
              return (
                <tr
                  key={row.studentId}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: isMe ? "#f0fdfa" : "transparent",
                    fontWeight: isMe ? 700 : 400,
                  }}
                >
                  <td style={{ padding: "10px 6px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        background: row.rank === 1 ? "#fef08a" : row.rank === 2 ? "#e2e8f0" : row.rank === 3 ? "#fed7aa" : "#f1f5f9",
                        color: row.rank <= 3 ? "#78350f" : "#64748b",
                      }}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td style={{ padding: "10px 6px", color: isMe ? "#0f766e" : "#0f172a" }}>
                    {row.studentName} {isMe && <span style={{ fontSize: "0.75rem", color: "#0d9488", marginInlineStart: "4px" }}>★ أنت</span>}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {row.badges.map((b) => {
                        const meta = BADGE_MAP[b] ?? { label: b, icon: "🎖️", bg: "#f1f5f9", text: "#475569" };
                        return (
                          <span
                            key={b}
                            title={meta.label}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              fontSize: "0.7rem",
                              background: meta.bg,
                              color: meta.text,
                              fontWeight: 700,
                            }}
                          >
                            <span>{meta.icon}</span> {meta.label}
                          </span>
                        );
                      })}
                      {row.badges.length === 0 && (
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "10px 6px", color: "#475569" }}>
                    {row.attendedSessions}/{row.totalSessions} جلسة
                  </td>
                  <td style={{ padding: "10px 6px", color: "#475569" }}>
                    ★ {row.averageScore}%
                  </td>
                  <td style={{ padding: "10px 6px", textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#4338ca", fontWeight: 800 }}>
                      <Flame size={14} color="#f59e0b" /> {row.totalXp} XP
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
