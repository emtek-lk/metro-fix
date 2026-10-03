import React, { useState } from 'react';
import { Animated, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BillingCycle } from '@metro-fix/core-types';
import { Text } from './ui/AppText';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { ScreenHeader } from './ui/ScreenHeader';
import { SegmentedControl } from './ui/SegmentedControl';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { useMySubscription, usePlans } from '../hooks/useJobs';
import { getErrorMessage } from '../lib/errors';
import { useAppSettings } from '../hooks/useAppSettings';
import { formatLkr, planIntent, priceFor, tierLabel, type PlanIntent } from '../lib/plans';
import type { SubscriptionPlan } from '../services/api';

interface SubscriptionScreenProps {
  /** Right after sign-up: shows "Skip for now" and a welcome instead of a back button. */
  onboarding?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  onChoose: (plan: SubscriptionPlan, cycle: BillingCycle, intent: PlanIntent) => void;
}

const CYCLES: { id: BillingCycle; label: string }[] = [
  { id: 'MONTHLY', label: 'Monthly' },
  { id: 'ANNUAL', label: 'Annual' },
];

const INSPECTION_LABEL: Record<string, string> = {
  NONE: 'None',
  ANNUAL: 'Yearly',
  SEMI_ANNUAL: 'Twice a year',
  QUARTERLY: 'Quarterly',
  MONTHLY: 'Monthly',
};

