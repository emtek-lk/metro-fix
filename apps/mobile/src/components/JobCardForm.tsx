import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { JobCardLineKind } from '@metro-fix/core-types';
import { Text } from './ui/AppText';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { draftTotals, newLine, type JobCardDraft, type LineDraft } from '../lib/jobCard';

const KINDS: { kind: JobCardLineKind; label: string }[] = [
  { kind: 'LABOUR', label: 'Labour' },
  { kind: 'MATERIAL', label: 'Material' },
  { kind: 'OTHER', label: 'Other' },
];

const money = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface JobCardFormProps {
  draft: JobCardDraft;
  onChange: (draft: JobCardDraft) => void;
  taxRate?: number;
  currency?: string;
  /** The standard hourly rate pre-filled on new labour lines. */
  labourRate?: number;
}

/** Itemised job card: priced lines, time on site, notes and a live total. Used for the quote and the final. */
export const JobCardForm: React.FC<JobCardFormProps> = ({ draft, onChange, taxRate = 0, currency = 'LKR', labourRate = 0 }) => {
  const totals = draftTotals(draft, taxRate);
  const setLine = (id: string, patch: Partial<LineDraft>) =>
    onChange({ ...draft, lines: draft.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)) });

  return (
    <View>
      {draft.lines.map((line, index) => (
        <View key={line.id} style={s.line}>
          <View style={s.lineHead}>
            <View style={s.kinds}>
              {KINDS.map(({ kind, label }) => {
                const active = line.kind === kind;
                return (
                  <Pressable
                    key={kind}
                    onPress={() => setLine(line.id, { kind })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Line ${index + 1} type ${label}`}
                    style={[s.kind, active && s.kindActive]}
                  >
                    <Text style={[s.kindText, active && s.kindTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {draft.lines.length > 1 && (
              <Pressable
                onPress={() => onChange({ ...draft, lines: draft.lines.filter((l) => l.id !== line.id) })}
                accessibilityRole="button"
                accessibilityLabel={`Remove line ${index + 1}`}
                hitSlop={10}
              >
                <Icon name="x" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Input
            value={line.description}
            onChangeText={(description) => setLine(line.id, { description })}
            placeholder={line.kind === 'LABOUR' ? 'e.g. Technician time' : line.kind === 'MATERIAL' ? 'e.g. Pressure valve' : 'e.g. Call-out fee'}
            accessibilityLabel={`Line ${index + 1} description`}
          />
          <View style={s.numbers}>
            <Input
              containerStyle={s.num}
              label={line.kind === 'LABOUR' ? 'Hours' : 'Qty'}
              value={line.quantity}
              onChangeText={(quantity) => setLine(line.id, { quantity })}
              keyboardType="decimal-pad"
              placeholder="1"
            />
            <Input
              containerStyle={s.num}
              label={`Unit price (${currency})`}
              value={line.unitPrice}
              onChangeText={(unitPrice) => setLine(line.id, { unitPrice })}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>
      ))}

      <View style={s.addRow}>
        {KINDS.map(({ kind, label }) => (
          <Pressable
            key={kind}
            onPress={() => onChange({ ...draft, lines: [...draft.lines, newLine(kind, labourRate)] })}
            accessibilityRole="button"
            accessibilityLabel={`Add ${label} line`}
            style={s.add}
          >
            <Icon name="plus" size={14} color={colors.brand} />
            <Text style={s.addText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Time on site (hours)"
        value={draft.hours}
        onChangeText={(hours) => onChange({ ...draft, hours })}
        keyboardType="decimal-pad"
        placeholder="2.5"
      />
      <Input
        label="Notes"
        value={draft.notes}
        onChangeText={(notes) => onChange({ ...draft, notes })}
        placeholder="Findings, work done, parts replaced…"
        multiline
        numberOfLines={3}
      />

      <View style={s.totals} accessibilityLabel="Job card totals">
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Subtotal</Text>
          <Text style={s.totalValue}>{money(totals.subtotal, currency)}</Text>
        </View>
        {taxRate > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tax ({taxRate}%)</Text>
            <Text style={s.totalValue}>{money(totals.tax, currency)}</Text>
          </View>
        )}
        <View style={[s.totalRow, s.grand]}>
          <Text style={s.grandLabel}>Total</Text>
          <Text style={s.grandValue}>{money(totals.total, currency)}</Text>
        </View>
      </View>
    </View>
  );
};

const s = themedStyles(() => StyleSheet.create({
  line: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  lineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  kinds: { flexDirection: 'row', gap: spacing.xs },
  kind: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  kindActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  kindText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  kindTextActive: { color: '#ffffff' },
  numbers: { flexDirection: 'row', gap: spacing.md },
  num: { flex: 1 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  add: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.brand },
  addText: { ...typography.caption, fontWeight: '700', color: colors.brand },
  totals: { marginTop: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.body, color: colors.text },
  grand: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  grandLabel: { ...typography.label, fontWeight: '800', color: colors.text },
  grandValue: { ...typography.label, fontWeight: '800', color: colors.brand },
}));
