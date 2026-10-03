import { useState, type CSSProperties, type FormEvent } from 'react';
import { Role, registrationSchema, type RegistrationInput } from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';

export interface RegisterProps {
  /** Resolves to an error message to show, or null when the account was created. */
  onSubmit: (values: RegistrationInput, address: string) => Promise<string | null>;
}

const initialState: RegistrationInput = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: Role.Customer,
  password: '',
  confirmPassword: '',
  companyName: '',
  acceptTerms: true,
};

export function Register({ onSubmit }: RegisterProps) {
  const [form, setForm] = useState<RegistrationInput>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const isCompact = useMediaQuery('(max-width: 820px)');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registrationSchema.safeParse(form);
    const phoneDigits = (form.phoneNumber ?? '').replace(/\D/g, '').length;

    const found: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!found[key]) found[key] = issue.message;
      }
    }
    if (phoneDigits < 7 || phoneDigits > 15) found.phoneNumber = 'Enter a valid phone number.';
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      found.password = found.password ?? 'Include both letters and numbers.';
    }
    if (!result.success || Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setErrors({});
    setBusy(true);
    const problem = await onSubmit(result.data, address.trim());
    setBusy(false);
    if (problem) setErrors({ form: problem });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={{ ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }}>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-full-name">
            Full name
          </label>
          <input
            id="register-full-name"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            style={styles.input}
            placeholder="Ayesha Khan"
          />
          {errors.fullName && <span style={styles.errorText}>{errors.fullName}</span>}
        </div>

      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          style={styles.input}
          placeholder="name@company.com"
        />
        {errors.email && <span style={styles.errorText}>{errors.email}</span>}
      </div>

      <div style={{ ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }}>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-phone">
            Phone
          </label>
          <input
            id="register-phone"
            value={form.phoneNumber ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            style={styles.input}
            placeholder="+94 77 123 4567"
            autoComplete="tel"
          />
          {errors.phoneNumber && <span style={styles.errorText}>{errors.phoneNumber}</span>}
        </div>

      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="register-address">
          Address <span style={styles.optional}>(optional)</span>
        </label>
        <input
          id="register-address"
          autoComplete="street-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          style={styles.input}
          placeholder="Street, city"
          maxLength={300}
        />
      </div>

      <div style={{ ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }}>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            style={styles.input}
            placeholder="Minimum 8 characters"
          />
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            style={styles.input}
            placeholder="Repeat password"
          />
          {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
        </div>
      </div>

      <label style={styles.checkboxRow} htmlFor="register-terms">
        <input
          id="register-terms"
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(event) =>
            setForm((current) => ({ ...current, acceptTerms: event.target.checked ? true : false }))
          }
        />
        <span>I accept the operational platform terms.</span>
      </label>
      {errors.acceptTerms && <span style={styles.errorText}>{errors.acceptTerms}</span>}

      {errors.form && <span style={styles.errorText} role="alert">{errors.form}</span>}

      <button type="submit" style={{ ...styles.submitButton, ...(busy ? { opacity: 0.7, cursor: 'wait' } : undefined) }} disabled={busy}>
        {busy ? 'Creating account…' : 'Create account'}
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
  row: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  rowCompact: {
    gridTemplateColumns: '1fr',
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
    background: 'var(--surface-elevated)',
    color: 'var(--text-primary)',
    borderRadius: '14px',
    padding: '13px 14px',
    outline: 'none',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
  },
  optional: {
    fontWeight: 400,
    color: 'var(--text-secondary)',
  },
  errorText: {
    color: '#d37105',
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

export default Register;