/** Side-by-side plan benefits, scrollable sideways on a phone. */
const ComparePlans: React.FC<{ plans: SubscriptionPlan[] }> = ({ plans }) => {
  const rows: { label: string; value: (plan: SubscriptionPlan) => string }[] = [
    { label: 'Per month', value: (p) => (p.monthlyFeeLkr == null ? '—' : `${p.isCustomPriced ? 'from ' : ''}${formatLkr(p.monthlyFeeLkr)}`) },
    { label: 'Per year', value: (p) => (p.annualFeeLkr == null ? '—' : formatLkr(p.annualFeeLkr)) },
    { label: 'Visits / month', value: (p) => (p.isCustomPriced ? 'Per SLA' : String(p.includedVisitsPerMonth ?? 0)) },
    { label: 'Labour hrs / month', value: (p) => (p.isCustomPriced ? 'Per SLA' : String(p.includedLabourHoursPerMonth ?? 0)) },
    { label: 'Labour discount', value: (p) => (p.isCustomPriced ? 'Agreed' : `${p.labourDiscountPct ?? 0}%`) },
    { label: 'Inspections', value: (p) => INSPECTION_LABEL[p.inspectionCadence ?? 'NONE'] ?? '—' },
    { label: 'Call-out fee', value: (p) => (p.callOutWaived ? 'Waived' : 'Charged') },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.compareWrap} contentContainerStyle={s.compareInner}>
      <View>
        <View style={s.compareRow}>
          <Text style={[s.compareLabel, s.compareHead]} />
          {plans.map((p) => (
            <Text key={p.id} style={[s.compareCell, s.compareHead]}>{tierLabel(p.tierName)}</Text>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.label} style={s.compareRow}>
            <Text style={s.compareLabel}>{row.label}</Text>
            {plans.map((p) => (
              <Text key={p.id} style={s.compareCell}>{row.value(p)}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

/** Plans with a monthly / annual switch, for choosing one at sign-up or changing it later. */
export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onboarding, onBack, onSkip, onChoose }) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();
  const plansQuery = usePlans();
  const mine = useMySubscription();
  const app = useAppSettings();
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [compare, setCompare] = useState(false);

  const plans = plansQuery.data ?? [];
  const currentTier = mine.data?.tier ?? null;
  const currentCycle = mine.data?.billingCycle ?? null;
  const currentFee = plans.find((plan) => plan.tierName === currentTier)?.monthlyFeeLkr ?? null;
  const refreshing = plansQuery.isRefetching || mine.isRefetching;
  const refresh = () => {
    plansQuery.refetch();
    mine.refetch();
  };

  const back = onBack ? (
    <IconButton
      onPress={onBack}
      accessibilityLabel="Back"
      icon={<Icon name="chevron-left" size={22} color={colors.text} />}
      backgroundColor={colors.surface}
      size={44}
    />
  ) : undefined;

  return (
    <View style={s.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
      >
        {back && !onboarding ? <View style={s.backRow}>{back}</View> : null}
        <ScreenHeader
          eyebrow={onboarding ? 'One more step' : 'Subscription'}
          title={onboarding ? 'Choose your plan' : 'Your plan'}
          subtitle={
            onboarding
              ? 'A plan lets you raise service requests. You can skip and subscribe later.'
              : currentTier
                ? `You're on ${tierLabel(currentTier)}${currentCycle === 'ANNUAL' ? ' (annual)' : ''}. Change it any time.`
                : 'You have no plan yet. Pick one to start raising requests.'
          }
        />

        <SegmentedControl options={CYCLES} value={cycle} onChange={setCycle} accessibilityLabel="Billing cycle" />
        {cycle === 'ANNUAL' ? <Text style={s.save}>Annual billing saves about two months.</Text> : <View style={s.gap} />}

        {plansQuery.isLoading ? (
          <LoadingState message="Loading plans…" />
        ) : plansQuery.isError ? (
          <ErrorState
            message={getErrorMessage(plansQuery.error)}
            action={<Button title="Try again" onPress={refresh} variant="secondary" size="medium" />}
          />
        ) : (
          plans.map((plan) => {
            const price = priceFor(plan, cycle);
            const isCurrent = plan.tierName === currentTier && (currentCycle ?? cycle) === cycle;
            const intent = planIntent({ tier: currentTier, cycle: currentCycle }, plan, currentFee);
            const features = (plan.includedServices ?? '').split(';').map((f) => f.trim()).filter(Boolean);
            return (
              <Card
                key={plan.id}
                variant="elevated"
                borderRadius={radius.xl}
                padding={spacing.xl}
                style={[s.plan, isCurrent && s.planCurrent]}
              >
                <View style={s.planHead}>
                  <Text style={s.planName}>{tierLabel(plan.tierName)}</Text>
                  {isCurrent ? (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>Your plan</Text>
                    </View>
                  ) : null}
                </View>
                {plan.targetCustomer ? <Text style={s.target}>{plan.targetCustomer}</Text> : null}
                <Text style={s.price}>
                  {plan.isCustomPriced
                    ? `from ${formatLkr(plan.monthlyFeeLkr ?? 0)}/month`
                    : price === null
                      ? `Not offered ${cycle === 'ANNUAL' ? 'annually' : 'monthly'}`
                      : `${formatLkr(price)}/${cycle === 'ANNUAL' ? 'year' : 'month'}`}
                </Text>
                <View style={s.features}>
                  {features.map((feature) => (
                    <View key={feature} style={s.featureRow}>
                      <Icon name="check" size={14} color={colors.brand} />
                      <Text style={s.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                {plan.isCustomPriced ? (
                  <Button
                    title="Contact us for a quote"
                    variant="outline"
                    size="medium"
                    onPress={() => Linking.openURL(`mailto:${app.supportEmail}?subject=Business%20plan%20quote`)}
                  />
                ) : (
                  <Button
                    title={isCurrent ? 'Current plan' : intent}
                    variant={isCurrent ? 'secondary' : 'primary'}
                    size="medium"
                    disabled={isCurrent || price === null}
                    onPress={() => onChoose(plan, cycle, intent)}
                  />
                )}
              </Card>
            );
          })
        )}

        {plans.length > 1 ? (
          <>
            <Pressable
              onPress={() => setCompare((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: compare }}
              accessibilityLabel="Compare plans"
              style={s.compareToggle}
              hitSlop={8}
            >
              <Icon name="columns" size={16} color={colors.brand} />
              <Text style={s.compareToggleText}>{compare ? 'Hide comparison' : 'Compare plans'}</Text>
            </Pressable>
            {compare ? <ComparePlans plans={plans} /> : null}
          </>
        ) : null}

        {onboarding ? (
          <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip for now" style={s.skip} hitSlop={10}>
            <Text style={s.skipText}>Skip for now</Text>
          </Pressable>
        ) : null}
      </Animated.ScrollView>
      <GlassHeader
        title={onboarding ? 'Choose your plan' : 'Subscription'}
        scrollY={scrollY}
        left={onboarding ? undefined : back}
      />
    </View>
  );
};

const s = themedStyles(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  backRow: { marginBottom: spacing.sm },
  save: { ...typography.caption, color: colors.brand, marginTop: spacing.sm, marginBottom: spacing.lg, textAlign: 'center' },
  gap: { height: spacing.lg },
  plan: { marginBottom: spacing.lg },
  planCurrent: { borderWidth: 1.5, borderColor: colors.brand },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { ...typography.h2, color: colors.text },
  badge: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 2 },
  badgeText: { ...typography.caption, fontWeight: '800', color: '#ffffff' },
  target: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  price: { ...typography.h2, color: colors.brand, marginTop: spacing.sm },
  features: { marginVertical: spacing.md, gap: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  compareToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  compareToggleText: { ...typography.label, fontWeight: '700', color: colors.brand },
  compareWrap: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.lg },
  compareInner: { padding: spacing.md },
  compareRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  compareLabel: { width: 128, ...typography.caption, color: colors.textSecondary },
  compareCell: { width: 104, ...typography.caption, color: colors.text, textAlign: 'center' },
  compareHead: { fontWeight: '800', color: colors.text },
  skip: { alignSelf: 'center', paddingVertical: spacing.lg },
  skipText: { ...typography.label, fontWeight: '700', color: colors.textSecondary },
}));
