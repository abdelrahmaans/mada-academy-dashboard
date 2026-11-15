import React, { useState, useEffect } from "react";
import {
  Clock,
  Tv,
  Maximize2,
  Minimize2,
  MapPin,
  Trophy,
  Users,
  Sparkles,
  Medal,
  CalendarDays,
  Flame,
  Volume2,
} from "lucide-react";
import "./LobbyDisplay.css";

interface LobbySession {
  id: string;
  courseName: string;
  groupName: string;
  track: "robotics" | "ai" | "programming" | "scratch";
  roomName: string;
  coachName: string;
  timeSlot: string;
  status: "LIVE" | "UPCOMING" | "DONE";
  studentsCount: number;
}

interface HallOfFameStudent {
  id: string;
  name: string;
  award: string;
  tournament: string;
  rank: string;
  medalColor: string;
}

const DEMO_LOBBY_SESSIONS: LobbySession[] = [
  {
    id: "LS-1",
    courseName: "الذكاء الاصطناعي وتطبيقات بايثون",
    groupName: "Python & AI Explorers A1",
    track: "ai",
    roomName: "معمل البرمجة والـ AI 1",
    coachName: "م. أحمد عادل",
    timeSlot: "04:00 م - 06:00 م",
    status: "LIVE",
    studentsCount: 12,
  },
  {
    id: "LS-2",
    courseName: "روبوتكس EV3 المتقدم وحقائب المسابقات",
    groupName: "EV3 Robotics Champions B2",
    track: "robotics",
    roomName: "قاعة الروبوتات والأنظمة الذكية",
    coachName: "م. سارة إبراهيم",
    timeSlot: "04:00 م - 06:00 م",
    status: "LIVE",
    studentsCount: 14,
  },
  {
    id: "LS-3",
    courseName: "برمجة ألعاب سكراتش وتفكير منطقي",
    groupName: "Junior Game Creators C1",
    track: "scratch",
    roomName: "معمل الابتكار الصغير",
    coachName: "م. كريم النجار",
    timeSlot: "06:15 م - 08:15 م",
    status: "UPCOMING",
    studentsCount: 10,
  },
  {
    id: "LS-4",
    courseName: "هندسة الإلكترونيات والأردوينو (IoT)",
    groupName: "Arduino Makers & Circuits D1",
    track: "programming",
    roomName: "معمل إنترنت الأشياء والدوائر",
    coachName: "م. نورهان خالد",
    timeSlot: "06:30 م - 08:30 م",
    status: "UPCOMING",
    studentsCount: 11,
  },
];

const DEMO_HONOR_ROLL: HallOfFameStudent[] = [
  {
    id: "HR-1",
    name: "يحيى كريم عبد الله",
    award: "المركز الأول - بطولة الجمهورية WRO",
    tournament: "بطولة الروبوتات 2026",
    rank: "المركز الأول 🥇",
    medalColor: "#f59e0b",
  },
  {
    id: "HR-2",
    name: "سلمى طارق محمود",
    award: "جائزة أفضل كود وبرمجة ذاتية",
    tournament: "Cairo Hackathon 2026",
    rank: "Best Code Award 💡",
    medalColor: "#0d9488",
  },
  {
    id: "HR-3",
    name: "فريق فرسان مدى (Mada Knights)",
    award: "الميدالية الذهبية - فئة الأنظمة الذكية",
    tournament: "أولمبياد الذكاء الاصطناعي",
    rank: "الميدالية الذهبية 🌟",
    medalColor: "#d97706",
  },
];

