import { apiService } from '../services/api';
import { mediaUrl } from '../lib/api';
import { JobCardForm } from './JobCardForm';
import { draftFromSection, draftToPayload, type JobCardDraft } from '../lib/jobCard';
import { jobCardBillable } from '@metro-fix/core-types';
import React, { useState, useRef } from 'react';
import { Animated, View, StyleSheet, ScrollView, Pressable, Image, Modal, Dimensions, Linking, Platform } from 'react-native';
import { Text } from './ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { ServiceRequest, JobStatus } from '@metro-fix/core-types';

import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { StatusPill } from './ui/StatusPill';
import { MetaChip } from './ui/MetaChip';
import { GlassSurface } from './ui/GlassSurface';
import { ToastHost, useToast } from './ui/Toast';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { QuickAction } from './ui/QuickAction';
import { StageStepper } from './ui/StageStepper';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { PILLAR_ICON, FACILITY_ICON, getStatusColor } from '../theme/status';
import { useJobDetail, useUpdateJobStatus, useSubmitQuote, useSubmitProof } from '../hooks/useJobs';
import { startWorkerBackgroundTracking, stopWorkerBackgroundTracking } from '../services/location';
import { openNativeNavigation } from '../services/linking';
import { haptics } from '../lib/haptics';
import { useReduceMotion } from '../theme/useReduceMotion';
import { themedStyles } from '../theme/themedStyles';
import { shortRef } from '../lib/ticket';
import { customerNameOf, customerPhoneOf, coordinatesOf } from '../lib/jobs';

const { height: SCREEN_H } = Dimensions.get('window');

