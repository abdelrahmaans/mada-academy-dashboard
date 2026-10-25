import { CheckCircle2, LockKeyhole, Star, Trophy } from "lucide-react";

export type StudentAchievement = {
  title: string;
  detail: string;
  unlocked: boolean;
};

export type StudentProgressCardProps = {
  progress: number | null;
  currentUnit: string | null;
  nextCheckpoint: string | null;
  achievements: StudentAchievement[] | null;
};

export default function StudentProgressCard({
  progress,
  currentUnit,
  nextCheckpoint,
  achievements,
}: StudentProgressCardProps) {
  return (
    <section className="student-progress-card">
      <div className="student-progress-heading">
        <span>
          <Trophy size={17} />
        </span>
        <div>
          <small>رحلتي التعليمية</small>
          <strong>تقدمي في المسار</strong>
        </div>
        <b>{progress === null ? "—" : `${progress}%`}</b>
      </div>
      <div className="student-progress-bar">
        <i style={{ width: `${progress ?? 0}%` }} />
      </div>
      <div className="student-progress-meta">
        <span>
          الوحدة الحالية<strong>{currentUnit ?? "غير متاح"}</strong>
        </span>
        <span>
          المحطة القادمة<strong>{nextCheckpoint ?? "غير متاح"}</strong>
        </span>
      </div>
      <div className="student-achievements">
        <div className="student-achievements-title">
          <span>
            <Star size={14} /> إنجازاتي
          </span>
          <small>
            {achievements === null
              ? "غير متاح"
              : `${achievements.filter(item => item.unlocked).length} من ${achievements.length} مفتوح`}
          </small>
        </div>
        {achievements === null ? (
          <p role="status" style={{ margin: "10px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            لا تتوفر بيانات الإنجازات من الخادم حاليًا.
          </p>
        ) : (
          achievements.map(item => (
            <div
              className={`student-achievement ${item.unlocked ? "unlocked" : "locked"}`}
              key={item.title}
            >
              {item.unlocked ? (
                <CheckCircle2 size={15} />
              ) : (
                <LockKeyhole size={15} />
              )}
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
