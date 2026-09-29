import { CheckCircle2, LockKeyhole, Star, Trophy } from "lucide-react";

export type StudentAchievement = {
  title: string;
  detail: string;
  unlocked: boolean;
};
export type StudentProgressCardProps = {
  progress: number;
  currentUnit: string;
  nextCheckpoint: string;
  achievements: StudentAchievement[];
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
        <b>{progress}%</b>
      </div>
      <div className="student-progress-bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="student-progress-meta">
        <span>
          الوحدة الحالية<strong>{currentUnit}</strong>
        </span>
        <span>
          المحطة القادمة<strong>{nextCheckpoint}</strong>
        </span>
      </div>
      <div className="student-achievements">
        <div className="student-achievements-title">
          <span>
            <Star size={14} /> إنجازاتي
          </span>
          <small>
            {achievements.filter(item => item.unlocked).length} من{" "}
            {achievements.length} مفتوح
          </small>
        </div>
        {achievements.map(item => (
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
        ))}
      </div>
    </section>
  );
}
