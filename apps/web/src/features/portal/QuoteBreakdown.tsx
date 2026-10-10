import type { CSSProperties } from 'react';
import { JobStatus, jobCardBillable, jobCardLineTotal, type JobCard, type JobCardLineKind } from '@metro-fix/core-types';

const KIND_LABEL: Record<JobCardLineKind, string> = { LABOUR: 'Labour', MATERIAL: 'Materials', OTHER: 'Other' };

const money = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The technician's itemised quote (and, once work is confirmed, the final bill), so a customer sees
 * what they are paying for and not only the total. Open while the work is in progress.
 */
export function QuoteBreakdown({ card, status }: { card: JobCard; status: JobStatus }) {
  const section = jobCardBillable(card);
  if (!section || section.lineItems.length === 0) return null;

  const currency = card.currency || 'LKR';
  const isFinal = Boolean(card.final);
  const quotedTotal = card.estimate?.total;
  const changed = isFinal && quotedTotal != null && Math.abs(quotedTotal - section.total) > 0.005;

  return (
    <details style={styles.box} open={status === JobStatus.IN_PROGRESS}>
      <summary style={styles.summary}>
        <span>{isFinal ? 'Final bill' : 'Quote from your technician'}</span>
        <strong style={styles.total}>{money(section.total, currency)}</strong>
      </summary>

      <ul style={styles.lines}>
        {section.lineItems.map((line) => (
          <li key={line.id} style={styles.line}>
            <div style={styles.lineText}>
              <div>{line.description}</div>
              <div style={styles.kind}>
                {KIND_LABEL[line.kind] ?? line.kind} · {line.quantity}
                {line.kind === 'LABOUR' ? ' h' : ''} × {money(line.unitPrice, currency)}
              </div>
            </div>
            <div style={styles.amount}>{money(jobCardLineTotal(line), currency)}</div>
          </li>
        ))}
      </ul>

      <dl style={styles.sums}>
        <div style={styles.sumRow}>
          <dt>Subtotal</dt>
          <dd style={styles.dd}>{money(section.subtotal, currency)}</dd>
        </div>
        {section.tax > 0 && (
          <div style={styles.sumRow}>
            <dt>Tax ({card.taxRate}%)</dt>
            <dd style={styles.dd}>{money(section.tax, currency)}</dd>
          </div>
        )}
        <div style={{ ...styles.sumRow, ...styles.grand }}>
          <dt>Total</dt>
          <dd style={styles.dd}>{money(section.total, currency)}</dd>
        </div>
      </dl>

      {changed && <p style={styles.note}>Originally quoted {money(quotedTotal as number, currency)}. The final bill reflects the work actually done.</p>}
      {section.hours > 0 && <p style={styles.note}>{isFinal ? 'Time spent' : 'Estimated time'}: about {section.hours} {section.hours === 1 ? 'hour' : 'hours'}</p>}
      {section.notes && <p style={styles.note}>Technician’s note: {section.notes}</p>}
    </details>
  );
}

const styles: Record<string, CSSProperties> = {
  box: { borderRadius: 12, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-subtle)', background: 'var(--surface-strong)', padding: '10px 12px' },
  summary: { cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' },
  total: { color: '#f38808', fontSize: '0.95rem', whiteSpace: 'nowrap' },
  lines: { listStyle: 'none', margin: '8px 0 0', padding: 0 },
  line: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-primary)' },
  lineText: { minWidth: 0, overflowWrap: 'break-word' },
  kind: { fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 },
  amount: { fontWeight: 700, whiteSpace: 'nowrap' },
  sums: { margin: '8px 0 0', display: 'grid', gap: 4 },
  sumRow: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' },
  dd: { margin: 0, whiteSpace: 'nowrap' },
  grand: { fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', paddingTop: 4 },
  note: { margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 },
};
