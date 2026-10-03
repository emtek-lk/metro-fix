import { useEffect, useState, type CSSProperties } from 'react';
import { JobStatus, JOB_STAGES, canTransition, type ServiceRequest } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { WebSocketService } from '../../lib/websocket';
import { RefreshButton } from '../../components/RefreshButton';
import { SkeletonCards } from '@metro-fix/ui';

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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} subject="requests" />
      </div>
      {loading && jobs.length === 0 && <SkeletonCards count={3} height={120} />}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p style={styles.muted}>No requests yet. Pick a service under “Browse Services” to get started.</p>
      )}

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
              <ol style={styles.track} aria-label="Progress">
                {STAGES.map((stage, index) => (
                  <li
                    key={stage}
                    title={STAGE_LABEL[stage]}
                    style={{ ...styles.dot, ...(index <= stageIndex ? styles.dotDone : undefined) }}
                  />
                ))}
              </ol>
            )}
            <footer style={styles.meta}>
              <span>Raised {new Date(job.createdAt).toLocaleString()}</span>
              {job.worker?.user?.fullName && <span>Technician: {job.worker.user.fullName}</span>}
              {job.quoteAmount != null && <span>Quote: LKR {Number(job.quoteAmount).toLocaleString('en-LK')}</span>}
              {job.cancelReason && <span>Reason: {job.cancelReason}</span>}
              {canTransition(job.status, JobStatus.CANCELLED) && (
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
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 4px 32px' },
  muted: { color: 'var(--text-muted)' },
  error: { color: '#c62828', fontWeight: 600 },
  card: { padding: 16, borderRadius: 16, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: 8 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '1rem' },
  status: { fontSize: '0.78rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: '#f38808', color: '#fff' },
  cancelButton: { marginLeft: 'auto', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: 999, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' },
  desc: { margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem', whiteSpace: 'pre-line' },
  track: { display: 'flex', gap: 6, listStyle: 'none', margin: 0, padding: 0 },
  dot: { flex: 1, height: 6, borderRadius: 3, background: 'var(--border-subtle)' },
  dotDone: { background: '#f38808' },
  meta: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' },
};
