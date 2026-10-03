import { getErrorMessage, isSubscriptionRequired } from '../lib/errors';
import { LocationMapPicker } from './LocationMapPicker';
import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServicePillar, FacilityType, ServiceRequest } from '@metro-fix/core-types';
import { apiService } from '../services/api';
import { getCurrentPositionOrNull, describeCoordinates } from '../services/location';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon, type FeatherIconName } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { shortRef } from '../lib/ticket';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { useToast } from './ui/Toast';
import { haptics } from '../lib/haptics';

interface CustomerBookingWizardProps {
  customerId: string;
  onBookingComplete: (job: ServiceRequest) => void;
  /** The API refused because the customer has no plan: take them to the plans. */
  onNeedSubscription?: () => void;
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

const TOTAL_STEPS = 4;
const STEP_NAMES = ['Service', 'Location', 'Details', 'Review'] as const;

type Step = 1 | 2 | 3 | 4;
type LocationStatus = 'idle' | 'detecting' | 'found' | 'failed';
type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const parseCoords = (latitude: string, longitude: string) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const valid = !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180;
  return { lat, lng, valid };
};

export const CustomerBookingWizard: React.FC<CustomerBookingWizardProps> = ({
  customerId,
  onBookingComplete,
  onNeedSubscription,
}) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { scrollY, onScroll } = useCollapsingHeader();
  const [step, setStep] = useState<Step>(1);

  // Form State
  const [servicePillar, setServicePillar] = useState<ServicePillar>(ServicePillar.HARD);
  const [facilityType, setFacilityType] = useState<FacilityType>(FacilityType.RESIDENTIAL);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [place, setPlace] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<ServiceRequest | null>(null);

  const successScale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (!submitted) return;
    Animated.spring(successScale, { toValue: 1, damping: 9, stiffness: 160, useNativeDriver: true }).start();
  }, [submitted, successScale]);

  const detectLocation = async () => {
    setLocationStatus('detecting');
    const position = await getCurrentPositionOrNull();
    if (!position) {
      setLocationStatus('failed');
      return;
    }
    setLatitude(position.latitude.toFixed(6));
    setLongitude(position.longitude.toFixed(6));
    setPlace(null);
    setLocationStatus('found');
    // The address is a nicety; the pin is already set if geocoding is unavailable.
    describeCoordinates(position).then(setPlace);
  };

  // Detect once, the first time the customer reaches the location step.
  useEffect(() => {
    if (step === 2 && locationStatus === 'idle') detectLocation();
  }, [step, locationStatus]);

  const coords = parseCoords(latitude, longitude);

  // A pin placed or dragged on the map becomes the site location.
  const handlePinPicked = (point: { latitude: number; longitude: number }) => {
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    setLocationStatus('found');
    setPlace(null);
    describeCoordinates(point).then(setPlace);
  };

  const handleNextStep2 = () => {
    if (!coords.valid) {
      toast.error('Drop a pin on the map, or use your current location.', 'Site location needed');
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Give your request a short, descriptive title.', 'Title required');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error('Describe the maintenance issue so we can dispatch the right worker.', 'Description required');
      return;
    }
    setStep(4);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const createdJob = await apiService.createJob({
        title: title.trim(),
        description: description.trim(),
        servicePillar,
        facilityType,
        customerId,
        location: { latitude: coords.lat, longitude: coords.lng },
        urgency,
      });
      haptics.success();
      setSubmitted(createdJob);
    } catch (error: any) {
      if (isSubscriptionRequired(error)) {
        toast.error(getErrorMessage(error), 'Subscription required');
        onNeedSubscription?.();
      } else {
        toast.error(getErrorMessage(error, 'Failed to submit service request'), 'Submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pillar = PILLAR_OPTIONS.find((option) => option.value === servicePillar) ?? PILLAR_OPTIONS[0];
  const locationLine =
    place || (coords.valid ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Not set');

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollFill}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance(insets) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Header */}
        <ScreenHeader
          eyebrow="Metro-Fix customer portal"
          title="Book Maintenance Service"
        />

        {/* SUCCESS: shown after the request has been raised */}
        {submitted ? (
          <View style={[styles.stepCard, styles.successCard]}>
            <Animated.View style={[styles.successDisc, { transform: [{ scale: successScale }] }]}>
              <Icon name="check" size={38} color={colors.white} />
            </Animated.View>
            <Text style={styles.successTitle} accessibilityRole="header">
              Request sent
            </Text>
            <Text style={styles.successBody}>
              Customer Care has your request and will dispatch a technician shortly.
            </Text>
            <View style={styles.ticketChip}>
              <Icon name="hash" size={13} color={colors.brand} />
              <Text style={styles.ticketChipText}>{shortRef(submitted.id)}</Text>
            </View>
            <Button
              title="Track request"
              onPress={() => onBookingComplete(submitted)}
              variant="primary"
              size="large"
              style={styles.primaryAction}
            />
          </View>
        ) : (
          <>
            {/* Multi-step Progress Indicator */}
            <View
              style={styles.stepIndicatorRow}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}: ${STEP_NAMES[step - 1]}`}
              accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: step }}
            >
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
            <Text style={styles.stepName}>{`Step ${step} · ${STEP_NAMES[step - 1]}`}</Text>

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
                        accessibilityLabel={`${option.title}. ${option.desc}`}
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
                  onPress={() => setStep(2)}
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
                  Tell us what kind of site it is and where the technician should go.
                </Text>

                <Text style={styles.inputLabel}>Facility type</Text>
                <View style={styles.facilityRow}>
                  {[FacilityType.RESIDENTIAL, FacilityType.COMMERCIAL, FacilityType.INDUSTRIAL].map((type) => {
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
                        <Text style={[styles.facilityChipText, selected && styles.facilityChipTextSelected]}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.locationCard}>
                  <View style={styles.locationRow}>
                    <View
                      style={[
                        styles.locationDisc,
                        locationStatus === 'failed' && styles.locationDiscWarn,
                      ]}
                    >
                      {locationStatus === 'detecting' || locationStatus === 'idle' ? (
                        <ActivityIndicator size="small" color={colors.brand} />
                      ) : (
                        <Icon
                          name={locationStatus === 'failed' ? 'alert-circle' : 'map-pin'}
                          size={18}
                          color={locationStatus === 'failed' ? colors.warning : colors.brand}
                        />
                      )}
                    </View>
                    <View style={styles.locationText} accessibilityLiveRegion="polite">
                      {locationStatus === 'detecting' || locationStatus === 'idle' ? (
                        <Text style={styles.locationPrimary}>Finding your location…</Text>
                      ) : locationStatus === 'failed' && !coords.valid ? (
                        <>
                          <Text style={styles.locationPrimary}>We couldn’t read your location</Text>
                          <Text style={styles.locationSecondary}>
                            Allow location access, or drop a pin on the map below.
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.locationPrimary} numberOfLines={2}>
                            {locationLine}
                          </Text>
                          {coords.valid && place ? (
                            <Text style={styles.locationSecondary}>
                              {`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
                            </Text>
                          ) : null}
                        </>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={detectLocation}
                    disabled={locationStatus === 'detecting'}
                    style={({ pressed }) => [styles.locateButton, pressed && styles.locateButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Use my current location"
                  >
                    <Icon name="crosshair" size={15} color={colors.brand} />
                    <Text style={styles.locateText}>Use my current location</Text>
                  </Pressable>

                  <LocationMapPicker
                    value={coords.valid ? { latitude: coords.lat, longitude: coords.lng } : null}
                    onChange={handlePinPicked}
                  />
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
                    returnKeyType="next"
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
                        <Text style={[styles.urgencyChipText, selected && styles.urgencyChipTextSelected]}>
                          {level}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.navRow}>
                  <Button title="Back" onPress={() => setStep(2)} variant="secondary" size="medium" />
                  <Button
                    title="Review request"
                    onPress={handleNextStep3}
                    variant="primary"
                    size="medium"
                    style={styles.navPrimary}
                  />
                </View>
              </View>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Review & Send</Text>
                <Text style={styles.stepSubtitle}>Check the details before we send them to Customer Care.</Text>

                <View style={styles.reviewList}>
                  <ReviewRow
                    icon={pillar.icon}
                    label="Service"
                    value={`${pillar.title} · ${facilityType}`}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow icon="map-pin" label="Site" value={locationLine} onEdit={() => setStep(2)} />
                  <ReviewRow
                    icon="file-text"
                    label={title.trim()}
                    value={description.trim()}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow icon="alert-triangle" label="Urgency" value={urgency} onEdit={() => setStep(3)} />
                </View>

                <View style={styles.navRow}>
                  <Button title="Back" onPress={() => setStep(3)} variant="secondary" size="medium" />
                  <Button
                    title="Send request"
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
          </>
        )}
      </Animated.ScrollView>
      <GlassHeader title="Book Service" scrollY={scrollY} />
    </View>
  );
};

