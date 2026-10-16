import {
  computeJobCardTotals,
  type JobCardLineItem,
  type JobCardLineKind,
  type JobCardSection,
} from '@metro-fix/core-types';

/** A line as typed: numbers stay text while editing so "2." and "" are allowed. */
export interface LineDraft {
  id: string;
  kind: JobCardLineKind;
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface JobCardDraft {
  lines: LineDraft[];
  hours: string;
  notes: string;
}

export interface JobCardPayload {
  lineItems: Pick<JobCardLineItem, 'kind' | 'description' | 'quantity' | 'unitPrice'>[];
  hours: number;
  notes: string;
}

let counter = 0;
export const newLine = (kind: JobCardLineKind = 'LABOUR', labourRate = 0): LineDraft => ({
  id: `line-${Date.now()}-${counter++}`,
  kind,
  description: '',
  quantity: '1',
  // Labour lines start at the company's standard hourly rate (Settings > Billing).
  unitPrice: kind === 'LABOUR' && labourRate > 0 ? String(labourRate) : '',
});

const numberText = (value: number) => (Number.isFinite(value) ? String(value) : '');

/** Starts from an existing card section (the estimate, to confirm at completion) or a blank card. */
export function draftFromSection(section: JobCardSection | null | undefined, labourRate = 0): JobCardDraft {
  if (!section || section.lineItems.length === 0) {
    return { lines: [newLine('LABOUR', labourRate)], hours: '', notes: '' };
  }
  return {
    lines: section.lineItems.map((item) => ({
      id: item.id,
      kind: item.kind,
      description: item.description,
      quantity: numberText(item.quantity),
      unitPrice: numberText(item.unitPrice),
    })),
    hours: numberText(section.hours),
    notes: section.notes ?? '',
  };
}

const toNumber = (text: string): number => {
  const value = Number(text.trim().replace(/,/g, ''));
  return text.trim() === '' || !Number.isFinite(value) ? NaN : value;
};

/** Live totals for what is on screen (invalid or empty numbers count as 0). */
export function draftTotals(draft: JobCardDraft, taxRate: number) {
  return computeJobCardTotals(
    draft.lines.map((line) => ({
      quantity: toNumber(line.quantity) || 0,
      unitPrice: toNumber(line.unitPrice) || 0,
    })),
    taxRate,
  );
}

/** Checks the draft and returns what to send to the API, or the first problem found. */
export function draftToPayload(draft: JobCardDraft): { ok: true; payload: JobCardPayload } | { ok: false; error: string } {
  const lines = draft.lines.filter((line) => line.description.trim() || line.unitPrice.trim());
  if (lines.length === 0) return { ok: false, error: 'Add at least one line with a description and price.' };

  const lineItems: JobCardPayload['lineItems'] = [];
  for (const line of lines) {
    if (!line.description.trim()) return { ok: false, error: 'Give every line a description.' };
    const quantity = toNumber(line.quantity);
    const unitPrice = toNumber(line.unitPrice);
    if (Number.isNaN(quantity) || quantity < 0) return { ok: false, error: `Enter a valid quantity for “${line.description.trim()}”.` };
    if (Number.isNaN(unitPrice) || unitPrice < 0) return { ok: false, error: `Enter a valid price for “${line.description.trim()}”.` };
    lineItems.push({ kind: line.kind, description: line.description.trim(), quantity, unitPrice });
  }

  const hours = draft.hours.trim() === '' ? 0 : toNumber(draft.hours);
  if (Number.isNaN(hours) || hours < 0) return { ok: false, error: 'Enter the hours on site as a number.' };

  return { ok: true, payload: { lineItems, hours, notes: draft.notes.trim() } };
}
