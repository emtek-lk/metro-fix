import { useState, type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';
import { TIER_LABELS } from '../../lib/catalog';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export const addSubscriptionSchema = z.object({
  tierName: z.nativeEnum(SubscriptionTier),
  targetFacility: z.nativeEnum(FacilityType),
  monthlyFeeLkr: z.number({ error: 'Enter the monthly fee in LKR' }).nonnegative(),
  annualFeeLkr: z.number({ error: 'Enter a number' }).nonnegative().nullable(),
  isCustomPriced: z.boolean(),
  includedVisitsPerMonth: z.number({ error: 'Enter a number' }).int().nonnegative().nullable(),
  includedLabourHoursPerMonth: z.number({ error: 'Enter a number' }).nonnegative().nullable(),
  labourDiscountPct: z.number({ error: 'Enter a percentage' }).min(0).max(100),
  inspectionCadence: z.enum(['NONE', 'ANNUAL', 'QUARTERLY', 'MONTHLY']),
  callOutWaived: z.boolean(),
  includedServices: z.string().trim().min(5, 'Included services description is required'),
});

export type AddSubscriptionInput = z.infer<typeof addSubscriptionSchema>;

export interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionAdded: (newPlan: any) => void;
}

export function AddSubscriptionModal({ isOpen, onClose, onSubscriptionAdded }: AddSubscriptionModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useModalAccessibility(isOpen, onClose);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddSubscriptionInput>({
    resolver: zodResolver(addSubscriptionSchema),
    defaultValues: {
      tierName: SubscriptionTier.ESSENTIAL,
      targetFacility: FacilityType.RESIDENTIAL,
      monthlyFeeLkr: 3500,
      annualFeeLkr: 35000,
      isCustomPriced: false,
      includedVisitsPerMonth: 1,
      includedLabourHoursPerMonth: 1,
      labourDiscountPct: 10,
      inspectionCadence: 'ANNUAL',
      callOutWaived: true,
      includedServices: 'Priority technician allocation; one visit per month',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: AddSubscriptionInput) => {
    setIsLoading(true);
    setSubmitError(null);

    const token = localStorage.getItem('metrofix_token');

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create subscription plan tier.');
      }

      const createdPlan = await response.json();
      reset();
      onSubscriptionAdded(createdPlan);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred while creating subscription plan.');
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
        aria-labelledby="add-sub-title"
        tabIndex={-1}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 id="add-sub-title" style={styles.title}>Define New Subscription Plan Tier</h2>
            <p style={styles.subtitle}>Set facility scope, monthly fee, and service coverage</p>
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
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="tier-name">
                Subscription Tier *
              </label>
              <select id="tier-name" {...register('tierName')} style={styles.select}>
                {Object.values(SubscriptionTier)
                  .filter((value) => value === value.toUpperCase())
                  .map((value) => (
                    <option key={value} value={value}>{TIER_LABELS[value]}</option>
                  ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="target-facility">
                Target Facility Type *
              </label>
              <select id="target-facility" {...register('targetFacility')} style={styles.select}>
                <option value={FacilityType.RESIDENTIAL}>Residential</option>
                <option value={FacilityType.COMMERCIAL}>Commercial</option>
                <option value={FacilityType.INDUSTRIAL}>Industrial</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="monthly-fee">Monthly Fee (LKR) *</label>
              <input id="monthly-fee" type="number" min={0} {...register('monthlyFeeLkr', { valueAsNumber: true })}
                style={{ ...styles.input, ...(errors.monthlyFeeLkr ? styles.inputError : undefined) }} />
              {errors.monthlyFeeLkr && <span style={styles.fieldError}>{errors.monthlyFeeLkr.message}</span>}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="annual-fee">Annual Fee (LKR)</label>
              <input id="annual-fee" type="number" min={0} {...register('annualFeeLkr', { setValueAs: (value) => (value === '' || value === null || value === undefined ? null : Number(value)) })}
                style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="visits">Visits / month (blank = per SLA)</label>
              <input id="visits" type="number" min={0} {...register('includedVisitsPerMonth', { setValueAs: (value) => (value === '' || value === null || value === undefined ? null : Number(value)) })}
                style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="labour-hours">Labour hours / month</label>
              <input id="labour-hours" type="number" min={0} step="0.5" {...register('includedLabourHoursPerMonth', { setValueAs: (value) => (value === '' || value === null || value === undefined ? null : Number(value)) })}
                style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="labour-discount">Extra labour discount (%)</label>
              <input id="labour-discount" type="number" min={0} max={100} {...register('labourDiscountPct', { valueAsNumber: true })}
                style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="inspection-cadence">Facility inspection</label>
              <select id="inspection-cadence" {...register('inspectionCadence')} style={styles.select}>
                <option value="NONE">None</option>
                <option value="ANNUAL">Annual</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          <div style={{ ...styles.row, alignItems: 'center' }}>
            <label style={{ ...styles.label, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" {...register('callOutWaived')} /> No call-out charge
            </label>
            <label style={{ ...styles.label, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" {...register('isCustomPriced')} /> Custom priced (SLA)
            </label>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="included-services">
              Included Services & Features *
            </label>
            <textarea
              id="included-services"
              rows={3}
              {...register('includedServices')}
              placeholder="e.g. 24/7 Priority Emergency Dispatch, Monthly HVAC Checkups"
              style={{
                ...styles.textarea,
                ...(errors.includedServices ? styles.inputError : undefined),
              }}
            />
            {errors.includedServices && (
              <span style={styles.fieldError}>{errors.includedServices.message}</span>
            )}
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'Creating Plan...' : 'Create Plan Tier'}
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    outline: 'none',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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

export default AddSubscriptionModal;
