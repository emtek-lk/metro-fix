import React from 'react';
import { Animated, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceRequest } from '@metro-fix/core-types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { SkeletonCard } from './ui/SkeletonCard';
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
import { workerNameOf } from '../lib/jobs';
import { relativeTime } from '../lib/time';
import { shortRef } from '../lib/ticket';

export interface MyRequestsScreenProps {
  /** The customer's requests, newest first (GET /jobs/mine). */
  requests: ServiceRequest[];
  isLoading?: boolean;
  /** Message to show when the list could not be loaded. */
  errorMessage?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpen: (request: ServiceRequest) => void;
  onBook: () => void;
}

/** One request card. The list is kept current by the realtime sync, so no fetching happens here. */
const RequestCard: React.FC<{ request: ServiceRequest; onOpen: (request: ServiceRequest) => void }> = ({
  request,
  onOpen,
}) => {
  const technician = workerNameOf(request);
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
          {technician ? (
            <Text style={styles.technician} numberOfLines={1}>
              {technician}
            </Text>
          ) : null}
          <View style={styles.track}>
            <Text style={styles.trackText}>TRACK</Text>
            <Icon name="chevron-right" size={15} color={colors.brand} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

export const MyRequestsScreen: React.FC<MyRequestsScreenProps> = ({
  requests,
  isLoading = false,
  errorMessage = null,
  refreshing = false,
  onRefresh,
  onOpen,
  onBook,
}) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();

  const largeTitle = (
    <ScreenHeader
      eyebrow="Your service history"
      title="My Requests"
      subtitle={
        requests.length > 0 ? `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}` : undefined
      }
      style={styles.largeTitle}
    />
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={isLoading || errorMessage ? [] : requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} onOpen={onOpen} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={largeTitle}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarClearance(insets) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          ) : undefined
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : errorMessage ? (
            <ErrorState
              title="Couldn’t load your requests"
              message={errorMessage}
              icon="wifi-off"
              action={onRefresh ? <Button title="Try again" onPress={onRefresh} size="medium" /> : undefined}
            />
          ) : (
            <EmptyState
              icon="clipboard"
              title="No requests yet"
              description="When you book a service it appears here, and you can follow it from dispatch to completion."
              action={<Button title="Book a service" onPress={onBook} variant="primary" size="medium" />}
            />
          )
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
    technician: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      textAlign: 'right',
      marginRight: spacing.md,
    },
    skeletons: {
      gap: spacing.lg,
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
