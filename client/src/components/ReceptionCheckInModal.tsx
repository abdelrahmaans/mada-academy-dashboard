import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  X,
  Search,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Keyboard,
  UserCheck,
  AlertCircle,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import "./ReceptionCheckInModal.css";

export interface CheckInStudent {
  id: string;
  name: string;
  parentName: string;
  phone: string;
  groupName: string;
  courseName: string;
  roomName: string;
  coachName: string;
  timeSlot: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
}

// Generate demo reception roster if none provided
const INITIAL_TODAY_ROSTER: CheckInStudent[] = [
  {
    id: "STU-1001",
    name: "يحيى كريم عبد الله",
    parentName: "كريم عبد الله",
    phone: "+201012345678",
    groupName: "Python & AI Explorers",
    courseName: "الذكاء الاصطناعي وبايثون",
    roomName: "معمل البرمجة 1",
    coachName: "م. أحمد عادل",
    timeSlot: "04:00 م - 06:00 م",
    checkedIn: false,
  },
  {
    id: "STU-1002",
    name: "سلمى طارق محمود",
    parentName: "طارق محمود",
    phone: "+201098765432",
    groupName: "EV3 Robotics Champions",
    courseName: "روبوتكس EV3 المتقدم",
    roomName: "قاعة الروبوت الرئيسية",
    coachName: "م. سارة إبراهيم",
    timeSlot: "04:00 م - 06:00 م",
    checkedIn: false,
  },
  {
    id: "STU-1003",
    name: "عمر خالد الشافعي",
    parentName: "خالد الشافعي",
    phone: "+201011223344",
    groupName: "Junior Game Dev Scratch",
    courseName: "تطوير ألعاب سكراتش للأطفال",
    roomName: "معمل الابتكار الصغير",
    coachName: "م. كريم النجار",
    timeSlot: "04:30 م - 06:30 م",
    checkedIn: false,
  },
  {
    id: "STU-1004",
    name: "مريم مصطفى السيد",
    parentName: "مصطفى السيد",
    phone: "+201055667788",
    groupName: "Python & AI Explorers",
    courseName: "الذكاء الاصطناعي وبايثون",
    roomName: "معمل البرمجة 1",
    coachName: "م. أحمد عادل",
    timeSlot: "04:00 م - 06:00 م",
    checkedIn: false,
  },
];

