import { draftFromSection, draftToPayload, draftTotals, newLine, type JobCardDraft } from '../src/lib/jobCard';

const draft = (overrides: Partial<JobCardDraft> = {}): JobCardDraft => ({
  lines: [
    { ...newLine('LABOUR'), description: 'Technician', quantity: '2', unitPrice: '1500' },
    { ...newLine('MATERIAL'), description: 'Valve', quantity: '3', unitPrice: '250.5' },
  ],
  hours: '2',
  notes: ' done ',
  ...overrides,
});

describe('job card draft', () => {
  it('computes totals with tax as lines change', () => {
    expect(draftTotals(draft(), 10)).toEqual({ subtotal: 3751.5, tax: 375.15, total: 4126.65 });
  });

  it('treats half-typed numbers as zero in the live total', () => {
    const d = draft();
    d.lines[0].quantity = '';
    expect(draftTotals(d, 0).subtotal).toBe(751.5);
  });

  it('builds the API payload with numbers and trimmed text', () => {
    const result = draftToPayload(draft());
    expect(result).toEqual({
      ok: true,
      payload: {
        lineItems: [
          { kind: 'LABOUR', description: 'Technician', quantity: 2, unitPrice: 1500 },
          { kind: 'MATERIAL', description: 'Valve', quantity: 3, unitPrice: 250.5 },
        ],
        hours: 2,
        notes: 'done',
      },
    });
  });

  it('drops untouched blank lines but refuses a priced line with no description', () => {
    const blank = draft();
    blank.lines.push(newLine('OTHER'));
    expect(draftToPayload(blank).ok).toBe(true);
    blank.lines.push({ ...newLine('OTHER'), unitPrice: '10' });
    expect(draftToPayload(blank)).toEqual({ ok: false, error: 'Give every line a description.' });
  });

  it('asks for at least one line, and valid numbers', () => {
    expect(draftToPayload({ lines: [newLine()], hours: '', notes: '' }).ok).toBe(false);
    const bad = draft();
    bad.lines[0].unitPrice = 'abc';
    expect(draftToPayload(bad)).toMatchObject({ ok: false });
    expect(draftToPayload(draft({ hours: '-1' }))).toMatchObject({ ok: false });
  });

  it('starts from an existing section so the worker confirms or edits the estimate', () => {
    const section = {
      lineItems: [{ id: 'a', kind: 'LABOUR' as const, description: 'Work', quantity: 2, unitPrice: 100 }],
      hours: 2, notes: 'n', subtotal: 200, tax: 0, total: 200, savedAt: 'x',
    };
    expect(draftFromSection(section)).toEqual({
      lines: [{ id: 'a', kind: 'LABOUR', description: 'Work', quantity: '2', unitPrice: '100' }],
      hours: '2',
      notes: 'n',
    });
    expect(draftFromSection(null).lines).toHaveLength(1);
  });
});
