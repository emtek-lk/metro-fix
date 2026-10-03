import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobStatus } from '@metro-fix/core-types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { GlassSurface } from './ui/GlassSurface';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { Input } from './ui/Input';
import { LoadingState } from './ui/LoadingState';
import { MetaChip } from './ui/MetaChip';
import { QuickAction } from './ui/QuickAction';
import { ScreenHeader } from './ui/ScreenHeader';
import { SegmentedControl } from './ui/SegmentedControl';
import { SkeletonCard } from './ui/SkeletonCard';
import { StageStepper } from './ui/StageStepper';
import { StatusPill } from './ui/StatusPill';
import { useToast } from './ui/Toast';
import { colors, type ThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';

const STATUSES: JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/**
 * Development-only gallery of every shared component and state in the active theme. It exists so
 * visual changes can be reviewed in one place, including loading / empty / error variants that are
 * hard to reach with live data. Opened from Profile in development builds; never shipped.
 */
export const UiGalleryScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { preference, setPreference } = useTheme();
  const { scrollY, onScroll } = useCollapsingHeader();
  const [segment, setSegment] = useState<'one' | 'two' | 'three'>('two');
  const [text, setText] = useState('');

  const swatches = Object.keys(colors) as (keyof ThemeColors)[];

  const closeButton = (
    <IconButton
      onPress={onClose}
      accessibilityLabel="Close gallery"
      icon={<Icon name="x" size={20} color={colors.text} />}
      backgroundColor={colors.surface}
      size={44}
    />
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance(insets) }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Developer tools" title="UI gallery" right={closeButton} />

        <SegmentedControl options={THEME_OPTIONS} value={preference} onChange={setPreference} accessibilityLabel="Theme" />

        <Section title="Type">
          {(['display', 'h1', 'h2', 'h3', 'bodyStrong', 'body', 'label', 'caption', 'overline'] as const).map(
            (token) => (
              <Text key={token} style={[typography[token], styles.typeSample]}>
                {token}  ·  Facility maintenance
              </Text>
            ),
          )}
        </Section>

        <Section title="Colours">
          <View style={styles.swatchGrid}>
            {swatches.map((token) => (
              <View key={token} style={styles.swatchItem}>
                <View style={[styles.swatch, { backgroundColor: colors[token] }]} />
                <Text style={styles.swatchLabel} numberOfLines={1}>
                  {token}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Buttons">
          <View style={styles.stack}>
            <Button title="Primary" onPress={() => undefined} variant="primary" size="large" />
            <Button title="Secondary" onPress={() => undefined} variant="secondary" size="large" />
            <Button title="Outline" onPress={() => undefined} variant="outline" size="large" />
            <Button title="Danger" onPress={() => undefined} variant="danger" size="large" />
            <Button title="Loading" onPress={() => undefined} isLoading size="large" />
            <Button title="Disabled" onPress={() => undefined} disabled size="large" />
            <View style={styles.row}>
              <Button title="Small" onPress={() => undefined} size="small" />
              <Button title="Medium" onPress={() => undefined} size="medium" />
            </View>
          </View>
        </Section>

        <Section title="Inputs">
          <View style={styles.stack}>
            <Input label="Default" placeholder="Type here" icon="edit-3" value={text} onChangeText={setText} />
            <Input label="With helper" placeholder="you@company.com" icon="mail" helperText="We never share this." />
            <Input label="With error" value="oops" error="That doesn’t look right." icon="alert-circle" />
            <Input label="Multiline" multiline numberOfLines={3} placeholder="Describe the issue…" />
          </View>
        </Section>

        <Section title="Status & stages">
          <View style={styles.stack}>
            <View style={styles.wrap}>
              {STATUSES.map((status) => (
                <StatusPill key={status} status={status} size="small" />
              ))}
            </View>
            {STATUSES.map((status) => (
              <StageStepper key={status} status={status} />
            ))}
          </View>
        </Section>

        <Section title="Chips, controls & actions">
          <View style={styles.stack}>
            <View style={styles.wrap}>
              <MetaChip icon="tool" label="HARD" tint={colors.brand} />
              <MetaChip icon="briefcase" label="COMMERCIAL" />
              <MetaChip icon="calendar" label="3 Oct 2026" />
            </View>
            <SegmentedControl
              options={[
                { id: 'one' as const, label: 'One' },
                { id: 'two' as const, label: 'Two' },
                { id: 'three' as const, label: 'Three' },
              ]}
              value={segment}
              onChange={setSegment}
            />
            <View style={styles.row}>
              <QuickAction icon="navigation" label="Navigate" onPress={() => undefined} />
              <QuickAction icon="phone" label="Call" dimmed onPress={() => undefined} />
              <QuickAction icon="message-circle" label="Message" onPress={() => undefined} />
            </View>
          </View>
        </Section>

        <Section title="Surfaces">
          <View style={styles.stack}>
            <Card variant="elevated">
              <Text style={styles.cardText}>Elevated card</Text>
            </Card>
            <Card variant="bordered">
              <Text style={styles.cardText}>Bordered card</Text>
            </Card>
            <GlassSurface borderRadius={radius.xl} style={styles.glassDemo}>
              <View style={styles.glassInner}>
                <Icon name="layers" size={18} color={colors.brand} />
                <Text style={styles.cardText}>Glass surface</Text>
              </View>
            </GlassSurface>
          </View>
        </Section>

        <Section title="Feedback">
          <View style={styles.row}>
            <Button title="Success" onPress={() => toast.success('Everything went through.', 'Saved')} size="small" variant="secondary" />
            <Button title="Error" onPress={() => toast.error('Something needs attention.', 'Couldn’t save')} size="small" variant="secondary" />
            <Button title="Info" onPress={() => toast.info('Heads up about something.', 'Note')} size="small" variant="secondary" />
          </View>
        </Section>

        <Section title="States">
          <View style={styles.stack}>
            <Card variant="bordered">
              <LoadingState message="Loading your workload…" size="small" />
            </Card>
            <SkeletonCard />
            <Card variant="bordered">
              <EmptyState icon="inbox" title="Nothing here yet" description="Empty states explain what will appear and what to do next." />
            </Card>
            <Card variant="bordered">
              <ErrorState
                title="Sync connection failed"
                message="Could not reach the server."
                icon="wifi-off"
                action={<Button title="Retry" onPress={() => undefined} size="small" />}
              />
            </Card>
          </View>
        </Section>
      </Animated.ScrollView>
      <GlassHeader title="UI gallery" scrollY={scrollY} right={closeButton} />
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      paddingHorizontal: layout.screenPadding,
    },
    section: {
      marginTop: spacing.xxl,
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.overline,
      color: colors.textSecondary,
    },
    stack: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    typeSample: {
      color: colors.text,
    },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    swatchItem: {
      width: 72,
      alignItems: 'center',
      gap: spacing.xs,
    },
    swatch: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    swatchLabel: {
      ...typography.caption,
      fontSize: 9,
      color: colors.textMuted,
    },
    cardText: {
      ...typography.bodyStrong,
      color: colors.text,
    },
    glassDemo: {
      width: '100%',
    },
    glassInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
    },
  }),
);
