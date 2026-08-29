import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  Image, ImageBackground, Modal, Dimensions,
} from 'react-native';
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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { elevation } from '../theme/elevation';
import { PILLAR_ICON, FACILITY_ICON } from '../theme/status';
import { useJobDetail, useUpdateJobStatus, useSubmitQuote, useSubmitProof } from '../hooks/useJobs';
import { startWorkerBackgroundTracking, stopWorkerBackgroundTracking } from '../services/location';
import { openNativeNavigation } from '../services/linking';

const { height: SCREEN_H } = Dimensions.get('window');

export interface JobDetailProps {
  job: ServiceRequest;
  workerId: string;
  onBack: () => void;
  onJobUpdated?: (updatedJob: ServiceRequest) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job: initialJob, workerId, onBack, onJobUpdated }) => {
  const insets = useSafeAreaInsets();
  const { data: liveJob } = useJobDetail(initialJob.id);
  const currentJob = liveJob || initialJob;

  const updateStatus = useUpdateJobStatus();
  const submitQuote = useSubmitQuote();
  const submitProof = useSubmitProof();

  const [gpsStatus, setGpsStatus] = useState('Standby');
  const [quoteCost, setQuoteCost] = useState(currentJob.quoteAmount?.toString() || '');
  const [quoteHours, setQuoteHours] = useState(currentJob.estimatedHours?.toString() || '');
  const [quoteNotes, setQuoteNotes] = useState(currentJob.quoteNotes || '');

  // Proof modal state
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const signatureRef = useRef<any>(null);
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
      onJobUpdated?.(updated);
    } catch (e: any) { Alert.alert('Error', e.message || 'Could not update status.'); }
  };

  const handleQuote = async () => {
    const cost = parseFloat(quoteCost), hrs = parseFloat(quoteHours);
    if (isNaN(cost) || cost < 0) return Alert.alert('Invalid', 'Enter a valid cost.');
    if (isNaN(hrs) || hrs < 0) return Alert.alert('Invalid', 'Enter valid hours.');
    try {
      const updated = await submitQuote.mutateAsync({ jobId: currentJob.id, estimatedCost: cost, estimatedHours: hrs, notes: quoteNotes });
      onJobUpdated?.(updated);
      Alert.alert('Quote Submitted', 'Work transitioned to IN PROGRESS.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to submit quote.'); }
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission Required', 'Camera access needed.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        setPhotos(prev => [...prev, a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri]);
      }
    } catch (e: any) { Alert.alert('Camera Error', e.message); }
  };

  const handleProofSubmit = async () => {
    if (!signatureB64 || signatureB64.length < 10) {
      return Alert.alert('Signature Required', 'Complete the customer signature first.');
    }
    try {
      const updated = await submitProof.mutateAsync({ jobId: currentJob.id, signature: signatureB64, photos });
      onJobUpdated?.(updated);
      setProofModalVisible(false);
      Alert.alert('Proof Submitted', 'Ticket COMPLETED.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to submit proof.'); }
  };

  const lc = lifecycle(currentJob.status);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 96 + insets.bottom }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80' }}
          style={s.hero}
        >
          <View style={[s.heroOverlay, { paddingTop: spacing.md + insets.top }]}>
            <View style={s.navRow}>
              <IconButton
                onPress={onBack}
                icon={<Icon name="chevron-left" size={22} color={colors.textInverse} />}
                backgroundColor={colors.white}
                size={44}
              />
              <IconButton
                onPress={() => {
                  if (!currentJob.location) return Alert.alert('No Coordinates');
                  openNativeNavigation({ latitude: currentJob.location.latitude, longitude: currentJob.location.longitude, label: currentJob.title });
                }}
                icon={<Icon name="map-pin" size={19} color={colors.textInverse} />}
                backgroundColor={colors.white}
                size={44}
              />
            </View>
            <View style={s.heroFooter}>
              <StatusPill status={currentJob.status} />
            </View>
          </View>
        </ImageBackground>

        {/* Overlapping sheet */}
        <View style={s.sheet}>
          <View style={s.pill} />
          <View style={s.titleRow}>
            <Text style={s.ticketId}>TICKET #{currentJob.id.slice(-6).toUpperCase()}</Text>
            <View style={s.gpsRow}>
              <Icon name="radio" size={13} color={colors.textSecondary} />
              <Text style={s.gps}>{gpsStatus}</Text>
            </View>
          </View>
          <Text style={s.jobTitle}>{currentJob.title}</Text>

          <Card variant="elevated" borderRadius={radius.xl} padding={spacing.lg + 2} style={s.cardGap}>
            <Text style={s.heading}>Customer & address</Text>
            <View style={s.infoLine}>
              <Icon name="user" size={15} color={colors.textSecondary} />
              <Text style={s.custName}>
                {(currentJob as any).customerName || `Customer #${currentJob.customerId}`}
              </Text>
            </View>
            <View style={s.infoLine}>
              <Icon name="map-pin" size={15} color={colors.textMuted} />
              <Text style={s.loc}>
                {(currentJob as any).address || (currentJob.location ? `${currentJob.location.latitude.toFixed(4)}, ${currentJob.location.longitude.toFixed(4)}` : 'Address Available')}
              </Text>
            </View>
          </Card>

          <Card variant="elevated" borderRadius={radius.xl} padding={spacing.lg + 2} style={s.cardGap}>
            <Text style={s.heading}>Service description</Text>
            <Text style={s.desc}>{currentJob.description}</Text>
            <View style={s.metaRow}>
              <MetaChip
                icon={PILLAR_ICON[currentJob.servicePillar] ?? 'tool'}
                label={currentJob.servicePillar}
                tint={colors.brand}
              />
              <MetaChip
                icon={FACILITY_ICON[currentJob.facilityType] ?? 'home'}
                label={currentJob.facilityType}
              />
            </View>
          </Card>

          {/* INSPECTION: Soft UI Quote Form */}
          {currentJob.status === JobStatus.INSPECTION && (
            <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xl} style={s.cardGap}>
              <View style={s.formHeader}>
                <Icon name="edit-3" size={17} color={colors.brand} />
                <Text style={s.formTitle}>Inspection Quote</Text>
              </View>
              <Text style={s.formDesc}>Provide cost estimate and labor hours</Text>
              <View style={s.formFields}>
                <Input label="Estimated Cost ($)" value={quoteCost} onChangeText={setQuoteCost} placeholder="e.g. 450.00" keyboardType="numeric" />
                <Input label="Estimated Hours" value={quoteHours} onChangeText={setQuoteHours} placeholder="e.g. 2.5" keyboardType="numeric" />
                <Input label="Notes" value={quoteNotes} onChangeText={setQuoteNotes} placeholder="Describe findings…" multiline numberOfLines={3} />
              </View>
              <Button title="SUBMIT QUOTE → IN PROGRESS" onPress={handleQuote} isLoading={submitQuote.isPending} variant="primary" size="large" style={s.formSubmit} />
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { bottom: layout.tabBarInset + insets.bottom }]}>
        {lc && (
          <Button title={`${lc.text} →`} onPress={handleLifecycle} isLoading={updateStatus.isPending} variant="primary" size="large" />
        )}
        {currentJob.status === JobStatus.IN_PROGRESS && (
          <Button title="Complete Job →" onPress={() => setProofModalVisible(true)} variant="primary" size="large" />
        )}
        {currentJob.status === JobStatus.COMPLETED && (
          <Button title="Ticket Completed" onPress={onBack} variant="secondary" size="large" />
        )}
      </View>

      {/* Proof of Work Bottom-Sheet Modal */}
      <Modal visible={proofModalVisible} animationType="slide" transparent>
        <View style={m.backdrop}>
          <View style={[m.sheet, { paddingBottom: spacing.xxl + insets.bottom }]}>
            <View style={m.handle} />
            <View style={m.sectionHeader}>
              <Icon name="camera" size={17} color={colors.brand} />
              <Text style={m.title}>Work Completion Proof</Text>
            </View>
            <Text style={m.subtitle}>Capture photos and collect customer signature</Text>

            {/* Camera Button */}
            <Pressable
              style={({ pressed }) => [m.camBtn, pressed && m.camBtnPressed]}
              onPress={handleTakePhoto}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
            >
              <Icon name="camera" size={17} color={colors.text} />
              <Text style={m.camBtnText}>CAPTURE PHOTO</Text>
            </Pressable>

            {photos.length > 0 && (
              <ScrollView horizontal style={m.thumbRow} showsHorizontalScrollIndicator={false}>
                {photos.map((uri, i) => <Image key={i} source={{ uri }} style={m.thumb} />)}
              </ScrollView>
            )}

            <View style={[m.sectionHeader, m.sectionHeaderSpaced]}>
              <Icon name="edit-3" size={17} color={colors.brand} />
              <Text style={m.title}>Customer Signature</Text>
            </View>
            <View style={m.sigBox}>
              <SignatureScreen
                ref={signatureRef}
                onOK={(sig: string) => setSignatureB64(sig)}
                webStyle={`.m-signature-pad{box-shadow:none;border:none;background-color:${colors.bg}}.m-signature-pad--body{border:none}.m-signature-pad--footer{display:none}`}
              />
            </View>

            <View style={m.modalActions}>
              <Button title="SUBMIT PROOF → COMPLETE" onPress={handleProofSubmit} isLoading={submitProof.isPending} variant="primary" size="large" />
              <Button title="Cancel" onPress={() => setProofModalVisible(false)} variant="outline" size="medium" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {},
  hero: { height: 260, width: '100%' },
  heroOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'space-between',
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
  jobTitle: { ...typography.display, color: colors.text, marginBottom: spacing.xl },

  cardGap: { marginBottom: spacing.lg },
  heading: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.md },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  custName: { ...typography.h3, color: colors.text, flex: 1 },
  loc: { ...typography.body, color: colors.textSecondary, flex: 1 },
  desc: { ...typography.body, color: colors.text, marginBottom: spacing.lg },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  formTitle: { ...typography.h2, color: colors.text },
  formDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  formFields: { gap: spacing.lg, marginTop: spacing.lg },
  formSubmit: { marginTop: spacing.xl },

  bottomBar: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    zIndex: 999,
  },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    padding: spacing.xxl,
    maxHeight: SCREEN_H * 0.85,
    ...elevation.e3,
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
  camBtnText: { ...typography.label, fontWeight: '800', color: colors.text },
  thumbRow: { marginVertical: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.md, marginRight: spacing.sm },
  sigBox: {
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  modalActions: { gap: spacing.md, marginTop: spacing.lg },
});
