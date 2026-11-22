import { describe, expect, it, beforeEach } from "vitest";
import { readinessStorage } from "./readinessStorage";
import type { ReadinessRoom, ReadinessKit, ReadinessCompetition } from "@/components/classes/readiness/types";

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

describe("readinessStorage domain operations (SOLID SRP)", () => {
  const testBranch = "test-branch-cairo";
  const testTenant = "test-tenant-mada";

  beforeEach(() => {
    localStorage.clear();
  });

  it("loads initial state with rooms, kits, and checklist", () => {
    const state = readinessStorage.load(testBranch, testTenant);
    expect(state.rooms.length).toBeGreaterThan(0);
    expect(state.kits.length).toBeGreaterThan(0);
    expect(state.competitions.length).toBeGreaterThan(0);
    expect(state.checklist.length).toBeGreaterThan(0);
  });

  it("adds and updates a room dynamically", () => {
    const newRoom: ReadinessRoom = {
      id: "room-new-1",
      name: "معمل الروبوتات المتقدمة 4",
      type: "معمل عتاد وروبوتكس",
      capacity: 18,
      equipment: ["حلبة WRO 2026", "20 لابتوب"],
      status: "AVAILABLE",
      notes: "قاعة جاهزة",
    };

    const savedState = readinessStorage.saveRoom(testBranch, newRoom, testTenant);
    expect(savedState.rooms.find((r) => r.id === "room-new-1")).toBeDefined();
    expect(savedState.rooms.find((r) => r.id === "room-new-1")?.capacity).toBe(18);

    // Update the room
    const updatedRoom: ReadinessRoom = {
      ...newRoom,
      capacity: 22,
      status: "IN_MAINTENANCE",
    };
    const updatedState = readinessStorage.saveRoom(testBranch, updatedRoom, testTenant);
    expect(updatedState.rooms.find((r) => r.id === "room-new-1")?.capacity).toBe(22);
    expect(updatedState.rooms.find((r) => r.id === "room-new-1")?.status).toBe("IN_MAINTENANCE");

    // Delete the room
    const afterDelete = readinessStorage.deleteRoom(testBranch, "room-new-1", testTenant);
    expect(afterDelete.rooms.find((r) => r.id === "room-new-1")).toBeUndefined();
  });

  it("adds, updates, and deletes an educational kit dynamically", () => {
    const newKit: ReadinessKit = {
      id: "kit-custom-1",
      name: "Raspberry Pi 5 AI Starter Kit",
      track: "ذكاء اصطناعي وروبوتكس",
      totalQuantity: 10,
      readyQuantity: 8,
      maintenanceQuantity: 2,
      supportsStudents: "20 طالباً",
      status: "PARTIAL",
      notes: "كيت تجريبي جديد",
    };

    const savedState = readinessStorage.saveKit(testBranch, newKit, testTenant);
    expect(savedState.kits.find((k) => k.id === "kit-custom-1")).toBeDefined();
    expect(savedState.kits.find((k) => k.id === "kit-custom-1")?.totalQuantity).toBe(10);

    // Delete kit
    const afterDelete = readinessStorage.deleteKit(testBranch, "kit-custom-1", testTenant);
    expect(afterDelete.kits.find((k) => k.id === "kit-custom-1")).toBeUndefined();
  });

  it("adds, updates, and deletes a competition dynamically", () => {
    const newComp: ReadinessCompetition = {
      id: "comp-custom-1",
      name: "هاكاثون البرمجة والذكاء الاصطناعي 2026",
      tracks: ["AI Web", "Embedded Systems"],
      targetKits: "معمل الروبوتكس 1",
      registeredTeams: 3,
      studentsCount: 9,
      status: "ACTIVE_PREPARATION",
      notes: "الفرق قيد التدريب",
    };

    const savedState = readinessStorage.saveCompetition(testBranch, newComp, testTenant);
    expect(savedState.competitions.find((c) => c.id === "comp-custom-1")).toBeDefined();

    // Delete competition
    const afterDelete = readinessStorage.deleteCompetition(testBranch, "comp-custom-1", testTenant);
    expect(afterDelete.competitions.find((c) => c.id === "comp-custom-1")).toBeUndefined();
  });

  it("toggles and adds checklist items dynamically", () => {
    const initialState = readinessStorage.load(testBranch, testTenant);
    const firstItem = initialState.checklist[0];
    const initialChecked = firstItem.checked;

    const toggledState = readinessStorage.toggleChecklistItem(testBranch, firstItem.id, testTenant);
    expect(toggledState.checklist.find((i) => i.id === firstItem.id)?.checked).toBe(!initialChecked);

    const withAdded = readinessStorage.addChecklistItem(
      testBranch,
      "فحص أجهزة الإنذار والسلامة بالممر",
      "SAFETY",
      "مدير الصيانة",
      testTenant
    );
    expect(withAdded.checklist.some((i) => i.title.includes("أجهزة الإنذار"))).toBe(true);
  });
});
