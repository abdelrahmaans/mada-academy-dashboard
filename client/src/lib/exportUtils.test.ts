import { describe, expect, it } from "vitest";
import { generateCSVContent, type ExportColumn } from "./exportUtils";

describe("generateCSVContent", () => {
  it("throws when data is empty", () => {
    expect(() => generateCSVContent([], [])).toThrow("لا توجد بيانات متاحة للتصدير حالياً.");
  });

  it("generates correct CSV content with UTF-8 BOM", () => {
    interface TestItem {
      name: string;
      score: number;
      branch: string;
    }

    const data: TestItem[] = [
      { name: "يحيى كريم", score: 95, branch: "فرع المعادي" },
      { name: "سلمى طارق", score: 88, branch: "الفرع الرئيسي" },
    ];

    const cols: ExportColumn<TestItem>[] = [
      { header: "اسم الطالب", accessor: d => d.name },
      { header: "الدرجة", accessor: d => d.score },
      { header: "الفرع", accessor: d => d.branch },
    ];

    const content = generateCSVContent(data, cols);

    // Verify UTF-8 BOM prefix
    expect(content.startsWith("\uFEFF")).toBe(true);

    // Verify header row
    expect(content).toContain('"اسم الطالب","الدرجة","الفرع"');

    // Verify data rows
    expect(content).toContain('"يحيى كريم","95","فرع المعادي"');
    expect(content).toContain('"سلمى طارق","88","الفرع الرئيسي"');
  });

  it("escapes quotes correctly", () => {
    const data = [{ note: 'ملاحظة "هامة جداً"' }];
    const cols = [{ header: "الملاحظة", accessor: (d: any) => d.note }];

    const content = generateCSVContent(data, cols);
    expect(content).toContain('"ملاحظة ""هامة جداً"""');
  });
});
