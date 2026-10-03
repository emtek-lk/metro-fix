import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { JOB_STAGES, JobStatus } from '@metro-fix/core-types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/layout';
import { getStatusPresentation } from '../../theme/status';
import { themedStyles } from '../../theme/themedStyles';

export interface StageStepperProps {
  status: JobStatus | string;
  /** Bars only, for list cards. The full version also names the current stage. */
  compact?: boolean;
}

/**
 * One segment per stage of the job lifecycle (from `@metro-fix/core-types`), coloured by the
 * current stage. A cancelled job shows every segment empty, since it left the normal path.
 */
export const StageStepper: React.FC<StageStepperProps> = ({ status, compact = false }) => {
  const index = JOB_STAGES.indexOf(status as JobStatus);
  const cancelled = status === JobStatus.CANCELLED;
  const { color, label } = getStatusPresentation(status);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        cancelled ? 'Cancelled' : `Stage ${index + 1} of ${JOB_STAGES.length}: ${label}`
      }
      accessibilityValue={cancelled ? undefined : { min: 1, max: JOB_STAGES.length, now: index + 1 }}
    >
      <View style={styles.bars}>
        {JOB_STAGES.map((stage, i) => (
          <View
            key={stage}
            style={[
              compact ? styles.barCompact : styles.bar,
              { backgroundColor: !cancelled && i <= index ? color : colors.border },
              !cancelled && i === index && styles.barCurrent,
            ]}
          />
        ))}
      </View>
      {compact ? null : (
        <Text style={styles.caption}>
          {cancelled
            ? 'Request cancelled'
            : index >= 0
              ? `Stage ${index + 1} of ${JOB_STAGES.length}`
              : 'Stage unknown'}
          <Text style={{ color }}>{`  ·  ${label}`}</Text>
        </Text>
      )}
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    bars: {
      flexDirection: 'row',
      gap: 3,
    },
    bar: {
      flex: 1,
      height: 6,
      borderRadius: radius.pill,
    },
    barCompact: {
      flex: 1,
      height: 4,
      borderRadius: radius.pill,
    },
    barCurrent: {
      transform: [{ scaleY: 1.25 }],
    },
    caption: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
  }),
);
