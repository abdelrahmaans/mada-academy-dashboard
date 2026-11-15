/**
 * Universal Excel / CSV Export Utility for Mada Academy
 * Uses UTF-8 BOM (\uFEFF) to guarantee correct rendering of Arabic characters in Microsoft Excel.
 */

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null | undefined;
}

export function generateCSVContent<T>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  if (!data || data.length === 0) {
    throw new Error("لا توجد بيانات متاحة للتصدير حالياً.");
  }

  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = columns.map(c => escapeCell(c.header)).join(",");
  const dataRows = data.map(item =>
    columns.map(c => escapeCell(c.accessor(item))).join(",")
  );

  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csvContent = generateCSVContent(data, columns);

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
