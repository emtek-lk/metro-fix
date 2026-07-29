import { useState, type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServicePillar, SubscriptionTier } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export const addServiceSchema = z.object({
  serviceName: z.string().trim().min(3, 'Service name must be at least 3 characters'),
  pillarCategory: z.nativeEnum(ServicePillar),
  basePrice: z.string().trim().min(1, 'Base price is required'),
  requiredSubscriptionTier: z.nativeEnum(SubscriptionTier),
});

export type AddServiceInput = z.infer<typeof addServiceSchema>;

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceAdded: (newService: any) => void;
}

export function AddServiceModal({ isOpen, onClose, onServiceAdded }: AddServiceModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useModalAccessibility(isOpen, onClose);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddServiceInput>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      serviceName: '',
      pillarCategory: ServicePillar.HARD,
      basePrice: '$250.00',
      requiredSubscriptionTier: SubscriptionTier.BASIC,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: AddServiceInput) => {
    setIsLoading(true);
    setSubmitError(null);

    const token = localStorage.getItem('metrofix_token');

    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create new catalog service.');
      }

      const createdService = await response.json();
      reset();
      onServiceAdded(createdService);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred while adding service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-service-title"
        tabIndex={-1}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 id="add-service-title" style={styles.title}>Add New Service to Catalog</h2>
            <p style={styles.subtitle}>Define price, category, and minimum tier access</p>
          </div>
          <button type="button" aria-label="Close modal" style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {submitError && (
          <div style={styles.errorBanner}>
            <span>⚠️ {submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="service-name">
              Service Name *
            </label>
            <input
              id="service-name"
              type="text"
              {...register('serviceName')}
              placeholder="e.g. HVAC Chiller Overhaul"
              style={{
                ...styles.input,
                ...(errors.serviceName ? styles.inputError : undefined),
              }}
            />
            {errors.serviceName && <span style={styles.fieldError}>{errors.serviceName.message}</span>}
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="pillar-category">
                Pillar Category *
              </label>
              <select id="pillar-category" {...register('pillarCategory')} style={styles.select}>
                <option value={ServicePillar.HARD}>Hard Services</option>
                <option value={ServicePillar.SOFT}>Soft Services</option>
                <option value={ServicePillar.STRATEGIC}>Strategic Services</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="base-price">
                Base Price *
              </label>
              <input
                id="base-price"
                type="text"
                {...register('basePrice')}
                placeholder="$250.00"
                style={{
                  ...styles.input,
                  ...(errors.basePrice ? styles.inputError : undefined),
                }}
              />
              {errors.basePrice && <span style={styles.fieldError}>{errors.basePrice.message}</span>}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="required-tier">
              Required Subscription Tier *
            </label>
            <select id="required-tier" {...register('requiredSubscriptionTier')} style={styles.select}>
              <option value={SubscriptionTier.BASIC}>Basic Tier</option>
              <option value={SubscriptionTier.PLUS}>Plus Tier</option>
              <option value={SubscriptionTier.PREMIUM}>Premium Tier</option>
            </select>
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'Adding Service...' : 'Add Service'}
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
    maxWidth: '520px',
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
  select: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: '#1e3247',
    color: '#ffffff',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    outline: 'none',
  },
  inputError: {
    borderColor: '#fc8181',
    boxShadow: '0 0 0 1px #fc8181',
  },
  fieldError: {
    color: '#fc8181',
    fontSize: '0.78rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '12px',
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

export default AddServiceModal;
