import { useState, type CSSProperties, type FormEvent } from 'react';
import { Role, registrationSchema, type RegistrationInput } from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';
import { BrandLogo } from '@metro-fix/ui';

export interface RegisterProps {
  onSubmit: (values: RegistrationInput) => void;
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
  const isCompact = useMediaQuery('(max-width: 820px)');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registrationSchema.safeParse(form);

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

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-role">
            Role
          </label>
          <select
            id="register-role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
            style={styles.input}
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
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
            placeholder="+1 555 0100"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="register-company">
            Company
          </label>
          <input
            id="register-company"
            value={form.companyName ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
            style={styles.input}
            placeholder="MetroFix Group"
          />
        </div>
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

      <button type="submit" style={styles.submitButton}>
        Create account
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
    background: 'var(--surface)',
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

export default Register;