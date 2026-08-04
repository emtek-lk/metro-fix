import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Image, ImageBackground, Modal, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { ServiceRequest, JobStatus } from '@metro-fix/core-types';

import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
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

// --- Soft UI TextInput with orange focus border ---
const SoftInput: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric';
  multiline?: boolean; numberOfLines?: number;
}> = ({ label, value, onChangeText, placeholder, keyboardType, multiline, numberOfLines }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={si.label}>{label}</Text>
      <TextInput
        style={[si.input, multiline && si.area, focused && si.inputFocused]}
        placeholder={placeholder} placeholderTextColor="#64748B"
        keyboardType={keyboardType || 'default'}
        value={value} onChangeText={onChangeText}
        multiline={multiline} numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </View>
  );
};
const si = StyleSheet.create({
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0F172A', borderWidth: 1.5, borderColor: '#334155',
    borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14,
    color: '#F8FAFC', fontSize: 15,
  },
  inputFocused: { borderColor: '#F97316' },
  area: { borderRadius: 20, minHeight: 90, textAlignVertical: 'top', paddingTop: 14 },
});

export const JobDetail: React.FC<JobDetailProps> = ({ job: initialJob, workerId, onBack, onJobUpdated }) => {
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

  const statusColor = (s: JobStatus) => {
    if (s === JobStatus.ON_ROUTE) return '#3B82F6';
    if (s === JobStatus.INSPECTION) return '#8B5CF6';
    if (s === JobStatus.IN_PROGRESS) return '#F97316';
    if (s === JobStatus.COMPLETED) return '#10B981';
    return '#64748B';
  };

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
      <ScrollView contentContainerStyle={s.scroll} bounces={false}>
        {/* Hero banner */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80' }}
          style={s.hero}
        >
          <View style={s.heroOverlay}>
            <View style={s.navRow}>
              <IconButton symbol="‹" onPress={onBack} backgroundColor="rgba(255,255,255,0.9)" color="#0F172A" size={44} />
              <IconButton symbol="📍" onPress={() => {
                if (!currentJob.location) return Alert.alert('No Coordinates');
                openNativeNavigation({ latitude: currentJob.location.latitude, longitude: currentJob.location.longitude, label: currentJob.title });
              }} backgroundColor="rgba(255,255,255,0.9)" color="#0F172A" size={44} />
            </View>
            <View style={{ marginBottom: 44 }}>
              <View style={[s.badge, { backgroundColor: statusColor(currentJob.status) }]}>
                <Text style={s.badgeText}>{currentJob.status}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Overlapping sheet */}
        <View style={s.sheet}>
          <View style={s.pill} />
          <View style={s.titleRow}>
            <Text style={s.ticketId}>TICKET #{currentJob.id.slice(-6).toUpperCase()}</Text>
            <Text style={s.gps}>🛰️ {gpsStatus}</Text>
          </View>
          <Text style={s.jobTitle}>{currentJob.title}</Text>

          <Card variant="elevated" borderRadius={24} padding={18} style={{ marginBottom: 16 }}>
            <Text style={s.heading}>CUSTOMER & ADDRESS</Text>
            <Text style={s.custName}>👤 {(currentJob as any).customerName || `Customer #${currentJob.customerId}`}</Text>
            <Text style={s.loc}>📍 {(currentJob as any).address || (currentJob.location ? `${currentJob.location.latitude.toFixed(4)}, ${currentJob.location.longitude.toFixed(4)}` : 'Address Available')}</Text>
          </Card>

          <Card variant="elevated" borderRadius={24} padding={18} style={{ marginBottom: 16 }}>
            <Text style={s.heading}>SERVICE DESCRIPTION</Text>
            <Text style={s.desc}>{currentJob.description}</Text>
            <View style={s.metaRow}>
              <View style={s.chip}><Text style={s.chipText}>⚡ {currentJob.servicePillar}</Text></View>
              <View style={s.chip}><Text style={s.chipText}>🏢 {currentJob.facilityType}</Text></View>
            </View>
          </Card>

          {/* INSPECTION: Soft UI Quote Form */}
          {currentJob.status === JobStatus.INSPECTION && (
            <Card variant="elevated" borderRadius={24} padding={20} style={{ marginBottom: 16 }}>
              <Text style={s.formTitle}>📝 Inspection Quote</Text>
              <Text style={s.formDesc}>Provide cost estimate and labor hours</Text>
              <SoftInput label="Estimated Cost ($)" value={quoteCost} onChangeText={setQuoteCost} placeholder="e.g. 450.00" keyboardType="numeric" />
              <SoftInput label="Estimated Hours" value={quoteHours} onChangeText={setQuoteHours} placeholder="e.g. 2.5" keyboardType="numeric" />
              <SoftInput label="Notes" value={quoteNotes} onChangeText={setQuoteNotes} placeholder="Describe findings…" multiline numberOfLines={3} />
              <Button title="SUBMIT QUOTE → IN PROGRESS" onPress={handleQuote} isLoading={submitQuote.isPending} variant="primary" size="large" style={{ marginTop: 16 }} />
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        {lc && (
          <Button title={`${lc.text} →`} onPress={handleLifecycle} isLoading={updateStatus.isPending} variant="primary" size="large" />
        )}
        {currentJob.status === JobStatus.IN_PROGRESS && (
          <Button title="Complete Job →" onPress={() => setProofModalVisible(true)} variant="primary" size="large" />
        )}
        {currentJob.status === JobStatus.COMPLETED && (
          <Button title="✓ Ticket Completed" onPress={onBack} variant="secondary" size="large" />
        )}
      </View>

      {/* Proof of Work Bottom-Sheet Modal */}
      <Modal visible={proofModalVisible} animationType="slide" transparent>
        <View style={m.backdrop}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>📷 Work Completion Proof</Text>
            <Text style={m.subtitle}>Capture photos and collect customer signature</Text>

            {/* Camera Button */}
            <TouchableOpacity style={m.camBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
              <Text style={m.camBtnText}>📸 CAPTURE PHOTO</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <ScrollView horizontal style={{ marginVertical: 10 }}>
                {photos.map((uri, i) => <Image key={i} source={{ uri }} style={m.thumb} />)}
              </ScrollView>
            )}

            <Text style={[m.title, { marginTop: 16 }]}>✍️ Customer Signature</Text>
            <View style={m.sigBox}>
              <SignatureScreen
                ref={signatureRef}
                onOK={(sig: string) => setSignatureB64(sig)}
                webStyle={`.m-signature-pad{box-shadow:none;border:none;background-color:#0F172A}.m-signature-pad--body{border:none}.m-signature-pad--footer{display:none}`}
              />
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingBottom: 110 },
  hero: { height: 260, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', paddingHorizontal: 20, paddingTop: 16, justifyContent: 'space-between' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  sheet: { marginTop: -36, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#0F172A', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, minHeight: 500 },
  pill: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketId: { color: '#F97316', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  gps: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  jobTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', marginBottom: 20, lineHeight: 30 },
  heading: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  custName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  loc: { color: '#CBD5E1', fontSize: 14, fontWeight: '500' },
  desc: { color: '#E2E8F0', fontSize: 15, lineHeight: 22, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 10 },
  chip: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  formTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  formDesc: { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
  bottomBar: { position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 999 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: SCREEN_H * 0.85 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#475569', alignSelf: 'center', marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 16 },
  camBtn: { backgroundColor: '#334155', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  camBtnText: { color: '#F8FAFC', fontWeight: '800', fontSize: 14 },
  thumb: { width: 72, height: 72, borderRadius: 14, marginRight: 10 },
  sigBox: { height: 180, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#334155', marginVertical: 10 },
});
