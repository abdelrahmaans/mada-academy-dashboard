import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClassesStatsCards } from "./ClassesStatsCards";
import { ClassesHeader } from "./ClassesHeader";
import { ClassesTopbar } from "./ClassesTopbar";

const noop = () => undefined;

describe("ClassesStatsCards", () => {
  it("renders statistics numbers correctly in loaded state", () => {
    const html = renderToStaticMarkup(
      createElement(ClassesStatsCards, {
        loading: false,
        liveMode: true,
        activeCourses: 5,
        totalCourses: 12,
        activeGroups: 8,
        enrolledTotal: 45,
        availableSeats: 15,
      })
    );

    expect(html).toContain("05");
    expect(html).toContain("من 12 كورسات");
    expect(html).toContain("08");
    expect(html).toContain("45");
    expect(html).toContain("طلاب في المجموعات");
    expect(html).toContain("15");
    expect(html).toContain("أماكن متاحة");
  });

  it("renders loading indicator when loading is true", () => {
    const html = renderToStaticMarkup(
      createElement(ClassesStatsCards, {
        loading: true,
        liveMode: false,
        activeCourses: 0,
        totalCourses: 0,
        activeGroups: 0,
        enrolledTotal: 0,
        availableSeats: 0,
      })
    );

    expect(html).toContain("...");
    expect(html).toContain("طلاب في مجموعات العينة");
  });
});

describe("ClassesHeader", () => {
  it("renders header with live mode note", () => {
    const html = renderToStaticMarkup(
      createElement(ClassesHeader, {
        onNavigateHome: noop,
        tab: "courses",
        onOpenCourseModal: noop,
        onOpenOfferingModal: noop,
        liveMode: true,
        loadError: null,
      })
    );

    expect(html).toContain("الحصص والكورسات");
    expect(html).toContain("بيانات الأكاديمية الحية");
    expect(html).toContain("إضافة كورس");
  });

  it("renders group button when on groups tab and displays load error when present", () => {
    const html = renderToStaticMarkup(
      createElement(ClassesHeader, {
        onNavigateHome: noop,
        tab: "groups",
        onOpenCourseModal: noop,
        onOpenOfferingModal: noop,
        liveMode: false,
        loadError: "Network connection refused",
      })
    );

    expect(html).toContain("إضافة مجموعة");
    expect(html).toContain("DEMO · بيانات توضيحية");
    expect(html).toContain("تعذر تحميل بيانات الأكاديمية");
    expect(html).toContain("Network connection refused");
  });
});

describe("ClassesTopbar", () => {
  it("renders topbar with branch selection and user information", () => {
    const html = renderToStaticMarkup(
      createElement(ClassesTopbar, {
        onOpenMobileNav: noop,
        branchFilter: "كل الفروع",
        branchMenuOpen: false,
        setBranchMenuOpen: noop,
        onSelectBranch: noop,
        liveMode: true,
        branches: ["كل الفروع", "مدينة نصر"],
        liveBranchNames: ["مدينة نصر", "المعادي"],
        search: "روبوتكس",
        onSearchChange: noop,
        userDisplayName: "أحمد سراج",
        roleLabel: "مدير الفرع",
      })
    );

    expect(html).toContain("أحمد سراج");
    expect(html).toContain("مدير الفرع");
    expect(html).toContain("روبوتكس");
    expect(html).toContain("كل الفروع");
  });
});