export function ReceptionCheckInModal({ isOpen, onClose, branchName = "الفرع الرئيسي" }: Props) {
  const [roster, setRoster] = useState<CheckInStudent[]>(INITIAL_TODAY_ROSTER);
  const [scanInput, setScanInput] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<CheckInStudent | null>(null);
  const [activeTab, setActiveTab] = useState<"SCAN" | "ROSTER">("SCAN");
  const inputRef = useRef<HTMLInputElement>(null);

  // Play pleasant check-in chime using Web Audio API
  const playCheckInSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio not supported or blocked
    }
  };

  // Body scroll lock & auto-focus
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const performCheckIn = (student: CheckInStudent) => {
    const timeNow = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    const updatedStudent = { ...student, checkedIn: true, checkedInAt: timeNow };

    setRoster(cur => cur.map(s => (s.id === student.id ? updatedStudent : s)));
    setLastCheckIn(updatedStudent);
    playCheckInSound();
    toast.success(`تم تسجيل حضور البطل (${student.name}) بنجاح! 🌟`);
    setScanInput("");
    inputRef.current?.focus();
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toLowerCase();
    if (!query) return;

    // Search by student ID or partial name or phone
    const matched = roster.find(
      s =>
        s.id.toLowerCase() === query ||
        s.name.toLowerCase().includes(query) ||
        s.phone.includes(query)
    );

    if (matched) {
      if (matched.checkedIn) {
        toast.info(`الطالب (${matched.name}) مسجل حضوره بالفعل في تمام الساعة ${matched.checkedInAt}`);
        setScanInput("");
      } else {
        performCheckIn(matched);
      }
    } else {
      toast.error("لم يتم العثور على طالب مطابق لكود أو بيانات الإدخال");
    }
  };

  const checkedInCount = roster.filter(s => s.checkedIn).length;

  return (
    <div
      className="dialog-backdrop reception-modal-backdrop"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="reception-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="reception-modal-header">
          <div className="reception-header-branding">
            <div className="reception-qr-icon">
              <QrCode size={24} />
            </div>
            <div>
              <h3>مسجل الحضور السريع بالاستقبال (Fast QR Check-In)</h3>
              <p>
                فرع {branchName} · تسجيل حضور الطلاب الفوري بمجرد وصولهم للأكاديمية
              </p>
            </div>
          </div>

          <div className="reception-header-meta">
            <span className="checked-counter-pill">
              <UserCheck size={14} />
              <span>
                الحضور اليوم: <strong>{checkedInCount}</strong> من {roster.length}
              </span>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="إغلاق"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="reception-tabs">
          <button
            type="button"
            className={`reception-tab ${activeTab === "SCAN" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("SCAN");
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            <Camera size={15} />
            <span>ماسح الباركود / الإدخال السريع</span>
          </button>
          <button
            type="button"
            className={`reception-tab ${activeTab === "ROSTER" ? "active" : ""}`}
            onClick={() => setActiveTab("ROSTER")}
          >
            <Users size={15} />
            <span>كشف طلاب حصص اليوم ({roster.length})</span>
          </button>
        </div>

        {activeTab === "SCAN" && (
          <div className="reception-scan-content">
            {/* Input Bar */}
            <form onSubmit={handleScanSubmit} className="scan-input-box">
              <div className="scan-field-wrap">
                <Keyboard size={20} className="scan-field-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  placeholder="امسح الـ QR كود، أو اكتب كود الطالب (مثال: STU-1001) أو الاسم..."
                  className="scan-text-input"
                />
              </div>
              <button type="submit" className="scan-submit-btn">
                <span>تأكيد الحضور</span>
              </button>
            </form>

            <div className="scan-hint-banner">
              <span>💡 نصيحة: يدعم مسدسات الباركود وقارئات الـ QR السلكية واللاسلكية بشكل مباشر وتلقائي.</span>
            </div>

            {/* Success Card Feedback */}
            {lastCheckIn && (
              <div className="last-checkin-card">
                <div className="checkin-badge-row">
                  <span className="success-tag">
                    <CheckCircle2 size={16} /> تم تسجيل الحضور الآن
                  </span>
                  <span className="checkin-time-tag">
                    <Clock size={13} /> في تمام: {lastCheckIn.checkedInAt}
                  </span>
                </div>

                <div className="student-highlight-row">
                  <div className="student-avatar-large">
                    {lastCheckIn.name.slice(0, 2)}
                  </div>
                  <div className="student-info-meta">
                    <h4>{lastCheckIn.name}</h4>
                    <span className="student-code-tag">{lastCheckIn.id}</span>
                  </div>
                </div>

                <div className="checkin-details-grid">
                  <div className="detail-pill">
                    <small>المجموعة التدريبية</small>
                    <strong>{lastCheckIn.groupName}</strong>
                  </div>
                  <div className="detail-pill">
                    <small>القاعة والمعمل</small>
                    <strong>
                      <MapPin size={13} /> {lastCheckIn.roomName}
                    </strong>
                  </div>
                  <div className="detail-pill">
                    <small>المدرب المسؤول</small>
                    <strong>{lastCheckIn.coachName}</strong>
                  </div>
                  <div className="detail-pill">
                    <small>موعد الحصة</small>
                    <strong>{lastCheckIn.timeSlot}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "ROSTER" && (
          <div className="reception-roster-content">
            <table className="reception-roster-table">
              <thead>
                <tr>
                  <th>كود الطالب</th>
                  <th>اسم الطالب وولي الأمر</th>
                  <th>المجموعة والكورس</th>
                  <th>القاعة والمدرب</th>
                  <th>موعد الحصة</th>
                  <th>حالة الحضور</th>
                  <th style={{ textAlign: "center" }}>تسجيل فوري</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(student => (
                  <tr key={student.id} className={student.checkedIn ? "checked-in-row" : ""}>
                    <td className="code-cell">{student.id}</td>
                    <td>
                      <strong>{student.name}</strong>
                      <small style={{ display: "block", color: "#64748b" }}>
                        ولي الأمر: {student.parentName}
                      </small>
                    </td>
                    <td>
                      <span>{student.groupName}</span>
                      <small style={{ display: "block", color: "#0d9488" }}>
                        {student.courseName}
                      </small>
                    </td>
                    <td>
                      <span>{student.roomName}</span>
                      <small style={{ display: "block", color: "#64748b" }}>
                        {student.coachName}
                      </small>
                    </td>
                    <td>{student.timeSlot}</td>
                    <td>
                      {student.checkedIn ? (
                        <span className="status-pill present">
                          <CheckCircle2 size={12} /> حاضر ({student.checkedInAt})
                        </span>
                      ) : (
                        <span className="status-pill pending">
                          <Clock size={12} /> لم يحضر بعد
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {student.checkedIn ? (
                        <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 700 }}>
                          تم التسجيل ✅
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="checkin-btn-action"
                          onClick={() => performCheckIn(student)}
                        >
                          <UserCheck size={14} /> تسجيل الحضور
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
