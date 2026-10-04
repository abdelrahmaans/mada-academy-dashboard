import { describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

const { ApiRequestError } = await import("./apiClient");
const { executiveFailureMessage, mergeR03LiveResults } = await import(
  "./liveSurfaceAcceptance"
);

const fulfilled = <T>(value: T): PromiseFulfilledResult<T> => ({
  status: "fulfilled",
  value,
});
const rejected = (
  reason = new Error("optional endpoint unavailable")
): PromiseRejectedResult => ({ status: "rejected", reason });

const emptyEvaluations = {
  branchId: "branch-1",
  counts: { DRAFT: 0, SUBMITTED: 0, CHANGES_REQUESTED: 0, PUBLISHED: 0 },
};

describe("LIVE surface acceptance helpers", () => {
  it("explains report-source failures without suggesting demo data", () => {
    const message = executiveFailureMessage(
      new ApiRequestError(
        "source unavailable",
        503,
        "REPORT_SOURCE_UNAVAILABLE",
        "collections"
      )
    );
    expect(message).toContain("التحصيل");
    expect(message).toContain("لم نعرض بدائل تجريبية");
  });

  it("keeps R03 core data when optional evaluations and notifications fail", () => {
    const merged = mergeR03LiveResults(
      fulfilled({ items: [{ id: "group-1" }] as never[] }),
      fulfilled({ items: [{ id: "instructor-1" }] as never[] }),
      fulfilled({ items: [{ id: "session-1" }] as never[] }),
      rejected(),
      rejected(),
      "branch-1"
    );

    expect(merged.data.groups).toHaveLength(1);
    expect(merged.data.instructors).toHaveLength(1);
    expect(merged.data.sessions).toHaveLength(1);
    expect(merged.data.evaluations).toEqual(emptyEvaluations);
    expect(merged.data.notifications).toEqual([]);
    expect(merged.warnings).toEqual([
      "ملخص التقييمات غير متاح مؤقتًا.",
      "التنبيهات غير متاحة مؤقتًا.",
    ]);
  });

  it("fails the whole R03 load when a core endpoint fails", () => {
    expect(() =>
      mergeR03LiveResults(
        rejected(),
        fulfilled({ items: [] }),
        fulfilled({ items: [] }),
        fulfilled(emptyEvaluations),
        fulfilled({ items: [], total: 0 }),
        "branch-1"
      )
    ).toThrow("الجلسات الأساسية");
  });
});
