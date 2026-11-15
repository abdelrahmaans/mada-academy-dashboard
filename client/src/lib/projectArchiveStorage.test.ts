import { describe, it, expect, beforeEach } from "vitest";
import {
  getArchivedProjects,
  saveArchivedProject,
  getStudentProjects,
  resetProjectArchiveMemoryStore,
} from "./projectArchiveStorage";

describe("projectArchiveStorage", () => {
  beforeEach(() => {
    resetProjectArchiveMemoryStore();
  });

  it("returns initial seeded projects when empty", () => {
    const projects = getArchivedProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty("driveUrl");
    expect(projects[0]).toHaveProperty("teamBadge");
  });

  it("saves a new project and retrieves it", () => {
    const created = saveArchivedProject({
      competitionName: "هاكاثون الذكاء الاصطناعي 2026",
      branchId: "branch-cairo",
      branchName: "المعادي",
      teamName: "AI Pioneers",
      teamBadge: "🧠",
      projectTitle: "نظام كشف الحضور بالتعرف على الوجه",
      projectDescription: "مشروع متكامل",
      driveUrl: "https://drive.google.com/test-project",
      submittedBy: "كوتش أحمد",
      submittedByRole: "المدرب",
      students: [{ studentId: "stud-999", studentName: "سليمان طارق", roleInTeam: "قائد الفريق" }],
      award: "درع الابتكار 🏆",
    });

    expect(created.id).toBeDefined();
    expect(created.teamName).toBe("AI Pioneers");

    const all = getArchivedProjects();
    expect(all[0].id).toBe(created.id);
  });

  it("filters projects by student name or id", () => {
    const results = getStudentProjects("ياسين محمد علي");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].students.some((s) => s.studentName.includes("ياسين"))).toBe(true);
  });
});
