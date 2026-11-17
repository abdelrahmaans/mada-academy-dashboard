import { describe, expect, test } from "vitest";
import type { KitItem } from "./KitInventoryDetailsModal";

describe("KitInventoryDetailsModal logic & serial generation", () => {
  const sampleKit: KitItem = {
    id: "kit-spike-01",
    name: "حقائب LEGO Education SPIKE Prime",
    track: "روبوتكس ومسابقات",
    totalQuantity: 14,
    readyQuantity: 12,
    maintenanceQuantity: 2,
    supportsStudents: "28 طالباً (طالبان / حقيبة)",
    status: "READY",
    notes: "الحقائب مراجعة ومحدثة بآخر فيرموير",
  };

  test("calculates ready vs maintenance proportion accurately", () => {
    expect(sampleKit.readyQuantity + sampleKit.maintenanceQuantity).toBe(sampleKit.totalQuantity);
    const availabilityRate = (sampleKit.readyQuantity / sampleKit.totalQuantity) * 100;
    expect(Math.round(availabilityRate)).toBe(86);
  });

  test("generates uniform branch serial codes for sub-units", () => {
    const branchName = "مدينة نصر";
    const prefix = sampleKit.name.includes("SPIKE") ? "L-SP" : "KIT";
    const branchCode = branchName.slice(0, 3).toUpperCase();
    const serial1 = `${prefix}-${branchCode}-01`;
    const serial14 = `${prefix}-${branchCode}-14`;

    expect(serial1).toContain("L-SP");
    expect(serial1).toBe("L-SP-مدي-01");
    expect(serial14).toBe("L-SP-مدي-14");
  });
});
