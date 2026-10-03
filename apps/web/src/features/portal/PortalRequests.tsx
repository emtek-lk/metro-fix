import { useEffect, useState, type CSSProperties } from 'react';
import { JobStatus, JOB_STAGES, canTransition, type ServiceRequest } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { WebSocketService } from '../../lib/websocket';
import { RefreshButton } from '../../components/RefreshButton';
import { SkeletonCards } from '@metro-fix/ui';
import { useAppSettings } from '../../lib/settings';

// The stages and their order come from the shared lifecycle; only the customer-facing wording is here.
const STAGES = JOB_STAGES;

const STAGE_LABEL: Record<string, string> = {
  REQUESTED: 'Received',
  PENDING_ACCEPTANCE: 'Finding a technician',
  ASSIGNED: 'Technician assigned',
  ON_ROUTE: 'On the way',
  INSPECTION: 'Inspecting',
  IN_PROGRESS: 'Work in progress',
  COMPLETED: 'Work complete',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

type Job = ServiceRequest & {
  quoteAmount?: number | string | null;
};

export function PortalRequests({ refreshKey }: { refreshKey: number }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const app = useAppSettings();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const cancelRequest = async (job: Job) => {
    if (!window.confirm('Cancel this request?')) return;
    setCancelling(job.id);
    setError(null);
    const token = localStorage.getItem('metrofix_token');
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${job.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as Job;
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err: any) {
      setError(err?.message || 'Could not cancel the request.');
    } finally {
      setCancelling(null);
    }
  };

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('metrofix_token');
    setLoading(true);
    fetch(`${API_BASE_URL}/jobs/mine`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Job[]) => active && setJobs(data))
      .catch(() => active && setError('Could not load your requests.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshKey, reloadKey]);

  // Live status changes for this customer's own requests (the gateway only sends those).
  useEffect(() => {
    const ws = new WebSocketService(API_BASE_URL);
    ws.connect(localStorage.getItem('metrofix_token'));
    const offCreated = ws.on('job.created', (job) =>
      setJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job as Job, ...prev])),
    );
    const offUpdated = ws.on('job.updated', (job) =>
      setJobs((prev) => prev.map((j) => (j.id === job.id ? (job as Job) : j))),
    );
    return () => {
      offCreated();
      offUpdated();
      ws.disconnect();
    };
  }, []);

  return (
    <section style={styles.page} aria-label="My requests">
      <div style={styles.topRow}>
        <h1 style={styles.pageTitle}>My requests{jobs.length > 0 ? <span style={styles.count}>{jobs.length}</span> : null}</h1>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} subject="requests" />
      </div>
      {loading && jobs.length === 0 && <SkeletonCards count={3} height={120} />}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p style={styles.muted}>No requests yet. Pick a service under “Services” to get started.</p>
      )}

      <div style={styles.list}>
      {jobs.map((job) => {
        const stageIndex = STAGES.indexOf(job.status);
        return (
          <article key={job.id} style={styles.card}>
            <header style={styles.header}>
              <h3 style={styles.title}>{job.title}</h3>
              <span style={styles.status}>{STAGE_LABEL[job.status] ?? job.status}</span>
            </header>
            <p style={styles.desc}>{job.description}</p>
            {job.status !== JobStatus.CANCELLED && (
              <>
                <ol style={styles.track} aria-label={`Progress: ${STAGE_LABEL[job.status] ?? job.status}, step ${stageIndex + 1} of ${STAGES.length}`}>
                  {STAGES.map((stage, index) => (
                    <li
                      key={stage}
                      title={STAGE_LABEL[stage]}
                      style={{ ...styles.dot, ...(index <= stageIndex ? styles.dotDone : undefined) }}
                    />
                  ))}
                </ol>
                <div style={styles.stepLine}>
                  Step {stageIndex + 1} of {STAGES.length}
                  {STAGES[stageIndex + 1] ? ` · next: ${STAGE_LABEL[STAGES[stageIndex + 1]]}` : ''}
                </div>
              </>
            )}
            <footer style={styles.meta}>
              <span>Raised {new Date(job.createdAt).toLocaleString()}</span>
              {job.worker?.user?.fullName && <span>Technician: {job.worker.user.fullName}</span>}
              {job.quoteAmount != null && <span>Quote: LKR {Number(job.quoteAmount).toLocaleString('en-LK')}</span>}
              {job.cancelReason && <span>Reason: {job.cancelReason}</span>}
              {app.allowCustomerCancellation && canTransition(job.status, JobStatus.CANCELLED) && (
                <button
                  type="button"
                  style={styles.cancelButton}
                  disabled={cancelling === job.id}
                  onClick={() => void cancelRequest(job)}
                >
                  {cancelling === job.id ? 'Cancelling…' : 'Cancel request'}
                </button>
              )}
            </footer>
          </article>
        );
      })}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 14 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pageTitle: { margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 },
  count: { fontSize: '0.8rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: 'var(--surface-strong)', color: 'var(--text-secondary)' },
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 14, alignItems: 'start' },
  muted: { color: 'var(--text-muted)' },
  error: { color: '#c62828', fontWeight: 600 },
  card: { padding: 16, borderRadius: 16, background: 'var(--surface)', color: 'var(--text-primary)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: 10 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { margin: 0, fontSize: '1rem', lineHeight: 1.3, minWidth: 0 },
  status: { flexShrink: 0, fontSize: '0.74rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: '#f38808', color: '#fff' },
  cancelButton: { marginLeft: 'auto', minHeight: 40, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', padding: '0 16px', borderRadius: 999, fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' },
  desc: { margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.45, whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
  track: { display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 },
  dot: { flex: 1, height: 6, borderRadius: 3, background: 'var(--border-subtle)' },
  dotDone: { background: '#f38808' },
  stepLine: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: -4 },
  meta: { display: 'flex', gap: '6px 16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' },
};
