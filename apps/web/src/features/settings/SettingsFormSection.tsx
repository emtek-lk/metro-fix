import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  SETTINGS_TIMEZONES,
  mergeAppSettings,
  validateAppSettings,
  type AppSettings,
} from '@metro-fix/core-types';
import { SkeletonCards } from '@metro-fix/ui';
import { ApiError, apiJson } from './http';
import { Field, SectionCard, StatusLine, buttons, inputStyle } from './ui';

type SectionKey = keyof AppSettings;

interface FieldDef {
  key: string;
  label: string;
  kind: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'toggle';
  hint?: string;
  prefix?: string;
  suffix?: string;
  step?: number;
  options?: readonly { value: string; label: string }[];
}

export interface SectionConfig {
  section: SectionKey;
  title: string;
  intro: string;
  fields: FieldDef[];
}

const TIMEZONE_OPTIONS = SETTINGS_TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('_', ' ') }));

/** What each admin section lets you change. The rules and ranges come from core-types, shared with the API. */
export const SECTION_CONFIGS: Record<string, SectionConfig> = {
  company: {
    section: 'company',
    title: 'Company',
    intro: 'Your business details. The name and support contact appear on the sign-in screen and in the apps; the address and tax registration head invoice exports.',
    fields: [
      { key: 'name', label: 'Company name', kind: 'text' },
      { key: 'supportEmail', label: 'Support email', kind: 'email', hint: 'Customers are sent here from “Contact us” and “Trouble with your account”.' },
      { key: 'supportPhone', label: 'Support phone', kind: 'text', hint: 'Optional.' },
      { key: 'address', label: 'Address', kind: 'textarea', hint: 'Printed on invoice exports.' },
      { key: 'timezone', label: 'Time zone', kind: 'select', options: TIMEZONE_OPTIONS },
      { key: 'taxRegistrationNo', label: 'Tax registration number', kind: 'text', hint: 'e.g. your VAT number. Printed on invoice exports.' },
    ],
  },
  dispatch: {
    section: 'dispatch',
    title: 'Dispatch',
    intro: 'How jobs are offered and how workers are ranked in the dispatch picker.',
    fields: [
      { key: 'offerTimeoutHours', label: 'Offer window', kind: 'number', step: 0.25, suffix: 'hours', hint: 'How long a technician has to answer an offer before it returns to the queue.' },
      { key: 'maxActiveJobs', label: 'Max active jobs per worker', kind: 'number', step: 1, hint: 'Beyond this, a worker shows as “At capacity” in the picker.' },
      { key: 'ratingWeight', label: 'Rating weight', kind: 'number', step: 1, hint: 'Score = rating × rating weight − distance (km) × proximity weight. Raise this to favour better-rated workers.' },
      { key: 'proximityWeight', label: 'Proximity weight', kind: 'number', step: 0.5, hint: 'Raise this to favour workers who are closer to the site.' },
      { key: 'defaultRadiusKm', label: 'Default search radius', kind: 'number', step: 5, suffix: 'km', hint: '0 means no limit.' },
    ],
  },
  billing: {
    section: 'billing',
    title: 'Billing & tax',
    intro: 'Defaults for quotes and invoices. Workers can still change the tax on an individual job card.',
    fields: [
      { key: 'invoicePrefix', label: 'Invoice number prefix', kind: 'text', hint: 'Invoices read like INV-K3F9Q2.' },
      { key: 'defaultTaxRatePct', label: 'Default tax rate', kind: 'number', step: 0.5, suffix: '%', hint: 'Added to a job card when the worker does not set one (e.g. 18 for VAT).' },
      { key: 'defaultLabourRateLkr', label: 'Default labour rate', kind: 'number', step: 100, prefix: 'LKR', suffix: 'per hour', hint: 'Pre-filled on new labour lines in the mobile quote form.' },
      { key: 'paymentTermsDays', label: 'Payment terms', kind: 'number', step: 1, suffix: 'days', hint: 'Sets the due date on invoices.' },
    ],
  },
  requests: {
    section: 'requests',
    title: 'Requests & plans',
    intro: 'Rules for what customers can do on their own.',
    fields: [
      { key: 'requirePlanToRequest', label: 'Require a subscription to raise requests', kind: 'toggle', hint: 'Turn off to let customers without a plan raise requests too (dispatch can always raise one for them).' },
      { key: 'allowCustomerCancellation', label: 'Let customers cancel their own requests', kind: 'toggle', hint: 'Before work starts. When off, customers contact support to cancel.' },
    ],
  },
  security: {
    section: 'security',
    title: 'Security',
    intro: 'Password rules and protection against password guessing. These apply to everyone, from the next sign-in.',
    fields: [
      { key: 'passwordMinLength', label: 'Minimum password length', kind: 'number', step: 1, suffix: 'characters', hint: 'Passwords must also contain letters and numbers.' },
      { key: 'maxFailedLogins', label: 'Failed sign-ins before lockout', kind: 'number', step: 1, hint: '0 turns lockout off.' },
      { key: 'lockoutMinutes', label: 'Lockout time', kind: 'number', step: 5, suffix: 'minutes', hint: 'An admin can unlock an account sooner from Team & access.' },
    ],
  },
};

const asText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

