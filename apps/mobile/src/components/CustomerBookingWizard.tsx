import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServicePillar, FacilityType, ServiceRequest } from '@metro-fix/core-types';
import { apiService } from '../services/api';
import { getCurrentWorkerLocation } from '../services/location';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon, type FeatherIconName } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';

interface CustomerBookingWizardProps {
  customerId: string;
  onBookingComplete: (job: ServiceRequest) => void;
}

const PILLAR_OPTIONS: {
  value: ServicePillar;
  icon: FeatherIconName;
  title: string;
  desc: string;
}[] = [
  {
    value: ServicePillar.HARD,
    icon: 'tool',
    title: 'HARD FM',
    desc: 'HVAC, electrical, plumbing, mechanical & structural repairs',
  },
  {
    value: ServicePillar.SOFT,
    icon: 'droplet',
    title: 'SOFT FM',
    desc: 'Deep cleaning, sanitation, reception, groundskeeping & security',
  },
  {
    value: ServicePillar.STRATEGIC,
    icon: 'shield',
    title: 'STRATEGIC FM',
    desc: 'Energy audits, compliance inspections & vendor governance',
  },
];

const TOTAL_STEPS = 3;

export const CustomerBookingWizard: React.FC<CustomerBookingWizardProps> = ({
  customerId,
  onBookingComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [servicePillar, setServicePillar] = useState<ServicePillar>(ServicePillar.HARD);
  const [facilityType, setFacilityType] = useState<FacilityType>(FacilityType.RESIDENTIAL);
  const [latitude, setLatitude] = useState<string>('37.7749');
  const [longitude, setLongitude] = useState<string>('-122.4194');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Auto fetch GPS on mount for location step
    fetchGpsLocation();
  }, []);

  const fetchGpsLocation = async () => {
    setLoadingGps(true);
    try {
      const coords = await getCurrentWorkerLocation();
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));
    } catch {
      // Keep defaults
    } finally {
      setLoadingGps(false);
    }
  };

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      Alert.alert('Invalid Latitude', 'Please enter a valid latitude (-90 to 90)');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      Alert.alert('Invalid Longitude', 'Please enter a valid longitude (-180 to 180)');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!title.trim() || title.length < 3) {
      Alert.alert('Title Required', 'Please enter a descriptive service request title.');
      return;
    }
    if (!description.trim() || description.length < 5) {
      Alert.alert('Description Required', 'Please detail the maintenance issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdJob = await apiService.createJob({
        title: title.trim(),
        description: description.trim(),
        servicePillar,
        facilityType,
        customerId,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        urgency,
      });

      Alert.alert('Request Raised!', 'Your service request has been sent to Customer Care Dispatch.');
      onBookingComplete(createdJob);
    } catch (error: any) {
      Alert.alert('Submission Error', error?.message || 'Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance(insets) }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <ScreenHeader
        eyebrow="Metro-Fix customer portal"
        title="Book Maintenance Service"
      />

      {/* Multi-step Progress Indicator */}
      <View style={styles.stepIndicatorRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <React.Fragment key={n}>
            {n > 1 && <View style={[styles.stepLine, step >= n && styles.stepLineActive]} />}
            <View style={[styles.stepDot, step >= n && styles.stepDotActive]}>
              {step > n ? (
                <Icon name="check" size={14} color={colors.white} />
              ) : (
                <Text style={[styles.stepDotNum, step >= n && styles.stepDotNumActive]}>{n}</Text>
              )}
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* STEP 1: SERVICE CATEGORY PILLAR */}
      {step === 1 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Select Service Category</Text>
          <Text style={styles.stepSubtitle}>
            Choose the FM pillar matching your facility maintenance requirement.
          </Text>

          <View style={styles.pillarList}>
            {PILLAR_OPTIONS.map((option) => {
              const selected = servicePillar === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.pillarCard,
                    selected && styles.pillarCardSelected,
                    pressed && !selected && styles.pillarCardPressed,
                  ]}
                  onPress={() => setServicePillar(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.pillarIconBox, selected && styles.pillarIconBoxSelected]}>
                    <Icon
                      name={option.icon}
                      size={20}
                      color={selected ? colors.white : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.pillarInfo}>
                    <Text style={styles.pillarTitle}>{option.title}</Text>
                    <Text style={styles.pillarDesc}>{option.desc}</Text>
                  </View>
                  {selected ? <Icon name="check-circle" size={19} color={colors.brand} /> : null}
                </Pressable>
              );
            })}
          </View>

          <Button
            title="Continue to Location"
            onPress={handleNextStep1}
            variant="primary"
            size="large"
            style={styles.primaryAction}
          />
        </View>
      )}

      {/* STEP 2: LOCATION & FACILITY */}
      {step === 2 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Location & Facility</Text>
          <Text style={styles.stepSubtitle}>
            Specify facility type and confirm GPS site location coordinates.
          </Text>

          <Text style={styles.inputLabel}>Facility type</Text>
          <View style={styles.facilityRow}>
            {[
              FacilityType.RESIDENTIAL,
              FacilityType.COMMERCIAL,
              FacilityType.INDUSTRIAL,
            ].map((type) => {
              const selected = facilityType === type;
              return (
                <Pressable
                  key={type}
                  style={({ pressed }) => [
                    styles.facilityChip,
                    selected && styles.facilityChipSelected,
                    pressed && !selected && styles.facilityChipPressed,
                  ]}
                  onPress={() => setFacilityType(type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.facilityChipText,
                      selected && styles.facilityChipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.gpsBox}>
            <View style={styles.gpsHeader}>
              <Text style={styles.inputLabel}>Site GPS coordinates</Text>
              <Pressable
                onPress={fetchGpsLocation}
                disabled={loadingGps}
                style={styles.gpsRefreshBtn}
                accessibilityRole="button"
                accessibilityLabel="Detect GPS"
              >
                {loadingGps ? (
                  <ActivityIndicator size="small" color={colors.brand} />
                ) : (
                  <>
                    <Icon name="crosshair" size={14} color={colors.brand} />
                    <Text style={styles.gpsRefreshText}>Detect GPS</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.coordInputsRow}>
              <Input
                label="Latitude"
                containerStyle={styles.coordInputCol}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                placeholder="37.7749"
              />
              <Input
                label="Longitude"
                containerStyle={styles.coordInputCol}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                placeholder="-122.4194"
              />
            </View>
          </View>

          <View style={styles.navRow}>
            <Button title="Back" onPress={() => setStep(1)} variant="secondary" size="medium" />
            <Button
              title="Continue to Details"
              onPress={handleNextStep2}
              variant="primary"
              size="medium"
              style={styles.navPrimary}
            />
          </View>
        </View>
      )}

      {/* STEP 3: DETAILS & URGENCY */}
      {step === 3 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Job Details & Urgency</Text>
          <Text style={styles.stepSubtitle}>
            Describe the issue to help Customer Care dispatch the right technician.
          </Text>

          <View style={styles.fields}>
            <Input
              label="Issue title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Roof HVAC Unit Pressure Fault"
            />

            <Input
              label="Detailed description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe symptoms, noise, or scope of maintenance needed…"
            />
          </View>

          <Text style={[styles.inputLabel, styles.urgencyLabel]}>Dispatch urgency level</Text>
          <View style={styles.urgencyGrid}>
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => {
              const selected = urgency === level;
              return (
                <Pressable
                  key={level}
                  style={({ pressed }) => [
                    styles.urgencyChip,
                    selected && styles.urgencyChipSelected,
                    pressed && !selected && styles.facilityChipPressed,
                  ]}
                  onPress={() => setUrgency(level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.urgencyChipText,
                      selected && styles.urgencyChipTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.navRow}>
            <Button title="Back" onPress={() => setStep(2)} variant="secondary" size="medium" />
            <Button
              title="Submit Request"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              variant="primary"
              size="medium"
              style={styles.navPrimary}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  // ── Step indicator ──
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  stepDotNum: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  stepDotNumActive: {
    color: colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineActive: {
    backgroundColor: colors.brand,
  },

  // ── Step card ──
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  stepTitle: {
    ...typography.h1,
    color: colors.text,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  primaryAction: {
    marginTop: spacing.xl,
  },

  // ── Pillar options ──
  pillarList: {
    gap: spacing.md,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillarCardPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  pillarCardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSubtle,
  },
  pillarIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pillarIconBoxSelected: {
    backgroundColor: colors.brand,
  },
  pillarInfo: {
    flex: 1,
    minWidth: 0,
  },
  pillarTitle: {
    ...typography.h3,
    color: colors.text,
  },
  pillarDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Fields ──
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fields: {
    gap: spacing.lg,
  },
  facilityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  facilityChip: {
    flex: 1,
    minHeight: layout.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  facilityChipPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  facilityChipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  facilityChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  facilityChipTextSelected: {
    color: colors.white,
  },

  // ── GPS ──
  gpsBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
  },
  gpsRefreshText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand,
  },
  coordInputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordInputCol: {
    flex: 1,
  },

  // ── Urgency ──
  urgencyLabel: {
    marginTop: spacing.xl,
  },
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  urgencyChip: {
    flexGrow: 1,
    flexBasis: '22%',
    minHeight: layout.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  urgencyChipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  urgencyChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  urgencyChipTextSelected: {
    color: colors.white,
  },

  // ── Navigation ──
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  navPrimary: {
    flex: 1,
  },
});
