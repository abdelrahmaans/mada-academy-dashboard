import React, { useState } from "react";
import {
  AlertCircle,
  Armchair,
  Award,
  Box,
  Building2,
  CheckCircle,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Layers,
  MapPin,
  Monitor,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { Course, Offering } from "@/pages/ClassesTypes";

interface BranchReadinessTabProps {
  branchName: string;
  courses: Course[];
  offerings: Offering[];
  onOpenCreateGroupForCourse?: (courseId: string) => void;
  onOpenCreateGroupModal: () => void;
}

export function BranchReadinessTab({
  branchName,
  courses,
  offerings,
  onOpenCreateGroupForCourse,
  onOpenCreateGroupModal,
}: BranchReadinessTabProps) {
  const [activeSection, setActiveSection] = useState<"ALL" | "ROOMS" | "KITS" | "COURSES" | "COMPETITIONS">("ALL");

  // Sample real data for Branch Facilities & Rooms
  const roomsData = [
    {
      id: "room-1",
      name: "معمل الروبوتكس والذكاء الاصطناعي 1",
      type: "معمل عتاد وروبوتكس",
      capacity: 12,
      activeGroupsCount: offerings.filter(o => o.classroom.includes("1") || o.classroom.includes("معمل 1")).length || 2,
      equipment: ["12 جهاز لابتوب Core i7", "شاشة تفاعلية 65 بوصة", "طاولة حلبة WRO الرسمية", "وحدات شحن متزامنة"],
      status: "AVAILABLE",
      notes: "جاهز تماماً للتشغيل ولا توجد أعطال في أجهزة اللابتوب.",
    },
    {
      id: "room-2",
      name: "قاعة البرمجة وتطوير الألعاب 2",
      type: "قاعة برمجيات وحواسيب",
      capacity: 15,
      activeGroupsCount: offerings.filter(o => o.classroom.includes("2") || o.classroom.includes("قاعة 2")).length || 1,
      equipment: ["15 محطة عمل متصلة بالإنترنت", "جهاز بروجيكتور تفاعلي", "سيرفر تدريب محلي", "سبورة بيضاء ذكية"],
      status: "AVAILABLE",
      notes: "تم تحديث بيئات عمل بايثون وVS Code في كافة الأجهزة.",
    },
    {
      id: "room-3",
      name: "معمل الإلكترونيات والمبتكر الصغير 3",
      type: "معمل دوائر وتجارب",
      capacity: 10,
      activeGroupsCount: offerings.filter(o => o.classroom.includes("3") || o.classroom.includes("معمل 3")).length || 1,
      equipment: ["محطات تغذية باور سبلاي آمنة", "أجهزة راسم إشارة Oscilloscope", "طابعة ثلاثية الأبعاد 3D Printer", "أدوات قياس ديجيتال"],
      status: "AVAILABLE",
      notes: "محطات الأمان معتمدة ومطابقة لمواصفات تدريب الأطفال.",
    },
  ];

  // Educational Kits & Hardware Inventory
  const kitsData = [
    {
      id: "kit-1",
      name: "حقائب LEGO Education SPIKE Prime",
      track: "روبوتكس ومسابقات",
      totalQuantity: 14,
      readyQuantity: 12,
      maintenanceQuantity: 2,
      supportsStudents: "24 طالباً (طالبان / حقيبة)",
      status: "READY",
      notes: "الحقائب مراجعة ومحدثة بآخر فيرموير. حقيبتان تخضعان لفحص حساس الألوان.",
    },
    {
      id: "kit-2",
      name: "أطقم Arduino Uno & Sensors Advanced",
      track: "دوائر إلكترونية و IoT",
      totalQuantity: 20,
      readyQuantity: 20,
      maintenanceQuantity: 0,
      supportsStudents: "20 طالباً (طالب / طقم)",
      status: "READY",
      notes: "متوفر مع كل طقم شيلد المحركات ومستشعرات المسافة والحرارة والبلوتوث.",
    },
    {
      id: "kit-3",
      name: "روبوتات VEX IQ System (Gen 2)",
      track: "الروبوتات التنافسية",
      totalQuantity: 4,
      readyQuantity: 4,
      maintenanceQuantity: 0,
      supportsStudents: "16 طالباً (4 طلاب / فريق تنافسي)",
      status: "READY",
      notes: "شامل حلبة التحدي الرسمية 6x8 والعناصر الميدانية للتدريب على بطولات VEX.",
    },
    {
      id: "kit-4",
      name: "كروت BBC Micro:bit v2 & Smart Car Kits",
      track: "المبتكر الصغير والبرمجة",
      totalQuantity: 18,
      readyQuantity: 18,
      maintenanceQuantity: 0,
      supportsStudents: "18 طالباً",
      status: "READY",
      notes: "جاهزة للمسار المبتدئ ومشاريع السيارات الذكية المتتبعة للضوء والمسار.",
    },
    {
      id: "kit-5",
      name: "طابعات ثلاثية الأبعاد Creality Ender 3 V3",
      track: "التصنيع الرقمي والنماذج",
      totalQuantity: 2,
      readyQuantity: 2,
      maintenanceQuantity: 0,
      supportsStudents: "تخدم كافة مجموعات المسابقات والمشاريع",
      status: "READY",
      notes: "متوفر خيوط PLA صديقة للبيئة بألوان متعددة لطباعة قطع الفرق.",
    },
  ];

  // Branch Competitions & Target Arenas
  const competitionsData = [
    {
      id: "comp-wro",
      name: "أولمبياد الروبوت العالمي (WRO - World Robot Olympiad)",
      tracks: ["RoboMission (Elementary & Junior)", "Future Innovators"],
      targetKits: "LEGO SPIKE Prime",
      registeredTeams: 3,
      studentsCount: 9,
      status: "ACTIVE_PREPARATION",
      notes: "تم تركيب الحلبة الرسمية في معمل 1 وبدء حصص البرمجة والتحدي الزمني.",
    },
    {
      id: "comp-fll",
      name: "بطولة فيرست ليجو العالمية (FIRST LEGO League - FLL)",
      tracks: ["FLL Challenge (عمر 9-16 سنة)", "FLL Explore (عمر 6-9 سنوات)"],
      targetKits: "SPIKE Prime + طقم الابتكار",
      registeredTeams: 2,
      studentsCount: 8,
      status: "ACTIVE_PREPARATION",
      notes: "الفرق تعمل حالياً على حل المشروع المبتكر وتصميم ذراع المهمات.",
    },
    {
      id: "comp-vex",
      name: "بطولة فيكس للروبوتات (VEX IQ Challenge)",
      tracks: ["Full Volume Challenge", "Teamwork Championship"],
      targetKits: "VEX IQ Gen 2",
      registeredTeams: 1,
      studentsCount: 4,
      status: "ENROLLED",
      notes: "فريق النجوم المتقدم؛ يجري التدريب على التحكم اليدوي والبرمجة المستقلة.",
    },
    {
      id: "comp-ai",
      name: "الأولمبياد الوطني للذكاء الاصطناعي والبرمجة",
      tracks: ["Computer Vision Challenge", "Python Problem Solving"],
      targetKits: "قاعة حواسيب AI Lab",
      registeredTeams: 2,
      studentsCount: 6,
      status: "ACTIVE_PREPARATION",
      notes: "الطلاب في مرحلة تدريب نماذج تصنيف الصور وحل الخوارزميات.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hero Readiness Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #042f2e 0%, #0d9488 100%)",
          borderRadius: "16px",
          padding: "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, marginBottom: "8px" }}>
              <MapPin size={14} />
              <span>جاهزية فرع الأكاديمية: {branchName || "مدينة نصر"}</span>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 800, color: "#ffffff" }}>
              تجهيزات الفرع والجاهزية التشغيلية (Branch Readiness)
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#ccfbf1", maxWidth: "680px", lineHeight: 1.6 }}>
              مساحة مدير الفرع لمراجعة القاعات، العتاد، الكيتس المتوفرة، والكورسات المعتمدة قبل إنشاء المجموعات لتفادي أي نقص أو تعارض في المواعيد أو الحقائب التدريبية.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={onOpenCreateGroupModal}
              style={{
                background: "#ffffff",
                color: "#0f766e",
                border: 0,
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={16} />
              <span>إنشاء مجموعة جديدة (جروب)</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginTop: "22px", position: "relative", zIndex: 1 }}>
          <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(6px)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>القاعات والمعامل المجهزة</span>
            <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>{roomsData.length} معامل</strong>
            <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>سعة 37 مقعد نشط</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(6px)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>إجمالي الكيتس والحقائب</span>
            <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>58 طقم تدريبي</strong>
            <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>جاهزية العتاد 96%</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(6px)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>الكورسات المعتمدة بالفرع</span>
            <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>{courses.length || 8} كورسات</strong>
            <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>جاهزة للإطلاق والتسجيل</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(6px)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>مسابقات الأكاديمية والفرق</span>
            <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>4 بطولات</strong>
            <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>8 فرق تستعد للمنافسة</span>
          </div>
        </div>
      </div>

      {/* Sections Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
        <button
          type="button"
          onClick={() => setActiveSection("ALL")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "ALL" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "ALL" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Layers size={15} />
          <span>كل تجهيزات الفرع</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("ROOMS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "ROOMS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "ROOMS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Building2 size={15} />
          <span>القاعات والمعامل ({roomsData.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("KITS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "KITS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "KITS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Box size={15} />
          <span>الحقائب وأطقم التدريب ({kitsData.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("COURSES")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "COURSES" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "COURSES" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <GraduationCap size={15} />
          <span>الكورسات المعتمدة ({courses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("COMPETITIONS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "COMPETITIONS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "COMPETITIONS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Trophy size={15} />
          <span>المسابقات والتراكات ({competitionsData.length})</span>
        </button>
      </div>

      {/* Section 1: Rooms & Labs */}
      {(activeSection === "ALL" || activeSection === "ROOMS") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdfa", color: "#0d9488", display: "grid", placeItems: "center" }}>
                <Building2 size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                القاعات والمعامل المتاحة بالفرع
              </h3>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              يتم ربط كل مجموعة بقاعة محددة لمنع تعارض مواعيد الحصص
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "16px" }}>
            {roomsData.map(room => (
              <div
                key={room.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "0.98rem", color: "#0f172a", display: "block" }}>{room.name}</strong>
                      <span style={{ fontSize: "0.76rem", color: "#0d9488", fontWeight: 600 }}>{room.type}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#ecfdf5", color: "#065f46", padding: "3px 8px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                      جاهز ومتاح ✓
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", fontSize: "0.82rem", color: "#334155", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <div>السعة القصوى: <strong style={{ color: "#0f172a" }}>{room.capacity} طالباً</strong></div>
                    <div>المجموعات النشطة: <strong style={{ color: "#0d9488" }}>{room.activeGroupsCount} مجموعات</strong></div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px" }}>التجهيزات والعتاد بالقاعة:</span>
                    <ul style={{ margin: 0, paddingRight: "18px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
                      {room.equipment.map((eq, i) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{room.notes}</span>
                  <button
                    type="button"
                    onClick={() => onOpenCreateGroupModal()}
                    style={{
                      background: "#f0fdfa",
                      color: "#0d9488",
                      border: "1px solid #ccfbf1",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    حجز لهذه القاعة +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Educational Kits & Hardware */}
      {(activeSection === "ALL" || activeSection === "KITS") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdfa", color: "#0d9488", display: "grid", placeItems: "center" }}>
                <Box size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                الحقائب والأطقم التعليمية المعتمدة بالفرع (Kits Inventory)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => toast.success("طلب توريد كيتس جديدة مسجل لدى الإدارة")}
              style={{ background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "5px 12px", fontSize: "0.8rem", cursor: "pointer" }}
            >
              + إضافة كيتس جديدة
            </button>
          </div>

          <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>اسم الكيت / العتاد التعليمي</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>المسار والمسابقات</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>الكمية الإجمالية</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>الجاهز للاستخدام</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>الطاقة الاستيعابية</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>حالة الفحص</th>
                  <th style={{ padding: "12px 16px", color: "#475569" }}>ملاحظات الجاهزية</th>
                </tr>
              </thead>
              <tbody>
                {kitsData.map(kit => (
                  <tr key={kit.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {kit.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 600 }}>
                      {kit.track}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {kit.totalQuantity} أطقم
                    </td>
                    <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: 700 }}>
                      {kit.readyQuantity} أطقم
                      {kit.maintenanceQuantity > 0 && (
                        <span style={{ fontSize: "0.72rem", color: "#b91c1c", marginRight: "4px" }}>
                          ({kit.maintenanceQuantity} فحص)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {kit.supportsStudents}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#ecfdf5", color: "#065f46", padding: "2px 8px", borderRadius: "10px" }}>
                        معتمد 100% ✓
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.78rem" }}>
                      {kit.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 3: Active Courses Ready for New Cohorts */}
      {(activeSection === "ALL" || activeSection === "COURSES") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdfa", color: "#0d9488", display: "grid", placeItems: "center" }}>
                <GraduationCap size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                الكورسات المعتمدة بالفرع والجاهزة لإطلاق مجموعات جديدة
              </h3>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              اختر أي كورس لإطلاق مجموعة جديدة فوراً مع تعيين المدرب والقاعة
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {courses.map(course => (
              <div
                key={course.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{course.name}</strong>
                    <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px" }}>
                      {course.ageGroup} سنة
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>
                    {course.description || "منهج عملي مكثف يركز على التطبيق التفاعلي وبناء المشاريع الحقيقية."}
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "0.76rem", color: "#334155" }}>
                    <div>الحصص: <strong>{course.totalSessions} حصة</strong></div>
                    <div>السعر: <strong>{new Intl.NumberFormat("ar-EG").format(course.basePricePiasters / 100)} ج.م</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCreateGroupForCourse) {
                      onOpenCreateGroupForCourse(course.id);
                    } else {
                      onOpenCreateGroupModal();
                    }
                  }}
                  style={{
                    background: "#0d9488",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "8px",
                    padding: "7px 12px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} />
                  <span>إنشاء مجموعة جديدة لهذا الكورس</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Competitions & Target Arenas */}
      {(activeSection === "ALL" || activeSection === "COMPETITIONS") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef9c3", color: "#ca8a04", display: "grid", placeItems: "center" }}>
                <Trophy size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                مسابقات الأكاديمية والفرق التنافسية بالفرع
              </h3>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              تجهيز الفرق وتخصيص حصص إضافية للتدريب على الحلبات
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "16px" }}>
            {competitionsData.map(comp => (
              <div
                key={comp.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #fef08a",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 6px rgba(234, 179, 8, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{comp.name}</strong>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: "8px" }}>
                      مستعدة للمنافسة 🏆
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "8px" }}>
                    <strong>التراكات المعتمدة: </strong>
                    <span>{comp.tracks.join(" · ")}</span>
                  </div>

                  <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "#334155", background: "#fefce8", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px" }}>
                    <div>الفرق المسجلة: <strong style={{ color: "#854d0e" }}>{comp.registeredTeams} فرق</strong></div>
                    <div>عدد الطلاب: <strong style={{ color: "#854d0e" }}>{comp.studentsCount} طلاب</strong></div>
                    <div>الكيت: <strong>{comp.targetKits}</strong></div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b", lineHeight: 1.5 }}>
                    {comp.notes}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #fef9c3", paddingTop: "10px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#854d0e", fontWeight: 600 }}>حلبة التدريب مجهزة في المعمل</span>
                  <button
                    type="button"
                    onClick={() => onOpenCreateGroupModal()}
                    style={{
                      background: "#ca8a04",
                      color: "#ffffff",
                      border: 0,
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    إنشاء مجموعة تنافسية +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
