import { useState, type CSSProperties, type FormEvent } from 'react';
import { loginSchema, type LoginInput } from '@metro-fix/core-types';
import { BrandLogo } from '@metro-fix/ui';

export interface LoginProps {
  onSubmit: (values: LoginInput) => void;
}

const initialState: LoginInput = {
  email: '',
  password: '',
};

export function Login({ onSubmit }: LoginProps) {
  const [form, setForm] = useState<LoginInput>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginSchema.safeParse(form);

    if (!result.success) {
      setErrors(
        result.error.issues.reduce<Record<string, string>>((collection, issue) => {
          const key = issue.path.join('.') || 'form';
          collection[key] = issue.message;
          return collection;
        }, {})
      );
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <img src={BrandLogo} alt="Metro-Fix" style={styles.logo} />

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="login-email">
          Work email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          style={styles.input}
          placeholder="name@company.com"
        />
        {errors.email && <span style={styles.errorText}>{errors.email}</span>}
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          style={styles.input}
          placeholder="Enter your password"
        />
        {errors.password && <span style={styles.errorText}>{errors.password}</span>}
      </div>

      <button type="submit" style={styles.submitButton}>
        Open workspace
      </button>
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  logo: {
    display: 'block',
    maxWidth: '180px',
    height: 'auto',
    margin: '0 auto 24px auto',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '14px',
    padding: '13px 14px',
    outline: 'none',
  },
  errorText: {
    color: '#b14f4f',
    fontSize: '0.84rem',
  },
  submitButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
    color: 'var(--text-inverse)',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-elevated)',
  },
};

export default Login;