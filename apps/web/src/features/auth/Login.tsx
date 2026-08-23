import { useState, type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput, type User } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';

export interface LoginProps {
  onSuccess: (data: { accessToken: string; user: User }) => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Invalid email address or password.');
      }

      const data = await response.json();
      // data: { accessToken: string, user: User }
      onSuccess(data);
    } catch (err: any) {
      setAuthError(err.message || 'Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
      <div style={styles.headerGroup}>
        <div style={styles.sectionEyebrow}>Secure Access</div>
        <h2 style={styles.formTitle}>Sign In</h2>
        <p style={styles.formSubtitle}>Access your METRO-FIX facility control center.</p>
      </div>

      {authError && (
        <div style={styles.errorBanner}>
          <span>⚠️ {authError}</span>
        </div>
      )}

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
  sectionEyebrow: {
    fontSize: '0.76rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--sidebar-accent)',
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '2px',
  },
  formTitle: {
    margin: 0,
    fontSize: '1.65rem',
    lineHeight: 1.05,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
  },
  formSubtitle: {
    margin: 0,
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
  },
  errorBanner: {
    padding: '11px 14px',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    fontSize: '0.86rem',
    fontWeight: 700,
    border: '1px solid var(--border-subtle)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-elevated)',
    color: 'var(--text-primary)',
    borderRadius: '14px',
    padding: '13px 14px',
    outline: 'none',
    fontSize: '0.92rem',
    boxShadow: 'inset 0 1px 2px rgba(16, 36, 38, 0.05)',
  },
  inputError: {
    borderColor: '#e53e3e',
    boxShadow: '0 0 0 1px rgba(229, 62, 62, 0.45)',
  },
  errorText: {
    color: '#d37105',
    fontSize: '0.82rem',
    fontWeight: 600,
    marginTop: '2px',
  },
  submitButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #f7b552 0%, #f38808 48%, #d37105 100%)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 14px 28px rgba(243, 136, 8, 0.34)',
    marginTop: '6px',
  },
};

export default Login;