export interface JobDetailProps {
  job: ServiceRequest;
  workerId: string;
  onBack: () => void;
  onJobUpdated?: (updatedJob: ServiceRequest) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job: initialJob, workerId, onBack, onJobUpdated }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { scrollY, onScroll } = useCollapsingHeader();
  const reduceMotion = useReduceMotion();
  const { data: liveJob } = useJobDetail(initialJob.id);
  const currentJob = liveJob || initialJob;

  const updateStatus = useUpdateJobStatus();
  const submitQuote = useSubmitQuote();
  const submitProof = useSubmitProof();

  const [gpsStatus, setGpsStatus] = useState('Standby');
  // The job card: filled in as the quote at inspection, confirmed or corrected at completion.
  const [quoteCard, setQuoteCard] = useState<JobCardDraft>(() => draftFromSection(currentJob.jobCard?.estimate));
  const [finalCard, setFinalCard] = useState<JobCardDraft>(() =>
    draftFromSection(jobCardBillable(currentJob.jobCard)),
  );
  const cardTaxRate = currentJob.jobCard?.taxRate ?? 0;
  const cardCurrency = currentJob.jobCard?.currency ?? 'LKR';

  // Reject (unserviceable / out of scope) state
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  // Proof modal state
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const signatureRef = useRef<any>(null);
  // Drawing a signature must not scroll the sheet underneath it.
  const [sheetScrollable, setSheetScrollable] = useState(true);
  const [signatureB64, setSignatureB64] = useState(currentJob.signature || '');
  const [photos, setPhotos] = useState<string[]>(currentJob.photos || []);

  const lifecycle = (s: JobStatus): { text: string; next: JobStatus } | null => {
    if (s === JobStatus.ASSIGNED) return { text: 'Start Travel', next: JobStatus.ON_ROUTE };
    if (s === JobStatus.ON_ROUTE) return { text: 'Arrive on Site', next: JobStatus.INSPECTION };
    if (s === JobStatus.INSPECTION) return { text: 'Begin Work', next: JobStatus.IN_PROGRESS };
    return null;
  };

  const handleLifecycle = async () => {
    const cfg = lifecycle(currentJob.status);
    if (!cfg) return;
    try {
      if (cfg.next === JobStatus.ON_ROUTE) {
        setGpsStatus('Requesting GPS…');
        const ok = await startWorkerBackgroundTracking();
        setGpsStatus(ok ? 'Active Telemetry' : 'GPS Fallback');
      } else if (cfg.next === JobStatus.INSPECTION) {
        setGpsStatus('Arrived');
        await stopWorkerBackgroundTracking();
      }
      const updated = await updateStatus.mutateAsync({ jobId: currentJob.id, status: cfg.next, workerId });
      haptics.success();
      onJobUpdated?.(updated);
    } catch (e: any) { toast.error(e.message || 'Could not update status.', 'Update failed'); }
  };

  const handleQuote = async () => {
    const result = draftToPayload(quoteCard);
    if (!result.ok) return toast.error(result.error, 'Check the quote');
    try {
      const updated = await submitQuote.mutateAsync({
        jobId: currentJob.id,
        lineItems: result.payload.lineItems,
        estimatedHours: result.payload.hours,
        notes: result.payload.notes,
      });
      onJobUpdated?.(updated);
      setFinalCard(draftFromSection(jobCardBillable(updated.jobCard)));
      toast.success('The job is now in progress.', 'Quote submitted');
    } catch (e: any) { toast.error(e.message || 'Failed to submit quote.', 'Quote failed'); }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 3) return toast.error('Tell dispatch why you cannot do this job.', 'Reason required');
    setRejectBusy(true);
    try {
      await stopWorkerBackgroundTracking();
      await apiService.rejectJob(currentJob.id, rejectReason.trim());
      haptics.success();
      toast.success('Dispatch will reassign this ticket.', 'Job returned');
      onBack();
    } catch (e: any) { toast.error(e.message || 'Could not reject the job.', 'Could not return job'); }
    finally { setRejectBusy(false); }
  };

  // Photos go to the server as files; the proof stores only their paths, not the image data.
  const [uploading, setUploading] = useState(0);
  const addPhotos = async (uris: string[]) => {
    setUploading((n) => n + uris.length);
    const results = await Promise.allSettled(uris.map((uri) => apiService.uploadPhoto(uri)));
    setUploading((n) => n - uris.length);
    const stored = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (stored.length) setPhotos((prev) => [...prev, ...stored]);
    const failed = results.length - stored.length;
    if (failed) toast.error(`${failed} photo${failed > 1 ? 's' : ''} could not be uploaded. Check your connection and try again.`, 'Upload failed');
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return toast.error('Camera access is needed to capture proof.', 'Permission required');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets?.[0]) await addPhotos([result.assets[0].uri]);
    } catch (e: any) { toast.error(e.message || 'Could not open the camera.', 'Camera error'); }
  };

  const handlePickFromLibrary = async () => {
    try {
      // The system picker needs no permission prompt; it only hands over what the worker selects.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) await addPhotos(result.assets.map((a) => a.uri));
    } catch (e: any) { toast.error(e.message || 'Could not open your photos.', 'Library error'); }
  };

  const handleProofSubmit = async () => {
    if (!signatureB64 || signatureB64.length < 10) {
      return toast.error('Complete the customer signature first.', 'Signature required');
    }
    const card = draftToPayload(finalCard);
    if (!card.ok) return toast.error(card.error, 'Check the job card');
    try {
      const updated = await submitProof.mutateAsync({
        jobId: currentJob.id,
        signature: signatureB64,
        photos,
        finalCard: card.payload,
      });
      onJobUpdated?.(updated);
      setProofModalVisible(false);
      toast.success('The ticket is completed.', 'Proof submitted');
    } catch (e: any) { toast.error(e.message || 'Failed to submit proof.', 'Proof failed'); }
  };

  const lc = lifecycle(currentJob.status);

  const accent = getStatusColor(currentJob.status);
  const pillarIcon = PILLAR_ICON[currentJob.servicePillar] ?? 'tool';
  // From the customer attached to the job by the API (name, phone), not guessed.
  const customerPhone = customerPhoneOf(currentJob);
  const customerLabel = customerNameOf(currentJob);

  const openMaps = () => {
    if (!currentJob.location) return toast.info('This job has no coordinates yet.', 'No location');
    openNativeNavigation({
      latitude: currentJob.location.latitude,
      longitude: currentJob.location.longitude,
      label: currentJob.title,
    });
  };
  const contact = (scheme: 'tel' | 'sms') => {
    if (!customerPhone) {
      return toast.info('The customer’s phone number isn’t available yet.', 'No number on file');
    }
    Linking.openURL(`${scheme}:${customerPhone}`).catch(() =>
      toast.error('Could not open the phone app.', 'Unable to contact'),
    );
  };

  // The hero drifts slower than the content as it scrolls away.
  const heroShift = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, reduceMotion ? 0 : 110],
    extrapolate: 'clamp',
  });

  const backButton = (
    <IconButton
      onPress={onBack}
      accessibilityLabel="Back"
      icon={<Icon name="chevron-left" size={22} color={colors.photoControlIcon} />}
      backgroundColor={colors.photoControl}
      size={44}
    />
  );
  const mapButton = (
    <IconButton
      onPress={openMaps}
      accessibilityLabel="Open in maps"
      icon={<Icon name="map-pin" size={19} color={colors.photoControlIcon} />}
      backgroundColor={colors.photoControl}
      size={44}
    />
  );

  return (
    <View style={s.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.scroll, { paddingBottom: 112 + insets.bottom }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Hero: tinted by the job's current stage, with the service pillar as a watermark */}
        <Animated.View
          style={[
            s.hero,
            { paddingTop: spacing.md + insets.top, transform: [{ translateY: heroShift }] },
          ]}
        >
          <LinearGradient
            colors={[`${accent}99`, `${accent}26`, 'transparent']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.watermark} pointerEvents="none">
            <Icon name={pillarIcon} size={170} color={accent} />
          </View>
          <View style={s.navRow}>
            {backButton}
            {mapButton}
          </View>
          <View style={s.heroFooter}>
            <StatusPill status={currentJob.status} />
          </View>
        </Animated.View>

        {/* Overlapping sheet */}
        <View style={s.sheet}>
          <View style={s.pill} />
          <View style={s.titleRow}>
            <Text style={s.ticketId}>TICKET #{shortRef(currentJob.id)}</Text>
            <View style={s.gpsRow}>
              <Icon name="radio" size={13} color={colors.textSecondary} />
              <Text style={s.gps}>{gpsStatus}</Text>
            </View>
          </View>
          <Text style={s.jobTitle} accessibilityRole="header">
            {currentJob.title}
          </Text>
          <View style={s.stepperWrap}>
            <StageStepper status={currentJob.status} />
          </View>

          <View style={s.quickRow}>
            <QuickAction icon="navigation" label="Navigate" onPress={openMaps} />
            <QuickAction
              icon="phone"
              label="Call"
              dimmed={!customerPhone}
              onPress={() => contact('tel')}
            />
            <QuickAction
              icon="message-circle"
              label="Message"
              dimmed={!customerPhone}
              onPress={() => contact('sms')}
            />
          </View>

          <Card variant="elevated" borderRadius={radius.xl} padding={spacing.lg + 2} style={s.cardGap}>
            <Text style={s.heading}>Customer & address</Text>
            <View style={s.infoLine}>
              <Icon name="user" size={15} color={colors.textSecondary} />
              <Text style={s.custName}>{customerLabel}</Text>
            </View>
            <View style={s.infoLine}>
              <Icon name="map-pin" size={15} color={colors.textMuted} />
              <Text style={s.loc}>
                {coordinatesOf(currentJob) ?? 'Site address to be confirmed'}
              </Text>
            </View>
          </Card>

          <Card variant="elevated" borderRadius={radius.xl} padding={spacing.lg + 2} style={s.cardGap}>
            <Text style={s.heading}>Service description</Text>
            <Text style={s.desc}>{currentJob.description}</Text>
            <View style={s.metaRow}>
              <MetaChip icon={pillarIcon} label={currentJob.servicePillar} tint={colors.brand} />
              <MetaChip
                icon={FACILITY_ICON[currentJob.facilityType] ?? 'home'}
                label={currentJob.facilityType}
              />
            </View>
          </Card>

          {/* INSPECTION: quote form */}
          {currentJob.status === JobStatus.INSPECTION && (
            <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xl} style={s.cardGap}>
              <View style={s.formHeader}>
                <View style={s.formIcon}>
                  <Icon name="edit-3" size={17} color={colors.brand} />
                </View>
                <View style={s.formHeaderText}>
                  <Text style={s.formTitle}>Inspection quote</Text>
                  <Text style={s.formDesc}>Itemise labour and materials. Dispatch and the customer see this as your estimate.</Text>
                </View>
              </View>
              <JobCardForm draft={quoteCard} onChange={setQuoteCard} taxRate={cardTaxRate} currency={cardCurrency} />
              <Button title="Submit quote" onPress={handleQuote} isLoading={submitQuote.isPending} variant="primary" size="large" style={s.formSubmit} />
            </Card>
          )}

          {/* ASSIGNED / INSPECTION: worker can decline and bounce the job back to dispatch */}
          {(currentJob.status === JobStatus.ASSIGNED || currentJob.status === JobStatus.INSPECTION) && (
            <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xl} style={s.cardGap}>
              {rejecting ? (
                <>
                  <Input label="Why can't you do this job?" value={rejectReason} onChangeText={setRejectReason} placeholder="e.g. Outside my trade / unsafe site" multiline numberOfLines={3} />
                  <Button title="Return Job to Dispatch" onPress={handleReject} isLoading={rejectBusy} variant="danger" size="large" style={s.formSubmit} />
                  <Button title="Cancel" onPress={() => setRejecting(false)} variant="secondary" size="large" style={s.formSubmit} />
                </>
              ) : (
                <Button title="Can't do this job" onPress={() => setRejecting(true)} variant="danger" size="large" />
              )}
            </Card>
          )}
        </View>
      </Animated.ScrollView>

      {/* Compact glass bar once the hero has scrolled away */}
      <GlassHeader
        title={currentJob.title}
        scrollY={scrollY}
        parentPadded={false}
        left={backButton}
        right={mapButton}
      />

      {/* Bottom CTA, floating on glass */}
      {(lc || currentJob.status === JobStatus.IN_PROGRESS || currentJob.status === JobStatus.COMPLETED) && (
        <View style={[s.bottomBar, { bottom: layout.tabBarInset + insets.bottom }]}>
          <GlassSurface borderRadius={radius.xxl} style={s.bottomGlass}>
            {lc && (
              <Button title={`${lc.text} →`} onPress={handleLifecycle} isLoading={updateStatus.isPending} variant="primary" size="large" />
            )}
            {currentJob.status === JobStatus.IN_PROGRESS && (
              <Button title="Complete job →" onPress={() => setProofModalVisible(true)} variant="primary" size="large" />
            )}
            {currentJob.status === JobStatus.COMPLETED && (
              <Button title="Ticket completed" onPress={onBack} variant="secondary" size="large" />
            )}
          </GlassSurface>
        </View>
      )}

      {/* Proof of work: a floating glass sheet */}
      <Modal visible={proofModalVisible} animationType="slide" transparent onRequestClose={() => setProofModalVisible(false)}>
        <View style={m.backdrop}>
          <ToastHost />
          <GlassSurface
            borderRadius={radius.xxl + 4}
            tintColor={colors.glassStrong}
            style={[m.sheet, { marginBottom: insets.bottom + spacing.sm }]}
          >
            <ScrollView
              style={m.sheetScroll}
              contentContainerStyle={m.sheetInner}
              scrollEnabled={sheetScrollable}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
            >
              <View style={m.handle} />
              <View style={m.sectionHeader}>
                <Icon name="camera" size={17} color={colors.brand} />
                <Text style={m.title}>Work completion proof</Text>
              </View>
              <Text style={m.subtitle}>Confirm the job card, add photos and collect the customer’s signature</Text>

              <View style={[m.sectionHeader, m.sectionHeaderSpaced]}>
                <Icon name="file-text" size={17} color={colors.brand} />
                <Text style={m.title}>Job card</Text>
              </View>
              <Text style={m.subtitle}>Correct anything that changed on site. This becomes the basis for the invoice.</Text>
              <JobCardForm draft={finalCard} onChange={setFinalCard} taxRate={cardTaxRate} currency={cardCurrency} />

              <Pressable
                style={({ pressed }) => [m.camBtn, pressed && m.camBtnPressed]}
                onPress={handleTakePhoto}
                accessibilityRole="button"
                accessibilityLabel="Capture photo"
              >
                <Icon name="camera" size={17} color={colors.text} />
                <Text style={m.camBtnText}>Take photo</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [m.camBtn, m.libBtn, pressed && m.camBtnPressed]}
                onPress={handlePickFromLibrary}
                accessibilityRole="button"
                accessibilityLabel="Choose photos from library"
              >
                <Icon name="image" size={17} color={colors.text} />
                <Text style={m.camBtnText}>Choose from library</Text>
              </Pressable>

              {uploading > 0 ? <Text style={m.subtitle}>{`Uploading ${uploading} photo${uploading > 1 ? 's' : ''}…`}</Text> : null}
              {photos.length > 0 && (
                <ScrollView horizontal style={m.thumbRow} showsHorizontalScrollIndicator={false}>
                  {photos.map((uri, i) => <Image key={`${uri}-${i}`} source={{ uri: mediaUrl(uri) }} style={m.thumb} />)}
                </ScrollView>
              )}

              <View style={[m.sectionHeader, m.sectionHeaderSpaced]}>
                <Icon name="edit-3" size={17} color={colors.brand} />
                <Text style={m.title}>Customer signature</Text>
              </View>
              <View style={m.sigBox}>
                <SignatureScreen
                  ref={signatureRef}
                  // The pad reports the drawing when a stroke ends; without this the screen never
                  // received a signature and "Submit proof" stayed refused.
                  onBegin={() => setSheetScrollable(false)}
                  onEnd={() => {
                    setSheetScrollable(true);
                    signatureRef.current?.readSignature();
                  }}
                  onOK={(sig: string) => setSignatureB64(sig)}
                  onClear={() => setSignatureB64('')}
                  onEmpty={() => setSignatureB64('')}
                  // A signature is ink on paper: always dark ink on a light pad, in either theme.
                  penColor="#111827"
                  backgroundColor="#ffffff"
                  webStyle=".m-signature-pad{box-shadow:none;border:none;background-color:#ffffff}.m-signature-pad--body{border:none}.m-signature-pad--footer{display:none}"
                />
              </View>
              <Pressable
                onPress={() => signatureRef.current?.clearSignature()}
                accessibilityRole="button"
                accessibilityLabel="Clear signature"
                hitSlop={8}
                style={m.clearSig}
              >
                <Text style={m.clearSigText}>Clear signature</Text>
              </Pressable>

              <View style={m.modalActions}>
                <Button title="Submit proof" onPress={handleProofSubmit} isLoading={submitProof.isPending} disabled={uploading > 0} variant="primary" size="large" />
                <Button title="Cancel" onPress={() => setProofModalVisible(false)} variant="outline" size="medium" />
              </View>
            </ScrollView>
          </GlassSurface>
        </View>
      </Modal>
    </View>
  );
};

