import { useMemo, type CSSProperties } from 'react';
import {
  computeJobCardTotals,
  jobCardLineTotal,
  type JobCardLineItem,
  type JobCardLineKind,
} from '@metro-fix/core-types';

export interface JobCardDraft {
  lineItems: JobCardLineItem[];
  hours: number;
  notes: string;
}

const KIND_LABEL: Record<JobCardLineKind, string> = { LABOUR: 'Labour', MATERIAL: 'Material', OTHER: 'Other' };

export const formatMoney = (value: number, currency = 'LKR'): string =>
  `${currency} ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

let counter = 0;
export const newLine = (kind: JobCardLineKind = 'LABOUR'): JobCardLineItem => ({
  id: `new-${Date.now()}-${counter++}`,
  kind,
  description: '',
  quantity: 1,
  unitPrice: 0,
});

interface JobCardEditorProps {
  draft: JobCardDraft;
  taxRate: number;
  currency: string;
  readOnly?: boolean;
  onChange?: (draft: JobCardDraft) => void;
}

/** Itemised job card: lines, time, notes and live totals. The API recomputes totals on save. */
export function JobCardEditor({ draft, taxRate, currency, readOnly = false, onChange }: JobCardEditorProps) {
  const totals = useMemo(() => computeJobCardTotals(draft.lineItems, taxRate), [draft.lineItems, taxRate]);
  const update = (patch: Partial<JobCardDraft>) => onChange?.({ ...draft, ...patch });
  const updateLine = (id: string, patch: Partial<JobCardLineItem>) =>
    update({ lineItems: draft.lineItems.map((line) => (line.id === id ? { ...line, ...patch } : line)) });
  const num = (text: string) => (text === '' ? 0 : Math.max(0, Number(text) || 0));

  return (
    <div>
      <div style={styles.table} role="table" aria-label="Job card lines">
        <div style={{ ...styles.row, ...styles.head }} role="row">
          <span>Type</span>
          <span>Description</span>
          <span style={styles.right}>Qty / hrs</span>
          <span style={styles.right}>Unit price</span>
          <span style={styles.right}>Amount</span>
          <span />
        </div>
        {draft.lineItems.map((line) => (
          <div key={line.id} style={styles.row} role="row">
            {readOnly ? (
              <>
                <span>{KIND_LABEL[line.kind]}</span>
                <span>{line.description}</span>
                <span style={styles.right}>{line.quantity}</span>
                <span style={styles.right}>{line.unitPrice.toFixed(2)}</span>
              </>
            ) : (
              <>
                <select aria-label="Line type" style={styles.input} value={line.kind} onChange={(e) => updateLine(line.id, { kind: e.target.value as JobCardLineKind })}>
                  {(Object.keys(KIND_LABEL) as JobCardLineKind[]).map((kind) => (
                    <option key={kind} value={kind}>{KIND_LABEL[kind]}</option>
                  ))}
                </select>
                <input aria-label="Line description" style={styles.input} value={line.description} placeholder="What was done / supplied" onChange={(e) => updateLine(line.id, { description: e.target.value })} />
                <input aria-label="Quantity" style={{ ...styles.input, ...styles.right }} inputMode="decimal" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: num(e.target.value) })} />
                <input aria-label="Unit price" style={{ ...styles.input, ...styles.right }} inputMode="decimal" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: num(e.target.value) })} />
              </>
            )}
            <span style={{ ...styles.right, ...styles.amount }}>{jobCardLineTotal(line).toFixed(2)}</span>
            {readOnly ? (
              <span />
            ) : (
              <button type="button" style={styles.remove} aria-label="Remove line" onClick={() => update({ lineItems: draft.lineItems.filter((l) => l.id !== line.id) })}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div style={styles.addRow}>
          <button type="button" style={styles.add} onClick={() => update({ lineItems: [...draft.lineItems, newLine('LABOUR')] })}>+ Labour</button>
          <button type="button" style={styles.add} onClick={() => update({ lineItems: [...draft.lineItems, newLine('MATERIAL')] })}>+ Material</button>
          <button type="button" style={styles.add} onClick={() => update({ lineItems: [...draft.lineItems, newLine('OTHER')] })}>+ Other</button>
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.meta}>
          <label style={styles.label} htmlFor="card-hours">Time on site (hours)</label>
          {readOnly ? (
            <div>{draft.hours} h</div>
          ) : (
            <input id="card-hours" style={{ ...styles.input, maxWidth: 120 }} inputMode="decimal" value={draft.hours} onChange={(e) => update({ hours: num(e.target.value) })} />
          )}
          <label style={styles.label} htmlFor="card-notes">Notes</label>
          {readOnly ? (
            <div style={styles.notes}>{draft.notes || '—'}</div>
          ) : (
            <textarea id="card-notes" style={{ ...styles.input, minHeight: 60, resize: 'vertical' }} value={draft.notes} onChange={(e) => update({ notes: e.target.value })} />
          )}
        </div>
        <div style={styles.totals} aria-label="Totals">
          <div style={styles.totalRow}><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
          <div style={styles.totalRow}><span>Tax ({taxRate}%)</span><span>{formatMoney(totals.tax, currency)}</span></div>
          <div style={{ ...styles.totalRow, ...styles.grand }}><span>Total</span><span>{formatMoney(totals.total, currency)}</span></div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  table: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr) 84px 104px 104px 28px', gap: 8, alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-primary)' },
  head: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' },
  right: { textAlign: 'right' },
  amount: { fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box', padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit' },
  remove: { border: 'none', background: 'transparent', color: '#ff8a80', cursor: 'pointer', fontSize: '0.9rem' },
  addRow: { display: 'flex', gap: 8, marginTop: 10 },
  add: { border: '1px dashed rgba(243, 136, 8, 0.6)', background: 'transparent', color: '#f38808', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' },
  footer: { display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16, alignItems: 'flex-start' },
  meta: { flex: '1 1 260px', minWidth: 0 },
  label: { display: 'block', margin: '8px 0 4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' },
  notes: { whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-primary)' },
  totals: { flex: '0 1 260px', marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: 'var(--text-primary)' },
  totalRow: { display: 'flex', justifyContent: 'space-between', gap: 16 },
  grand: { borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontWeight: 800, fontSize: '1rem' },
};
