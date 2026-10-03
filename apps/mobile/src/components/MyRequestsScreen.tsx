import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceRequest } from '@metro-fix/core-types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { Icon } from './ui/Icon';
import { MetaChip } from './ui/MetaChip';
import { ScreenHeader } from './ui/ScreenHeader';
import { StageStepper } from './ui/StageStepper';
import { StatusPill } from './ui/StatusPill';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { PILLAR_ICON, getStatusColor } from '../theme/status';
import { themedStyles } from '../theme/themedStyles';
import { useJobDetail } from '../hooks/useJobs';
import { relativeTime } from '../lib/time';
import { shortRef } from '../lib/ticket';

export interface MyRequestsScreenProps {
  /**
   * The customer's requests. For now this is the list raised in the current session; it will be
   * replaced by the customer's own history once the backend exposes it.
   */
  requests: ServiceRequest[];
  onOpen: (request: ServiceRequest) => void;
  onBook: () => void;
}

/** One request card. It refreshes its own status so the list stays live. */
const RequestCard: React.FC<{ request: ServiceRequest; onOpen: (request: ServiceRequest) => void }> = ({
  request: initial,
  onOpen,
}) => {
  const { data } = useJobDetail(initial.id);
  const request = data ?? initial;

  return (
    <Pressable
      onPress={() => onOpen(request)}
      accessibilityRole="button"
      accessibilityLabel={`Open request ${request.title}`}
      style={({ pressed }) => [styles.press, pressed && styles.pressed]}
    >
      <Card
        variant="elevated"
        borderRadius={radius.xl}
        padding={spacing.xl}
        style={[styles.stripe, { borderLeftColor: getStatusColor(request.status) }]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.ref, styles.refShrink]} numberOfLines={1}>
            {`#${shortRef(request.id)}`}
            <Text style={styles.age}>{`  ·  ${relativeTime(request.createdAt)}`}</Text>
          </Text>
          <StatusPill status={request.status} size="small" />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {request.title}
        </Text>
        <View style={styles.stepper}>
          <StageStepper status={request.status} compact />
        </View>
        <View style={styles.footer}>
          <MetaChip icon={PILLAR_ICON[request.servicePillar] ?? 'tool'} label={request.servicePillar} tint={colors.brand} />
          <View style={styles.track}>
            <Text style={styles.trackText}>TRACK</Text>
            <Icon name="chevron-right" size={15} color={colors.brand} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

export const MyRequestsScreen: React.FC<MyRequestsScreenProps> = ({ requests, onOpen, onBook }) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();

  const largeTitle = (
    <ScreenHeader
      eyebrow="Your service history"
      title="My Requests"
      subtitle={requests.length > 0 ? `${requests.length} raised this session` : undefined}
      style={styles.largeTitle}
    />
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} onOpen={onOpen} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={largeTitle}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarClearance(insets) }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard"
            title="No requests yet"
            description="When you book a service it appears here, and you can follow it from dispatch to completion."
            action={<Button title="Book a service" onPress={onBook} variant="primary" size="medium" />}
          />
        }
      />
      <GlassHeader title="My Requests" scrollY={scrollY} />
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    listContent: {
      padding: layout.screenPadding,
      gap: spacing.lg,
    },
    largeTitle: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    press: {
      borderRadius: radius.xl,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.995 }],
    },
    stripe: {
      borderLeftWidth: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    refShrink: {
      flexShrink: 1,
    },
    ref: {
      ...typography.overline,
      color: colors.brand,
    },
    age: {
      ...typography.caption,
      fontWeight: '500',
      letterSpacing: 0,
      textTransform: 'none',
      color: colors.textMuted,
    },
    title: {
      ...typography.h3,
      color: colors.text,
    },
    stepper: {
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    trackText: {
      ...typography.caption,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: colors.brand,
    },
  }),
);
