import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BillingMeterWidget } from "./BillingMeterWidget";

describe("BillingMeterWidget", () => {
  it("renders correctly without throwing", () => {
    const html = renderToStaticMarkup(createElement(BillingMeterWidget, {}));
    // Initially renders loading state before effect runs
    expect(html).toContain("عداد استهلاك باقة الأكاديمية");
  });
});