interface ReviewRowProps {
  icon: FeatherIconName;
  label: string;
  value: string;
  onEdit: () => void;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ icon, label, value, onEdit }) => (
  <View style={styles.reviewRow}>
    <View style={styles.reviewIcon}>
      <Icon name={icon} size={16} color={colors.brand} />
    </View>
    <View style={styles.reviewText}>
      <Text style={styles.reviewLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.reviewValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
    <Pressable
      onPress={onEdit}
      style={styles.reviewEdit}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
    >
      <Text style={styles.reviewEditText}>Edit</Text>
    </Pressable>
  </View>
);

const styles = themedStyles(() => StyleSheet.create({
  stepName: {
    ...typography.overline,
    color: colors.textSecondary,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },

  // ── Location card ──
  locationCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSubtle,
  },
  locationDiscWarn: {
    backgroundColor: colors.surfaceRaised,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
  },
  locationPrimary: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  locationSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: layout.minTap,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
  },
  locateButtonPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  locateText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.brand,
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTap,
  },
  manualText: {
    ...typography.label,
    color: colors.textSecondary,
  },

  // ── Review ──
  reviewList: {
    gap: spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSubtle,
  },
  reviewText: {
    flex: 1,
    minWidth: 0,
  },
  reviewLabel: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  reviewValue: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  reviewEdit: {
    minHeight: layout.minTap,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  reviewEditText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.brand,
  },

  // ── Success ──
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  successDisc: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.h1,
    color: colors.text,
  },
  successBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  ticketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
  },
  ticketChipText: {
    ...typography.label,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.brand,
  },
  scrollFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
}));