export default function LobbyDisplay() {
  const [sessions, setSessions] = useState<LobbySession[]>(DEMO_LOBBY_SESSIONS);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeHonorIndex, setActiveHonorIndex] = useState(0);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotating Honor Roll
  useEffect(() => {
    const honorInterval = setInterval(() => {
      setActiveHonorIndex(cur => (cur + 1) % DEMO_HONOR_ROLL.length);
    }, 6000);
    return () => clearInterval(honorInterval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentHonor = DEMO_HONOR_ROLL[activeHonorIndex];

  return (
    <div className="lobby-display-root" dir="rtl">
      {/* Top Banner */}
      <header className="lobby-header">
        <div className="lobby-branding">
          <div className="lobby-logo-shield">MADA</div>
          <div>
            <h1>أكاديمية مَدى للتعليم التقني والابتكار</h1>
            <p>Mada Academy for Robotics & AI · شاشة البهو والاستقبال المباشرة</p>
          </div>
        </div>

        <div className="lobby-live-ticker">
          <span className="live-dot-pulse" />
          <span className="live-label">بث حي مباشر</span>
          <span className="branch-tag">
            <MapPin size={14} /> الفرع الرئيسي
          </span>
        </div>

        <div className="lobby-clock-box">
          <div className="lobby-clock-time">{currentTime}</div>
          <div className="lobby-clock-date">{currentDate}</div>
        </div>

        <button
          type="button"
          className="fullscreen-toggle-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "إنهاء وضع ملء الشاشة" : "وضع ملء الشاشة (Lobby TV)"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </header>

      {/* Main Grid */}
      <main className="lobby-main-grid">
        {/* Left/Main Column: Sessions by Classroom */}
        <section className="lobby-sessions-panel">
          <div className="panel-headline">
            <div className="headline-left">
              <CalendarDays size={20} className="text-teal-400" />
              <h2>جدول الجلسات والمعامل لليوم</h2>
            </div>
            <span className="headline-sub">تحديث لحظي لحالة القاعات والمعامل التدريبية</span>
          </div>

          <div className="lobby-sessions-grid">
            {sessions.map(s => {
              const isLive = s.status === "LIVE";
              return (
                <div
                  key={s.id}
                  className={`lobby-session-card track-${s.track} ${isLive ? "is-live" : ""}`}
                >
                  <div className="session-status-ribbon">
                    {isLive ? (
                      <span className="live-pulse-badge">
                        <span className="pulse-circle" /> جارية الآن
                      </span>
                    ) : (
                      <span className="upcoming-badge">
                        <Clock size={12} /> تبدأ قريباً
                      </span>
                    )}
                    <span className="time-range-tag">{s.timeSlot}</span>
                  </div>

                  <div className="session-card-body">
                    <h3 className="course-title">{s.courseName}</h3>
                    <div className="group-sub">{s.groupName}</div>

                    <div className="session-meta-row">
                      <div className="meta-item room-item">
                        <small>القاعة / المعمل:</small>
                        <strong>
                          <MapPin size={14} /> {s.roomName}
                        </strong>
                      </div>

                      <div className="meta-item coach-item">
                        <small>المدرب:</small>
                        <strong>{s.coachName}</strong>
                      </div>

                      <div className="meta-item students-item">
                        <small>الحضور المسجل:</small>
                        <strong>
                          <Users size={14} /> {s.studentsCount} طلاب
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Rotating Hall of Fame Banner */}
        <aside className="lobby-sidebar">
          {/* Hall of Fame Spotlight */}
          <div className="lobby-honor-card">
            <div className="honor-header">
              <div className="honor-icon-wrap">
                <Trophy size={26} color="#f59e0b" />
              </div>
              <div>
                <h3>لوحة الشرف وأبطال مدى</h3>
                <small>تكريم وتوثيق إنجازات الطلاب التنافسية</small>
              </div>
            </div>

            <div className="honor-body" key={currentHonor.id}>
              <div className="honor-medal-badge" style={{ borderColor: currentHonor.medalColor }}>
                <Medal size={36} color={currentHonor.medalColor} />
              </div>

              <h4 className="honor-student-name">{currentHonor.name}</h4>
              <div className="honor-rank-pill">{currentHonor.rank}</div>

              <div className="honor-award-title">{currentHonor.award}</div>
              <div className="honor-tournament-sub">{currentHonor.tournament}</div>
            </div>

            <div className="honor-dots">
              {DEMO_HONOR_ROLL.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === activeHonorIndex ? "active" : ""}`}
                  onClick={() => setActiveHonorIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* Academy Motivational Ticker */}
          <div className="lobby-quote-card">
            <div className="quote-icon">
              <Sparkles size={20} color="#0d9488" />
            </div>
            <p>
              "في أكاديمية مَدى، نبني العقول المفكرة، ونطلق شغف الجيل القادم نحو الذكاء الاصطناعي،
              الروبوتات، والابتكار بلا حدود."
            </p>
            <span>إدارة التدريب والتعليم التقني 🚀</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
