import { describe, expect, it, beforeEach } from "vitest";
import { approvalsStorage } from "./approvalsStorage";

// Setup localStorage mock if not present in Node environment
const memoryStore = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, val: string) => memoryStore.set(key, val),
  removeItem: (key: string) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
  get length() {
    return memoryStore.size;
  },
  key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
};

if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage.clear) {
  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    writable: true,
  });
}

describe("approvalsStorage domain operations (SOLID SRP)", () => {
  const testBranch = "branch-cairo-01";
  const testTenant = "tenant-mada-01";

  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty for a new academy", () => {
    const list = approvalsStorage.load(testBranch, testTenant);
    expect(list).toEqual([]);
    expect(approvalsStorage.getPendingCount(testBranch, testTenant)).toBe(0);
  });

  it("creates a dynamic approval request and persists it", () => {
    const created = approvalsStorage.createRequest(
      testBranch,
      {
        kind: "substitute",
        title: "طلب مدرب بديل لحصة الروبوتكس",
        summary: "تغطية حصة المستوى المتقدم",
        requestedBy: "كوتش أحمد - رئيس المدربين",
        course: "روبوتكس متقدم",
        instructor: "عمر سامح",
        substitute: "يوسف عماد",
        sessionDate: "اليوم",
        sessionTime: "04:00 م",
      },
      testTenant
    );

    expect(created.id).toMatch(/^APR-\d+/);
    expect(created.status).toBe("pending");
    expect(approvalsStorage.getPendingCount(testBranch, testTenant)).toBe(1);

    const loaded = approvalsStorage.load(testBranch, testTenant);
    expect(loaded.length).toBe(1);
    expect(loaded[0].course).toBe("روبوتكس متقدم");
  });

  it("decides a dynamic request and records audit notes", () => {
    const created = approvalsStorage.createRequest(
      testBranch,
      {
        kind: "discount",
        title: "خصم إخوة 15%",
        summary: "تسجيل الطالب الثاني",
        requestedBy: "سارة - السكرتارية",
        student: "كريم أحمد",
        course: "ذكاء اصطناعي",
        discountValue: 15,
      },
      testTenant
    );

    const decided = approvalsStorage.decideRequest(
      testBranch,
      created.id,
      "approved",
      "معتمد وفق لائحة الخصومات الرسمية",
      "م. محمود - مدير الفرع",
      testTenant
    );

    expect(decided).toBeDefined();
    expect(decided?.status).toBe("approved");
    expect(decided?.decisionNote).toBe("معتمد وفق لائحة الخصومات الرسمية");
    expect(approvalsStorage.getPendingCount(testBranch, testTenant)).toBe(0);
  });

  it("deletes a request dynamically", () => {
    const created = approvalsStorage.createRequest(
      testBranch,
      {
        kind: "expense",
        title: "مستلزمات معمل",
        summary: "شراء حساسات",
        requestedBy: "المحاسبة",
        expenseAmount: 1500,
      },
      testTenant
    );

    expect(approvalsStorage.load(testBranch, testTenant).length).toBe(1);
    approvalsStorage.deleteRequest(testBranch, created.id, testTenant);
    expect(approvalsStorage.load(testBranch, testTenant).length).toBe(0);
  });
});