const s = themedStyles(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flexGrow: 1 },
  hero: {
    height: 250,
    width: '100%',
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  watermark: {
    position: 'absolute',
    right: -18,
    top: 36,
    opacity: 0.16,
    transform: [{ rotate: '-12deg' }],
  },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroFooter: { marginBottom: spacing.huge + spacing.xs },

  sheet: {
    marginTop: -36,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    backgroundColor: colors.bg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    minHeight: 500,
    flexGrow: 1,
  },
  pill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ticketId: { ...typography.overline, color: colors.brand },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  gps: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  jobTitle: { ...typography.display, color: colors.text, marginBottom: spacing.lg },
  stepperWrap: { marginBottom: spacing.xl },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },

  cardGap: { marginBottom: spacing.lg },
  heading: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.md },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  custName: { ...typography.h3, color: colors.text, flex: 1 },
  loc: { ...typography.body, color: colors.textSecondary, flex: 1 },
  desc: { ...typography.body, color: colors.text, marginBottom: spacing.lg },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  formIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSubtle,
  },
  formHeaderText: { flex: 1 },
  formTitle: { ...typography.h2, color: colors.text },
  formDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  formFields: { gap: spacing.lg, marginTop: spacing.xl },
  formRow: { flexDirection: 'row', gap: spacing.md },
  formHalf: { flex: 1 },
  formSubmit: { marginTop: spacing.xl },

  bottomGlass: { padding: spacing.sm },
  bottomBar: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    zIndex: 999,
  },
}));

const m = themedStyles(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    marginHorizontal: spacing.sm,
    maxHeight: SCREEN_H * 0.85,
  },
  sheetScroll: { maxHeight: SCREEN_H * 0.85 },
  sheetInner: {
    padding: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHeaderSpaced: { marginTop: spacing.lg },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  camBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    minHeight: layout.minTap,
    paddingVertical: spacing.md,
  },
  camBtnPressed: { backgroundColor: colors.border },
  libBtn: { marginTop: spacing.sm },
  camBtnText: { ...typography.label, fontWeight: '800', color: colors.text },
  thumbRow: { marginVertical: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.md, marginRight: spacing.sm },
  sigBox: {
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    marginTop: spacing.md,
  },
  clearSig: { alignSelf: 'flex-end', paddingVertical: spacing.sm },
  clearSigText: { ...typography.caption, fontWeight: '700', color: colors.brand },
  modalActions: { gap: spacing.md, marginTop: spacing.lg },
}));
