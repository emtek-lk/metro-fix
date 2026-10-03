/**
 * One CSV cell, quoted. Cells that start with = + - or @ are prefixed with an apostrophe so a
 * spreadsheet never runs them as a formula (CSV injection) when an admin opens an export.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
}
