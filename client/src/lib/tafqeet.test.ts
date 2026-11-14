import { describe, expect, it } from "vitest";
import { tafqeet } from "./tafqeet";

describe("tafqeet (Arabic Currency to Words)", () => {
  it("converts zero amount correctly", () => {
    expect(tafqeet(0)).toBe("صفر جنيه مصري فقط لا غير");
  });

  it("converts single digits correctly", () => {
    expect(tafqeet(5)).toBe("فقط خمسة جنيه مصري لا غير");
  });

  it("converts teens correctly", () => {
    expect(tafqeet(15)).toBe("فقط خمسة عشر جنيه مصري لا غير");
  });

  it("converts hundreds correctly", () => {
    expect(tafqeet(300)).toBe("فقط ثلاثمائة جنيه مصري لا غير");
    expect(tafqeet(350)).toBe("فقط ثلاثمائة وخمسون جنيه مصري لا غير");
  });

  it("converts thousands correctly", () => {
    expect(tafqeet(1000)).toBe("فقط ألف جنيه مصري لا غير");
    expect(tafqeet(2000)).toBe("فقط ألفان جنيه مصري لا غير");
    expect(tafqeet(2500)).toBe("فقط ألفان وخمسمائة جنيه مصري لا غير");
  });

  it("converts piastres correctly", () => {
    expect(tafqeet(2500.5)).toBe("فقط ألفان وخمسمائة جنيه مصري وخمسون قرشاً لا غير");
  });
});
