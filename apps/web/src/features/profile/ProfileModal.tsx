import { useState, useEffect, type CSSProperties } from 'react';
import type { User } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export interface ProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export function ProfileModal({
  isOpen,
  user,
  onClose,
  onProfileUpdated,
}: ProfileModalProps) {
  const modalRef = useModalAccessibility(isOpen, onClose);
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Full name cannot be empty');
      return;
    }
    if (!email.trim()) {
      setError('Email address cannot be empty');
      return;
    }
    if (password && password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (password && password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('metrofix_token');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          ...(password ? { password } : {}),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to update user profile.');
      }

      const updatedData = await response.json();
      const newProfile: User = {
        ...user,
        fullName: updatedData.fullName || fullName,
        email: updatedData.email || email,
        phoneNumber: updatedData.phoneNumber || phoneNumber,
      };

      try {
        localStorage.setItem('metrofix_user', JSON.stringify(newProfile));
      } catch {
        // Storage safety
      }

      setIsLoading(false);
      onProfileUpdated(newProfile);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Error updating profile.');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        tabIndex={-1}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 id="profile-modal-title" style={styles.title}>User Profile Management</h2>
            <p style={styles.subtitle}>Update account info and credentials for Metro-Fix</p>
          </div>
          <button type="button" aria-label="Close modal" style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.badgeRow}>
            <span style={styles.roleBadge}>{user.role} ROLE</span>
            <span style={styles.idText}>User ID: {user.id}</span>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="profile-fullname">
                Full Name *
              </label>
              <input
                id="profile-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="profile-email">
                Email Address *
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="profile-phone">
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+94 77 123 4567"
              style={styles.input}
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.sectionHeader}>Change Password (Optional)</div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="profile-pass">
                New Password
              </label>
              <input
                id="profile-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="profile-conf-pass">
                Confirm New Password
              </label>
              <input
                id="profile-conf-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#2b435f',
    color: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '540px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 4px',
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.84rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px',
  },
  errorBanner: {
    backgroundColor: '#8b0000',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '10px',
    fontSize: '0.82rem',
  },
  roleBadge: {
    backgroundColor: '#f38808',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  idText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    outline: 'none',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '4px 0',
  },
  sectionHeader: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#f38808',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  submitBtn: {
    background: '#f38808',
    border: 'none',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(243, 136, 8, 0.4)',
  },
};

export default ProfileModal;