/** One admin settings section: edit, validate with the shared rules, save, and see what the server says. */
export function SettingsFormSection({ config }: { config: SectionConfig }) {
  const { section } = config;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const toDraft = useCallback(
    (s: AppSettings) =>
      Object.fromEntries(
        config.fields.map((f) => {
          const value = (s[section] as Record<string, unknown>)[f.key];
          return [f.key, f.kind === 'toggle' ? Boolean(value) : asText(value)];
        }),
      ),
    [config.fields, section],
  );

  const load = useCallback(() => {
    setLoadError(null);
    apiJson<AppSettings>('/settings')
      .then((s) => {
        setSettings(s);
        setDraft(toDraft(s));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Could not load settings.'));
  }, [toDraft]);

  useEffect(load, [load]);

  // The values as the API would see them, and the problems the shared rules find in them.
  const { patch, errors } = useMemo(() => {
    if (!settings) return { patch: {}, errors: {} as Record<string, string> };
    const values: Record<string, unknown> = {};
    const found: Record<string, string> = {};
    for (const field of config.fields) {
      const raw = draft[field.key];
      if (field.kind === 'number') {
        const n = Number(String(raw).trim());
        if (String(raw).trim() === '' || !Number.isFinite(n)) found[`${section}.${field.key}`] = `${field.label}: enter a number.`;
        else values[field.key] = n;
      } else if (field.kind === 'toggle') {
        values[field.key] = Boolean(raw);
      } else {
        values[field.key] = String(raw ?? '').trim();
      }
    }
    const merged = mergeAppSettings(settings, { [section]: values });
    const shared = validateAppSettings(merged);
    for (const [path, message] of Object.entries(shared)) {
      if (path.startsWith(`${section}.`) && !found[path]) found[path] = message;
    }
    return { patch: values, errors: found };
  }, [draft, settings, config.fields, section]);

  const dirty = useMemo(() => {
    if (!settings) return false;
    return config.fields.some((f) => draft[f.key] !== toDraft(settings)[f.key]);
  }, [draft, settings, config.fields, toDraft]);

  const errorFor = (key: string) => errors[`${section}.${key}`] ?? serverErrors[`${section}.${key}`];
  const hasErrors = Object.keys(errors).length > 0;

  const save = async () => {
    setSaving(true);
    setResult(null);
    setServerErrors({});
    try {
      const next = await apiJson<AppSettings>('/settings', { method: 'PATCH', body: { [section]: patch } });
      setSettings(next);
      setDraft(toDraft(next));
      setResult({ kind: 'ok', text: 'Saved. The change is in effect now and recorded in the audit log.' });
    } catch (e) {
      if (e instanceof ApiError) setServerErrors(e.fields);
      setResult({ kind: 'error', text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <SectionCard title={config.title} intro={config.intro}>
        <StatusLine kind="error">{loadError}</StatusLine>
        <button type="button" style={{ ...buttons.secondary, marginTop: 12 }} onClick={load}>Try again</button>
      </SectionCard>
    );
  }
  if (!settings) {
    return (
      <SectionCard title={config.title} intro={config.intro}>
        <SkeletonCards count={3} height={52} />
      </SectionCard>
    );
  }

  return (
    <SectionCard title={config.title} intro={config.intro}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!hasErrors && dirty) void save();
        }}
        noValidate
      >
        <div style={styles.grid}>
          {config.fields.map((field) => {
            const id = `${section}-${field.key}`;
            const value = draft[field.key];
            const set = (v: string | boolean) => {
              setDraft((d) => ({ ...d, [field.key]: v }));
              setResult(null);
              setServerErrors({});
            };
            if (field.kind === 'toggle') {
              return (
                <div key={field.key} style={{ ...styles.toggleRow, gridColumn: '1 / -1' }}>
                  <label htmlFor={id} style={styles.toggleLabel}>
                    <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
                    <span>
                      <strong>{field.label}</strong>
                      {field.hint && <span style={styles.toggleHint}>{field.hint}</span>}
                    </span>
                  </label>
                </div>
              );
            }
            return (
              <Field key={field.key} label={field.label} htmlFor={id} hint={field.hint} error={errorFor(field.key)}>
                <div style={styles.inputRow}>
                  {field.prefix && <span style={styles.affix}>{field.prefix}</span>}
                  {field.kind === 'textarea' ? (
                    <textarea id={id} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
                  ) : field.kind === 'select' ? (
                    <select id={id} style={inputStyle} value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      style={inputStyle}
                      type={field.kind === 'email' ? 'email' : 'text'}
                      inputMode={field.kind === 'number' ? 'decimal' : undefined}
                      value={String(value ?? '')}
                      onChange={(e) => set(e.target.value)}
                      aria-invalid={Boolean(errorFor(field.key))}
                    />
                  )}
                  {field.suffix && <span style={styles.affix}>{field.suffix}</span>}
                </div>
              </Field>
            );
          })}
        </div>

        {result && <div style={{ marginTop: 14 }}><StatusLine kind={result.kind}>{result.text}</StatusLine></div>}

        <div style={styles.actions}>
          <button type="button" style={buttons.secondary} disabled={!dirty || saving} onClick={() => { setDraft(toDraft(settings)); setResult(null); setServerErrors({}); }}>
            Discard changes
          </button>
          <button type="submit" style={{ ...buttons.primary, ...(!dirty || hasErrors || saving ? { opacity: 0.5, cursor: 'not-allowed' } : undefined) }} disabled={!dirty || hasErrors || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

const styles: Record<string, CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px 22px' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 8 },
  affix: { fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  toggleRow: { padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface-strong)' },
  toggleLabel: { display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.92rem' },
  toggleHint: { display: 'block', marginTop: 3, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
};
