import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredAcademies,
  storeCustomAcademy,
  updateStoredAcademy,
  deleteStoredAcademy,
  mergeAcademiesWithPersistent,
  getStoredBranches,
  saveStoredBranch,
  findStoredOwnerByPhone,
} from "./customAcademiesStorage";
import type { PlatformAcademy, AcademyBranch } from "./apiClient";

describe("customAcademiesStorage", () => {
  beforeEach(() => {
    const memoryStore: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (k: string) => memoryStore[k] ?? null,
      setItem: (k: string, v: string) => { memoryStore[k] = v; },
      removeItem: (k: string) => { delete memoryStore[k]; },
      clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
      key: (i: number) => Object.keys(memoryStore)[i] ?? null,
      length: 0,
    } as Storage;
  });

  const sampleAcademy: PlatformAcademy = {
    id: "test-academy-1",
    name: "أكاديمية المستقبل للروبوتكس",
    slug: "future-robotics",
    status: "ACTIVE",
    plan: "GROWTH",
    planCode: "growth",
    planName: "GROWTH",
    createdAt: "2026-11-22T10:00:00.000Z",
    branches: 1,
    users: 2,
    owner: "أحمد علي",
    ownerPhone: "+201012345678",
    ownerEmail: "ahmed@future.com",
    allowedBranches: 3,
    remainingTrialDays: 14,
  };

  it("stores and retrieves custom academies", () => {
    storeCustomAcademy(sampleAcademy, { name: "فرع المعادي", code: "MAADI" }, {
      displayName: "أحمد علي",
      phone: "+201012345678",
      email: "ahmed@future.com",
    });

    const stored = getStoredAcademies();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("أكاديمية المستقبل للروبوتكس");
    expect(stored[0].id).toBe("test-academy-1");

    // Check branch persistence
    const branches = getStoredBranches("test-academy-1");
    expect(branches).toHaveLength(1);
    expect(branches[0].name).toBe("فرع المعادي");
    expect(branches[0].code).toBe("MAADI");

    // Check owner persistence
    const owner = findStoredOwnerByPhone("+201012345678");
    expect(owner).not.toBeNull();
    expect(owner?.displayName).toBe("أحمد علي");
  });

  it("updates stored academy status and plan", () => {
    storeCustomAcademy(sampleAcademy);
    updateStoredAcademy("test-academy-1", { status: "PAUSED", plan: "ENTERPRISE", planCode: "enterprise" });

    const stored = getStoredAcademies();
    expect(stored[0].status).toBe("PAUSED");
    expect(stored[0].planCode).toBe("enterprise");
  });

  it("deletes stored academy and maintains tombstone", () => {
    storeCustomAcademy(sampleAcademy);
    deleteStoredAcademy("test-academy-1");

    expect(getStoredAcademies()).toHaveLength(0);

    // If server tries to resurrect it, merge filter excludes it
    const serverAcademies: PlatformAcademy[] = [sampleAcademy];
    const merged = mergeAcademiesWithPersistent(serverAcademies);
    expect(merged).toHaveLength(0);
  });

  it("merges server academies with persistent custom academies when backend recycles", () => {
    // Academy on server
    const serverAcademy: PlatformAcademy = {
      id: "server-demo-1",
      name: "Mada Demo Academy",
      slug: "mada-demo-academy",
      status: "ACTIVE",
      plan: "GROWTH",
      createdAt: "2026-10-01T00:00:00Z",
      branches: 2,
      users: 12,
    };

    // User created custom academy
    storeCustomAcademy(sampleAcademy);

    // Backend only has serverAcademy (e.g. after in-memory recycle)
    const merged = mergeAcademiesWithPersistent([serverAcademy]);
    expect(merged).toHaveLength(2);
    expect(merged.some(a => a.id === "server-demo-1")).toBe(true);
    expect(merged.some(a => a.id === "test-academy-1")).toBe(true);
  });
});
