import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cardDigits,
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  isValidCardCvc,
  isValidCardExpiry,
  isValidCardNumber,
  type BillingCycle,
  type SubscriptionTier,
} from '@metro-fix/core-types';
import { Text } from './ui/AppText';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { Input } from './ui/Input';
import { ScreenHeader } from './ui/ScreenHeader';
import { useToast } from './ui/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { useCheckout } from '../hooks/useJobs';
import { getErrorMessage } from '../lib/errors';
import { haptics } from '../lib/haptics';
import { formatLkr, tierLabel } from '../lib/plans';

interface CheckoutScreenProps {
  tier: SubscriptionTier;
  cycle: BillingCycle;
  amountLkr: number;
  intent: string;
  onBack: () => void;
  onPaid: () => void;
}

const BRAND_LABEL = { VISA: 'VISA', MASTERCARD: 'Mastercard', AMEX: 'AMEX', UNKNOWN: '' } as const;

/**
 * A demo card checkout: it validates like a real one, but the API's demo gateway moves no money.
 * 4242 4242 4242 4242 is approved; 4000 0000 0000 0002 is declined.
 */
export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ tier, cycle, amountLkr, intent, onBack, onPaid }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const checkout = useCheckout();
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [touched, setTouched] = useState(false);
  const [declined, setDeclined] = useState<string | null>(null);

  const brand = detectCardBrand(number);
  const problems = useMemo(
    () => ({
      number: isValidCardNumber(number) ? undefined : 'Enter a valid card number.',
      name: name.trim() ? undefined : 'Enter the name on the card.',
      expiry: isValidCardExpiry(expiry) ? undefined : 'Use a future date as MM/YY.',
      cvc: isValidCardCvc(cvc, brand) ? undefined : brand === 'AMEX' ? 'Enter the 4-digit code.' : 'Enter the 3-digit code.',
    }),
    [number, name, expiry, cvc, brand],
  );
  const show = (key: keyof typeof problems) => (touched ? problems[key] : undefined);

  const pay = async () => {
    setTouched(true);
    setDeclined(null);
    if (Object.values(problems).some(Boolean)) {
      haptics.warning();
      return;
    }
    try {
      await checkout.mutateAsync({
        tier,
        billingCycle: cycle,
        card: { number: cardDigits(number), name: name.trim(), expiry, cvc },
      });
      haptics.success();
      toast.success(`You're on ${tierLabel(tier)}.`, 'Payment successful');
      onPaid();
    } catch (error) {
      const message = getErrorMessage(error, 'The payment could not be completed.');
      setDeclined(message);
      haptics.error();
      toast.error(message, 'Payment failed');
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.backRow}>
          <IconButton
            onPress={onBack}
            accessibilityLabel="Back to plans"
            icon={<Icon name="chevron-left" size={22} color={colors.text} />}
            backgroundColor={colors.surface}
            size={44}
          />
        </View>
        <ScreenHeader
          eyebrow="Secure checkout · demo"
          title={`${intent} to ${tierLabel(tier)}`}
          subtitle={`${formatLkr(amountLkr)} ${cycle === 'ANNUAL' ? 'per year' : 'per month'}`}
        />

        <View style={s.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={s.cardBrand}>{BRAND_LABEL[brand]}</Text>
          <Text style={s.cardNumber}>{formatCardNumber(number) || '•••• •••• •••• ••••'}</Text>
          <View style={s.cardRow}>
            <Text style={s.cardMeta} numberOfLines={1}>{name.trim().toUpperCase() || 'NAME ON CARD'}</Text>
            <Text style={s.cardMeta}>{expiry || 'MM/YY'}</Text>
          </View>
        </View>

        <Input
          label="Card number"
          icon="credit-card"
          placeholder="4242 4242 4242 4242"
          keyboardType="number-pad"
          textContentType="creditCardNumber"
          autoComplete="cc-number"
          value={formatCardNumber(number)}
          onChangeText={setNumber}
          error={show('number')}
        />
        <Input
          label="Name on card"
          icon="user"
          textContentType="name"
          autoComplete="cc-name"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          error={show('name')}
        />
        <View style={s.row}>
          <Input
            containerStyle={s.half}
            label="Expiry"
            placeholder="MM/YY"
            keyboardType="number-pad"
            autoComplete="cc-exp"
            value={expiry}
            onChangeText={(value) => setExpiry(formatCardExpiry(value))}
            error={show('expiry')}
          />
          <Input
            containerStyle={s.half}
            label="Security code"
            placeholder={brand === 'AMEX' ? '1234' : '123'}
            keyboardType="number-pad"
            autoComplete="cc-csc"
            secureTextEntry
            maxLength={4}
            value={cvc}
            onChangeText={(value) => setCvc(value.replace(/\D/g, ''))}
            error={show('cvc')}
          />
        </View>

        <Text style={s.hint}>
          Demo mode: no money moves. Use 4242 4242 4242 4242 with any future date and code. 4000 0000 0000 0002 is declined.
        </Text>
        {declined ? <Text style={s.declined} accessibilityLiveRegion="polite">{declined}</Text> : null}

        <Button
          title={`Pay ${formatLkr(amountLkr)}`}
          onPress={pay}
          isLoading={checkout.isPending}
          variant="primary"
          size="large"
          style={s.pay}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = themedStyles(() => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  backRow: { marginBottom: spacing.sm },
  card: { backgroundColor: '#2b435f', borderRadius: radius.xl, padding: spacing.xl, marginVertical: spacing.lg },
  cardBrand: { ...typography.label, fontWeight: '800', color: '#f38808', letterSpacing: 1.5 },
  cardNumber: { ...typography.h2, color: '#ffffff', letterSpacing: 2, marginVertical: spacing.lg },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cardMeta: { ...typography.caption, color: '#ffffff', opacity: 0.9, flexShrink: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  declined: { ...typography.body, color: colors.dangerText, marginTop: spacing.md },
  pay: { marginTop: spacing.xl },
}));
