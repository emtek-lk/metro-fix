import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { jobCardBillable, jobCardLineTotal, type JobCard, type JobCardLineKind } from '@metro-fix/core-types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';

const KIND_LABEL: Record<JobCardLineKind, string> = { LABOUR: 'Labour', MATERIAL: 'Materials', OTHER: 'Other' };

const money = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The technician's itemised quote (or the final bill), so the customer sees what the total is made of. */
export function QuoteBreakdown({ card }: { card: JobCard }) {
  const section = jobCardBillable(card);
  if (!section || section.lineItems.length === 0) return null;

  const currency = card.currency || 'LKR';
  const isFinal = Boolean(card.final);
  const quotedTotal = card.estimate?.total;
  const changed = isFinal && quotedTotal != null && Math.abs(quotedTotal - section.total) > 0.005;

  return (
    <View style={styles.card} accessibilityLabel={isFinal ? 'Final bill' : 'Quote from your technician'}>
      <Text style={styles.title}>{isFinal ? 'Final bill' : 'Quote from your technician'}</Text>

      {section.lineItems.map((line) => (
        <View key={line.id} style={styles.line}>
          <View style={styles.lineText}>
            <Text style={styles.desc}>{line.description}</Text>
            <Text style={styles.meta}>
              {KIND_LABEL[line.kind] ?? line.kind} · {line.quantity}
              {line.kind === 'LABOUR' ? ' h' : ''} × {money(line.unitPrice, currency)}
            </Text>
          </View>
          <Text style={styles.amount}>{money(jobCardLineTotal(line), currency)}</Text>
        </View>
      ))}

      <View style={styles.divider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>Subtotal</Text>
        <Text style={styles.sumValue}>{money(section.subtotal, currency)}</Text>
      </View>
      {section.tax > 0 ? (
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Tax ({card.taxRate}%)</Text>
          <Text style={styles.sumValue}>{money(section.tax, currency)}</Text>
        </View>
      ) : null}
      <View style={styles.sumRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{money(section.total, currency)}</Text>
      </View>

      {changed ? (
        <Text style={styles.note}>Originally quoted {money(quotedTotal as number, currency)}. The final bill reflects the work actually done.</Text>
      ) : null}
      {section.hours > 0 ? (
        <Text style={styles.note}>
          {isFinal ? 'Time spent' : 'Estimated time'}: about {section.hours} {section.hours === 1 ? 'hour' : 'hours'}
        </Text>
      ) : null}
      {section.notes ? <Text style={styles.note}>Technician’s note: {section.notes}</Text> : null}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      marginBottom: spacing.lg,
    },
    title: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.md },
    line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
    lineText: { flex: 1, minWidth: 0 },
    desc: { ...typography.body, color: colors.text },
    meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    amount: { ...typography.body, color: colors.text, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    sumLabel: { ...typography.caption, color: colors.textSecondary },
    sumValue: { ...typography.caption, color: colors.text },
    totalLabel: { ...typography.h3, color: colors.text },
    totalValue: { ...typography.h3, color: colors.brand },
    note: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  }),
);
