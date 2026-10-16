import { useState, type CSSProperties } from 'react';
import { jobCardBillable, type JobCard, type JobCardSection, JobStatus } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { JobCardEditor, formatMoney, newLine, type JobCardDraft } from '../../components/JobCardEditor';

interface JobCardModalProps {
  jobId: string;
  title: string;
  status: JobStatus;
  jobCard: JobCard | null | undefined;
  onClose: () => void;
  onSaved: (job: any) => void;
}

const toDraft = (section: JobCardSection | null | undefined): JobCardDraft => ({
  lineItems: section?.lineItems?.length ? section.lineItems.map((line) => ({ ...line })) : [newLine('LABOUR')],
  hours: section?.hours ?? 0,
  notes: section?.notes ?? '',
});

/**
 * The job card behind a ticket: the worker's estimate (read only) and the final that invoicing
 * uses. Dispatch can correct the final until the ticket is closed.
 */
export function JobCardModal({ jobId, title, status, jobCard, onClose, onSaved }: JobCardModalProps) {
  const editable = status === JobStatus.InProgress || status === JobStatus.Completed;
  const currency = jobCard?.currency ?? 'LKR';
  const taxRate = jobCard?.taxRate ?? 0;
  const [draft, setDraft] = useState<JobCardDraft>(() => toDraft(jobCardBillable(jobCard)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (draft.lineItems.some((line) => !line.description.trim())) {
      return setError('Give every line a description, or remove it.');
    }
    setSaving(true);
    setError(null);
    const token = localStorage.getItem('metrofix_token');
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/job-card`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          lineItems: draft.lineItems.map(({ id, kind, description, quantity, unitPrice }) => ({
            id: id.startsWith('new-') ? undefined : id,
            kind,
            description,
            quantity,
            unitPrice,
          })),
          hours: draft.hours,
          notes: draft.notes,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Could not save the job card.');
      }
      onSaved(await response.json());
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save the job card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Job card" className="metro-modal-overlay">
      <div style={styles.card} className="metro-modal-card">
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Job card · {jobCard?.final ? 'Final' : jobCard ? 'Estimate' : 'Not quoted'}</div>
            <h3 style={styles.title}>{title}</h3>
          </div>
          <button type="button" style={styles.close} onClick={onClose}>Close</button>
        </div>

        {!jobCard && !editable && <p style={styles.muted}>The worker has not submitted a quote for this job yet.</p>}

        {jobCard?.estimate && (
          <div style={styles.estimate}>
            Worker estimate: <strong>{formatMoney(jobCard.estimate.total, currency)}</strong> over{' '}
            <strong>{jobCard.estimate.hours} h</strong>
            {jobCard.final && (
              <>
                {' '}
                · Final: <strong>{formatMoney(jobCard.final.total, currency)}</strong> over <strong>{jobCard.final.hours} h</strong>
              </>
            )}
          </div>
        )}

        {(jobCard || editable) && (
          <>
            <div style={styles.sectionTitle}>{editable ? 'Final card (edit before closing)' : 'Job card'}</div>
            <JobCardEditor draft={draft} taxRate={taxRate} currency={currency} readOnly={!editable} onChange={setDraft} />
          </>
        )}

        {error && <div style={styles.error} role="alert">{error}</div>}

        {editable && (
          <div style={styles.actions}>
            <button type="button" style={styles.close} onClick={onClose}>Cancel</button>
            <button type="button" style={styles.primary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save final card'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4, 10, 11, 0.62)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 99999 },
  card: { width: 'min(820px, 100%)', borderRadius: 24, background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: 20, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 72px rgba(0, 0, 0, 0.32)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
  kicker: { color: '#f38808', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.78rem', fontWeight: 700 },
  title: { margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 },
  close: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' },
  estimate: { padding: '10px 12px', borderRadius: 10, background: 'var(--surface-strong)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 14 },
  sectionTitle: { fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 10 },
  muted: { color: 'var(--text-secondary)', fontSize: '0.88rem' },
  error: { marginTop: 14, color: '#ff8a80', fontSize: '0.85rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  primary: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#ffffff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' },
};
