import { describe, expect, test } from "vitest";
import { saveArchivedProject, getArchivedProjects } from "@/lib/projectArchiveStorage";

describe("PostCompetitionReviewModal and Cloud Drive Archiving", () => {
  test("successfully records a post-competition review with drive link into the archive", () => {
    const initialCount = getArchivedProjects().length;

    const newProject = saveArchivedProject({
      teamName: "Mada Robotics Champions",
      competitionId: "comp-wro-2026",
      competitionName: "بطولة الأولمبياد العالمي للروبوت (WRO 2026)",
      branchId: "branch-nasr",
      branchName: "مدينة نصر",
      teamBadge: "🥇",
      projectTitle: "المركز الأول في تحدي مهام الروبوت الذكي",
      projectDescription: "تحليل ما بعد المسابقة: نقاط القوة: استقرار الكود وحساسات الألوان.",
      driveUrl: "https://drive.google.com/drive/folders/wro-2026-mada-champions",
      submittedBy: "كوتش أحمد محمود",
      submittedByRole: "المدرب المعتمد",
      students: [
        { studentId: "st-1", studentName: "ياسين محمد علي", roleInTeam: "كابتن الفريق" },
        { studentId: "st-2", studentName: "عمر خالد إبراهيم", roleInTeam: "مبرمج رئيسي" },
      ],
      award: "المركز الأول والكأس الذهبي 🏆",
      status: "SHOWCASED",
    });

    expect(newProject.id).toBeDefined();
    expect(newProject.teamName).toBe("Mada Robotics Champions");
    expect(newProject.award).toContain("المركز الأول");
    expect(newProject.driveUrl).toContain("drive.google.com");
    expect(getArchivedProjects().length).toBe(initialCount + 1);
  });
});
