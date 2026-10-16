import type { CSSProperties, ReactNode } from 'react';

/** Small building blocks shared by the settings sections. */

export function SectionCard({ title, intro, actions, children }: { title: string; intro?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section style={styles.card} aria-label={title}>
      <header style={styles.head}>
        <div>
          <h2 style={styles.title}>{title}</h2>
          {intro && <p style={styles.intro}>{intro}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div style={styles.field}>
      <label htmlFor={htmlFor} style={styles.label}>{label}</label>
      {children}
      {error ? <div style={styles.error} role="alert">{error}</div> : hint ? <div style={styles.hint}>{hint}</div> : null}
    </div>
  );
}

export function StatusLine({ kind, children }: { kind: 'ok' | 'error'; children: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} style={{ ...styles.status, ...(kind === 'ok' ? styles.statusOk : styles.statusError) }}>
      {children}
    </div>
  );
}

export const buttons = {
  primary: { border: '1px solid #d37105', background: 'linear-gradient(135deg, #f38808, #d37105)', color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' } as CSSProperties,
  secondary: { border: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: '#f38808', padding: '9px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem', whiteSpace: 'nowrap' } as CSSProperties,
  danger: { border: '1px solid rgba(255,138,128,0.6)', background: 'transparent', color: '#ff8a80', padding: '9px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' } as CSSProperties,
  link: { border: 'none', background: 'transparent', color: '#f38808', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.84rem' } as CSSProperties,
};

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-strong)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};

const styles: Record<string, CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 22 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 14 },
  title: { margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' },
  intro: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: 640 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' },
  hint: { fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 },
  error: { fontSize: '0.78rem', color: '#ff8a80' },
  status: { padding: '9px 12px', borderRadius: 10, fontSize: '0.85rem' },
  statusOk: { background: 'rgba(74, 173, 131, 0.14)', color: '#4aad83' },
  statusError: { background: 'rgba(255, 138, 128, 0.12)', color: '#ff8a80' },
};
