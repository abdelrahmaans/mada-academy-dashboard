import React, { useMemo, useState } from "react";
import {
  Archive,
  Award,
  Calendar,
  Cloud,
  Compass,
  ExternalLink,
  Filter,
  GraduationCap,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import {
  getArchivedProjects,
  type ProjectArchiveItem,
} from "@/lib/projectArchiveStorage";

type Props = {
  onOpenSubmitModal: () => void;
  canSubmit?: boolean;
  tenantId?: string;
  branchId?: string;
};

export function ProjectArchiveTabView({ onOpenSubmitModal, canSubmit = true, tenantId, branchId }: Props) {
  const [projects, setProjects] = useState<ProjectArchiveItem[]>(() => getArchivedProjects(tenantId, branchId));
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [competitionFilter, setCompetitionFilter] = useState("ALL");

  React.useEffect(() => {
    setProjects(getArchivedProjects(tenantId, branchId));
  }, [tenantId, branchId]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (branchFilter !== "ALL" && p.branchName !== branchFilter) return false;
      if (competitionFilter !== "ALL" && p.competitionName !== competitionFilter) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const matchTitle = p.projectTitle.toLowerCase().includes(q);
      const matchTeam = p.teamName.toLowerCase().includes(q);
      const matchComp = p.competitionName.toLowerCase().includes(q);
      const matchCoach = p.submittedBy.toLowerCase().includes(q);
      const matchStudents = p.students.some((s) => s.studentName.toLowerCase().includes(q));

      return matchTitle || matchTeam || matchComp || matchCoach || matchStudents;
    });
  }, [projects, searchQuery, branchFilter, competitionFilter]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.branchName)));
  }, [projects]);

  const uniqueCompetitions = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.competitionName)));
  }, [projects]);

  const totalStudents = useMemo(() => {
    const studentIds = new Set<string>();
    projects.forEach((p) => p.students.forEach((s) => studentIds.add(s.studentId || s.studentName)));
    return studentIds.size;
  }, [projects]);

  const totalAwards = useMemo(() => {
    return projects.filter((p) => Boolean(p.award)).length;
  }, [projects]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} dir="rtl">
      {/* Header and Quick Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "#ffffff",
          padding: "20px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#f0fdfa",
                color: "#0f766e",
              }}
            >
              <Archive size={18} />
            </span>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              أرشيف مشاريع ومخرجات الأكاديمية والمسابقات
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            مستودع الأكاديمية المركزي لتوثيق أعمال الفرق، روابط الدرايف السحابية، والطلاب المشاركون
            لحفظ الإنجازات وتخفيف الداتا.
          </p>
        </div>

        {canSubmit && (
          <button
            type="button"
            onClick={onOpenSubmitModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#0f766e",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            <Plus size={16} />
            <span>توثيق ورفع مشروع فريق جديد (Drive Link)</span>
          </button>
        )}
      </div>

      {/* KPI Counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#f0fdfa",
              color: "#0f766e",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Rocket size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>مشاريع موثقة بالأرشيف</span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              {projects.length} مشاريع
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Cloud size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>مجلدات Drive سحابية</span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              {projects.length} روابط نشطة
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#fef3c7",
              color: "#d97706",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Trophy size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>جوائز وأوسمة محققة</span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              {totalAwards} أوسمة تكريم
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#f3e8ff",
              color: "#9333ea",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>طلاب مسندون في الفرق</span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              {totalStudents} طالباً ومبتكراً
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: "240px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "6px 12px",
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="ابحث باسم المشروع، الطالب، الفريق، أو المدرب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              width: "100%",
              fontSize: "13px",
              color: "#1e293b",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={15} color="#64748b" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              background: "#ffffff",
            }}
          >
            <option value="ALL">كل الفروع</option>
            {uniqueBranches.map((b) => (
              <option key={b} value={b}>
                فرع {b}
              </option>
            ))}
          </select>

          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              background: "#ffffff",
            }}
          >
            <option value="ALL">كل المسابقات والمسارات</option>
            {uniqueCompetitions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "40px 20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <Archive size={40} color="#cbd5e1" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "16px" }}>
            لا توجد مشاريع مطابقة لمعايير البحث
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
            جرب تغيير معايير التصفية أو قم بتوثيق ورفع مشروع جديد الآن.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredProjects.map((item) => (
            <article
              key={item.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              {/* Card Top: Badge, Team Name, Branch, Competition */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "24px",
                      display: "grid",
                      placeItems: "center",
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "#f0fdfa",
                      border: "1px solid #ccfbf1",
                    }}
                  >
                    {item.teamBadge || "🤖"}
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                      فريق {item.teamName}
                    </h3>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      فرع {item.branchName} · {item.competitionName}
                    </span>
                  </div>
                </div>

                {item.award && (
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      border: "1px solid #fde68a",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.award}
                  </span>
                )}
              </div>

              {/* Project Title & Description */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  {item.projectTitle}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#64748b",
                    lineHeight: "1.6",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.projectDescription}
                </p>
              </div>

              {/* Assigned Students */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  <GraduationCap size={14} color="#0f766e" />
                  <span>الطلاب المشاركون في المشروع ({item.students.length} طلاب):</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {item.students.map((st, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        color: "#334155",
                      }}
                    >
                      <b>{st.studentName}</b>
                      {st.roleInTeam && (
                        <small style={{ color: "#0d9488", marginRight: "4px" }}>
                          ({st.roleInTeam})
                        </small>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Submitter & Drive Direct Action Button */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>رفع بواسطة: <b>{item.submittedBy}</b></span>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {new Date(item.submittedAt).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    background: "#f0fdfa",
                    border: "1px solid #99f6e4",
                    color: "#0f766e",
                    fontWeight: 700,
                    fontSize: "12px",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Cloud size={14} />
                  <span>فتح مجلد المشروع (Drive)</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
