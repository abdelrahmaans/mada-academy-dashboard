import { describe, it, expect } from "vitest";
import { TRANSLATIONS, ARABIC_TO_ENGLISH_PHRASES } from "./translations";

describe("Translations & i18n Registry", () => {
  it("should contain complete Arabic and English dictionaries", () => {
    expect(TRANSLATIONS.ar).toBeDefined();
    expect(TRANSLATIONS.en).toBeDefined();

    expect(TRANSLATIONS.ar["nav.home"]).toBe("الرئيسية");
    expect(TRANSLATIONS.en["nav.home"]).toBe("Home");

    expect(TRANSLATIONS.ar["nav.competitions"]).toBe("البطولات والمشاريع");
    expect(TRANSLATIONS.en["nav.competitions"]).toBe("Competitions & Projects");

    expect(TRANSLATIONS.ar["action.save"]).toBe("حفظ");
    expect(TRANSLATIONS.en["action.save"]).toBe("Save");
  });

  it("should have matching role keys between Arabic and English", () => {
    const roleKeys = Object.keys(TRANSLATIONS.ar).filter((k) => k.startsWith("role."));
    expect(roleKeys.length).toBeGreaterThan(5);

    roleKeys.forEach((key) => {
      expect(TRANSLATIONS.en[key]).toBeDefined();
      expect(typeof TRANSLATIONS.en[key]).toBe("string");
      expect(TRANSLATIONS.en[key].length).toBeGreaterThan(0);
    });
  });

  it("should have common Arabic UI phrases mapped to clean English equivalents", () => {
    expect(ARABIC_TO_ENGLISH_PHRASES["الرئيسية"]).toBe("Home");
    expect(ARABIC_TO_ENGLISH_PHRASES["فريق العمل"]).toBe("Team & Staff");
    expect(ARABIC_TO_ENGLISH_PHRASES["البطولات والمشاريع"]).toBe("Competitions & Projects");
    expect(ARABIC_TO_ENGLISH_PHRASES["حفظ"]).toBe("Save");
    expect(ARABIC_TO_ENGLISH_PHRASES["إلغاء"]).toBe("Cancel");
    expect(ARABIC_TO_ENGLISH_PHRASES["نشط"]).toBe("Active");
  });
});
