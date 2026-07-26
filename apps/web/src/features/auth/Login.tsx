import { type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@metro-fix/core-types';
import { BrandLogo } from '@metro-fix/ui';

export interface LoginProps {
  onSubmit: (values: LoginInput) => void;
  isLoading?: boolean;
}

export function Login({ onSubmit, isLoading = false }: LoginProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
      <div style={styles.logoWrapper}>
        <img src={BrandLogo} alt="Metro-Fix Logo" style={styles.logo} />
      </div>

      <div style={styles.headerGroup}>
        <h2 style={styles.formTitle}>Sign In</h2>
        <p style={styles.formSubtitle}>Access your METRO-FIX facility control center</p>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="login-email">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          style={{
            ...styles.input,
            ...(errors.email ? styles.inputError : undefined),
          }}
          placeholder="admin@metro-fix.com"
        />
        {errors.email && <span style={styles.errorText}>{errors.email.message}</span>}
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          style={{
            ...styles.input,
            ...(errors.password ? styles.inputError : undefined),
          }}
          placeholder="••••••••"
        />
        {errors.password && <span style={styles.errorText}>{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isLoading} style={styles.submitButton}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      <div style={styles.quickAccessBlock}>
        <div style={styles.quickAccessTitle}>Demo Accounts (Password: 8+ chars)</div>
        <div style={styles.quickAccessBadges}>
          <div style={styles.badgeItem}>
            <span style={styles.badgeRole}>Admin:</span>
            <code style={styles.code}>admin@metro-fix.com</code>
          </div>
          <div style={styles.badgeItem}>
            <span style={styles.badgeRole}>Dispatcher:</span>
            <code style={styles.code}>dispatch@metro-fix.com</code>
          </div>
        </div>
      </div>
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  logo: {
    display: 'block',
    maxHeight: '40px',
    width: 'auto',
  },
  headerGroup: {
    textAlign: 'center',
    marginBottom: '4px',
  },
  formTitle: {
    margin: '0 0 4px',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  formSubtitle: {
    margin: 0,
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    padding: '12px 14px',
    outline: 'none',
    fontSize: '0.92rem',
  },
  inputError: {
    borderColor: '#e53e3e',
    boxShadow: '0 0 0 1px #e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: '0.82rem',
    fontWeight: 500,
    marginTop: '2px',
  },
  submitButton: {
    border: 'none',
    borderRadius: '12px',
    padding: '13px 18px',
    background: '#f38808',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(243, 136, 8, 0.35)',
    marginTop: '6px',
  },
  quickAccessBlock: {
    marginTop: '10px',
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
  },
  quickAccessTitle: {
    fontSize: '0.76rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
  },
  quickAccessBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  badgeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
  },
  badgeRole: {
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  code: {
    background: '#2b435f',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  },
};

export default Login;