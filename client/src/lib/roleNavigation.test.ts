import { describe, expect, it } from "vitest";
import { ROLE_DEFINITIONS, getRoleBackPath, getRoleHomePath } from "./roleNavigation";

describe("role navigation scopes", () => {
  it("keeps the head-instructors role branch-scoped", () => {
    expect(ROLE_DEFINITIONS.R03.scopeLevel).toBe("branch");
  });

  it("limits R03 navigation to coaching supervision surfaces", () => {
    expect(ROLE_DEFINITIONS.R03.navigation.map(item => item.path)).toEqual([
      "/head-instructors",
      "/academic-programs",
      "/schedule",
    ]);
    expect(ROLE_DEFINITIONS.R03.navigation.map(item => item.path)).not.toContain("/finance-desk");
  });

  it("keeps home and back paths aligned with the role registry", () => {
    for (const definition of Object.values(ROLE_DEFINITIONS)) {
      expect(getRoleHomePath(definition.code)).toBe(definition.homePath);
      expect(getRoleBackPath(definition.code)).toBe(definition.backPath);
    }
  });

  it("keeps the media-manager role branch-scoped", () => {
    expect(ROLE_DEFINITIONS.R07.scopeLevel).toBe("branch");
  });

  it("exposes explicit R01 routes for academy-wide internal views", () => {
    expect(ROLE_DEFINITIONS.R01.navigation.map(item => item.path)).toEqual(expect.arrayContaining([
      "/academy-owner",
      "/academy-owner/branches",
      "/academy-owner/tickets",
      "/academy-owner/reports",
      "/academy/branches",
      "/academy/classrooms",
      "/academy/roles",
    ]));
  });

  it("keeps finance navigation out of the branch-manager role", () => {
    expect(ROLE_DEFINITIONS.R02.navigation.map(item => item.path)).not.toContain("/finance");
    expect(ROLE_DEFINITIONS.R02.navigation.map(item => item.path)).not.toContain("/finance-desk");
  });
});
