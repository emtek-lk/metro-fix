import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { JobStatus } from '@metro-fix/core-types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/layout';
import { getStatusPresentation } from '../../theme/status';
import { themedStyles } from '../../theme/themedStyles';

/** Display order of the 7 job stages (the lifecycle itself is defined in core-types). */
const STAGES: JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

export interface StageStepperProps {
  status: JobStatus | string;
  /** Bars only, for list cards. The full version also names the current stage. */
  compact?: boolean;
}

/** Seven segments showing how far a job has progressed, coloured by its current stage. */
export const StageStepper: React.FC<StageStepperProps> = ({ status, compact = false }) => {
  const index = STAGES.indexOf(status as JobStatus);
  const { color, label } = getStatusPresentation(status);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Stage ${index + 1} of ${STAGES.length}: ${label}`}
      accessibilityValue={{ min: 1, max: STAGES.length, now: index + 1 }}
    >
      <View style={styles.bars}>
        {STAGES.map((stage, i) => (
          <View
            key={stage}
            style={[
              compact ? styles.barCompact : styles.bar,
              { backgroundColor: i <= index ? color : colors.border },
              i === index && styles.barCurrent,
            ]}
          />
        ))}
      </View>
      {compact ? null : (
        <Text style={styles.caption}>
          {index >= 0 ? `Stage ${index + 1} of ${STAGES.length}` : 'Stage unknown'}
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
