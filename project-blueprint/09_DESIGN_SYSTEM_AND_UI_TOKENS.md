# Design System, Theme Tokens & Brand Placeholders
**Document ID:** `PLN-09-DESIGN-SYSTEM`  
**System Codename:** `Project Apex` (Temporary Working Title)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Brand & Logo Placeholder Strategy

To ensure zero friction when the stakeholders deliver the final commercial name and visual identity:
1. All brand references in code are bound to the token `BRAND_NAME` (currently initialized to `"Project Apex"`).
2. The system reserves two asset files in the public directory:
   - `src/assets/brand/logo.svg` (Currently a modern vector placeholder: a minimalist geometric apex glyph).
   - `src/assets/brand/favicon.ico`.
3. Changing these two files and updating the `environment.brandName` string completely transforms the branding across the entire web application, mobile shells, and PDF generation engines.

---

## 2. Master Color Palette & HSL Design Tokens

The design system is based on mathematically harmonious HSL color tokens, engineered for readability, high contrast (WCAG AAA compliant), and native Dark/Light mode support.

### 2.1 Color Variables Specification (`styles/tokens.css`)

```css
:root {
  /* Surface & Backgrounds */
  --bg-app: 210 20% 98%;          /* #f8fafc - Crisp off-white */
  --bg-card: 0 0% 100%;           /* #ffffff - Pure white card */
  --bg-sidebar: 222 47% 11%;      /* #0f172a - Deep corporate navy */
  --border-subtle: 214 32% 91%;   /* #e2e8f0 - Neutral border */

  /* Primary Brand (Refined Deep Emerald / Trust Blue-Green) */
  --primary-50: 166 76% 97%;
  --primary-100: 167 70% 89%;
  --primary-500: 171 77% 33%;     /* #13897b - Core brand primary */
  --primary-600: 172 78% 27%;
  --primary-700: 173 78% 21%;

  /* Secondary & Accent (Warm Indigo) */
  --accent-500: 243 75% 59%;      /* #5356ff - Interactive highlights */

  /* Semantic Feedback States */
  --success-bg: 142 76% 96%;
  --success-text: 142 72% 29%;    /* #15803d - Paid / Completed / Present */
  
  --warning-bg: 48 96% 89%;
  --warning-text: 38 92% 35%;     /* #b45309 - Pending / Substitute / Partial */

  --destructive-bg: 0 86% 97%;
  --destructive-text: 0 72% 51%;  /* #dc2626 - Overdue / Discrepancy / Cancelled */

  --info-bg: 204 94% 94%;
  --info-text: 204 88% 38%;       /* #0284c7 - Scheduled / Information */

  /* Typography Colors */
  --text-main: 222 47% 11%;       /* #0f172a - High contrast heading */
  --text-muted: 215 16% 47%;      /* #64748b - Subtitles and meta tags */
}

/* Dark Theme Overrides */
[data-theme="dark"] {
  --bg-app: 222 47% 7%;           /* #090d16 */
  --bg-card: 222 47% 11%;         /* #0f172a */
  --bg-sidebar: 224 71% 4%;       /* #020617 */
  --border-subtle: 217 33% 17%;
  --text-main: 210 40% 98%;
  --text-muted: 215 20% 65%;
}
```

---

## 3. RTL-First Arabic & Latin Typography

The ERP is designed for bilingual Arabic-first operational efficiency:

* **Primary Arabic Font:** `Cairo` / `IBM Plex Sans Arabic` (Loaded via `next/font` or self-hosted WOFF2).
* **Latin & Numbers Font:** `Inter` (Provides clean tabular numbers `tabular-nums` for financial statements and cash calculations).
* **Text Direction:** Default `dir="rtl"`, fully switchable to `dir="ltr"` on tenant preference.
* **Component Flipping:** All Tailwind layout classes use modern logical properties:
  - `ms-*` (margin-inline-start) instead of `ml-*`.
  - `me-*` (margin-inline-end) instead of `mr-*`.
  - `ps-*` and `pe-*` for padding.
  - Icons that indicate direction (arrows, chevrons) automatically invert via CSS transform:
    ```css
    [dir="rtl"] .rtl-flip {
      transform: scaleX(-1);
    }
    ```

