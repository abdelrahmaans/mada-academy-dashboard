/**
 * Utility for converting Egyptian Pound numbers into Arabic words (Tafqeet / تفقيط)
 * Essential for official receipts, invoices, and accounting compliance.
 */

const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
const ELEVEN_TO_NINETEEN = [
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function convertThreeDigits(num: number): string {
  if (num === 0) return "";
  let parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  if (remainder > 0) {
    if (remainder <= 10) {
      parts.push(ONES[remainder]);
    } else if (remainder >= 11 && remainder <= 19) {
      parts.push(ELEVEN_TO_NINETEEN[remainder - 11]);
    } else {
      const u = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (u > 0) {
        parts.push(`${ONES[u]} و${TENS[t]}`);
      } else {
        parts.push(TENS[t]);
      }
    }
  }

  return parts.join(" و");
}

export function tafqeet(amount: number): string {
  if (isNaN(amount) || amount === 0) return "صفر جنيه مصري فقط لا غير";

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const pounds = Math.floor(absAmount);
  const piastres = Math.round((absAmount - pounds) * 100);

  let parts: string[] = [];

  // Millions
  const millions = Math.floor(pounds / 1000000);
  const remainderMillions = pounds % 1000000;
  if (millions > 0) {
    if (millions === 1) parts.push("مليون");
    else if (millions === 2) parts.push("مليونان");
    else if (millions >= 3 && millions <= 10) parts.push(`${convertThreeDigits(millions)} ملايين`);
    else parts.push(`${convertThreeDigits(millions)} مليون`);
  }

  // Thousands
  const thousands = Math.floor(remainderMillions / 1000);
  const remainderThousands = remainderMillions % 1000;
  if (thousands > 0) {
    if (thousands === 1) parts.push("ألف");
    else if (thousands === 2) parts.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertThreeDigits(thousands)} آلاف`);
    else parts.push(`${convertThreeDigits(thousands)} ألف`);
  }

  // Units
  if (remainderThousands > 0) {
    parts.push(convertThreeDigits(remainderThousands));
  }

  let words = parts.join(" و");
  if (!words) words = "صفر";

  let result = `فقط ${words} جنيه مصري`;

  if (piastres > 0) {
    result += ` و${convertThreeDigits(piastres)} قرشاً`;
  }

  result += " لا غير";

  return isNegative ? `سالب ${result}` : result;
}
