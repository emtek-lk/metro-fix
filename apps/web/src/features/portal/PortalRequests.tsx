import { useEffect, useState, type CSSProperties } from 'react';
import { JobStatus, type ServiceRequest } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { WebSocketService } from '../../lib/websocket';

const STAGES: JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.CLOSED,
];

const STAGE_LABEL: Record<string, string> = {
  REQUESTED: 'Received',
  ASSIGNED: 'Technician assigned',
  ON_ROUTE: 'On the way',
  INSPECTION: 'Inspecting',
  IN_PROGRESS: 'Work in progress',
  COMPLETED: 'Work complete',
  CLOSED: 'Closed',
};

type Job = ServiceRequest & {
  urgency?: string;
  worker?: { user?: { fullName?: string } } | null;
  quoteAmount?: number | string | null;
};

export function PortalRequests({ refreshKey }: { refreshKey: number }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [refreshKey]);

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
      {loading && <p style={styles.muted}>Loading your requests…</p>}
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
            <ol style={styles.track} aria-label="Progress">
              {STAGES.map((stage, index) => (
                <li
                  key={stage}
                  title={STAGE_LABEL[stage]}
                  style={{ ...styles.dot, ...(index <= stageIndex ? styles.dotDone : undefined) }}
                />
              ))}
            </ol>
            <footer style={styles.meta}>
              <span>Raised {new Date(job.createdAt).toLocaleString()}</span>
              {job.worker?.user?.fullName && <span>Technician: {job.worker.user.fullName}</span>}
              {job.quoteAmount != null && <span>Quote: LKR {Number(job.quoteAmount).toLocaleString('en-LK')}</span>}
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
  desc: { margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem', whiteSpace: 'pre-line' },
  track: { display: 'flex', gap: 6, listStyle: 'none', margin: 0, padding: 0 },
  dot: { flex: 1, height: 6, borderRadius: 3, background: 'var(--border-subtle)' },
  dotDone: { background: '#f38808' },
  meta: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' },
};
