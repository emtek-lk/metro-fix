import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';

/** Shown in place of the booking form until the customer has a paid plan. */
export const SubscriptionGate: React.FC<{ onViewPlans: () => void }> = ({ onViewPlans }) => (
  <View style={s.container}>
    <ScreenHeader eyebrow="Request a service" title="Choose a plan first" />
    <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xxl} style={s.card}>
      <View style={s.iconWrap}>
        <Icon name="lock" size={26} color={colors.brand} />
      </View>
      <Text style={s.title}>A subscription is needed to raise requests</Text>
      <Text style={s.body}>
        Pick a plan to book technicians, get priority dispatch and enjoy member discounts. It takes under a minute, and
        you can change or upgrade it any time.
      </Text>
      <Button title="View plans" onPress={onViewPlans} variant="primary" size="large" style={s.cta} />
    </Card>
  </View>
);

const s = themedStyles(() => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  card: { alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.text, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  cta: { marginTop: spacing.xl, alignSelf: 'stretch' },
}));
