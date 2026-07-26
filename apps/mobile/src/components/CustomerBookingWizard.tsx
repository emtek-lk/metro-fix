import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ServicePillar, FacilityType, ServiceRequest } from '@metro-fix/core-types';
import { apiService } from '../services/api';
import { getCurrentWorkerLocation } from '../services/location';

interface CustomerBookingWizardProps {
  customerId: string;
  onBookingComplete: (job: ServiceRequest) => void;
}

export const CustomerBookingWizard: React.FC<CustomerBookingWizardProps> = ({
  customerId,
  onBookingComplete,
}) => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.kicker}>METRO-FIX CUSTOMER PORTAL</Text>
        <Text style={styles.title}>Book Maintenance Service</Text>
      </View>

      {/* Multi-step Progress Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
          <Text style={styles.stepDotNum}>1</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
          <Text style={styles.stepDotNum}>2</Text>
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
          <Text style={styles.stepDotNum}>3</Text>
        </View>
      </View>

      {/* STEP 1: SERVICE CATEGORY PILLAR */}
      {step === 1 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Step 1: Select Service Category</Text>
          <Text style={styles.stepSubtitle}>
            Choose the FM pillar matching your facility maintenance requirement.
          </Text>

          <TouchableOpacity
            style={[
              styles.pillarCard,
              servicePillar === ServicePillar.HARD && styles.pillarCardSelected,
            ]}
            onPress={() => setServicePillar(ServicePillar.HARD)}
            activeOpacity={0.8}
          >
            <Text style={styles.pillarIcon}>⚡</Text>
            <View style={styles.pillarInfo}>
              <Text style={styles.pillarTitle}>HARD FM</Text>
              <Text style={styles.pillarDesc}>
                HVAC, electrical, plumbing, mechanical & structural repairs
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillarCard,
              servicePillar === ServicePillar.SOFT && styles.pillarCardSelected,
            ]}
            onPress={() => setServicePillar(ServicePillar.SOFT)}
            activeOpacity={0.8}
          >
            <Text style={styles.pillarIcon}>🧹</Text>
            <View style={styles.pillarInfo}>
              <Text style={styles.pillarTitle}>SOFT FM</Text>
              <Text style={styles.pillarDesc}>
                Deep cleaning, sanitation, reception, groundskeeping & security
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillarCard,
              servicePillar === ServicePillar.STRATEGIC && styles.pillarCardSelected,
            ]}
            onPress={() => setServicePillar(ServicePillar.STRATEGIC)}
            activeOpacity={0.8}
          >
            <Text style={styles.pillarIcon}>📊</Text>
            <View style={styles.pillarInfo}>
              <Text style={styles.pillarTitle}>STRATEGIC FM</Text>
              <Text style={styles.pillarDesc}>
                Energy audits, compliance inspections & vendor governance
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep1}>
            <Text style={styles.nextBtnText}>CONTINUE TO LOCATION ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: LOCATION & FACILITY */}
      {step === 2 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Step 2: Location & Facility</Text>
          <Text style={styles.stepSubtitle}>
            Specify facility type and confirm GPS site location coordinates.
          </Text>

          <Text style={styles.inputLabel}>FACILITY TYPE</Text>
          <View style={styles.facilityRow}>
            {[
              FacilityType.RESIDENTIAL,
              FacilityType.COMMERCIAL,
              FacilityType.INDUSTRIAL,
            ].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.facilityChip,
                  facilityType === type && styles.facilityChipSelected,
                ]}
                onPress={() => setFacilityType(type)}
              >
                <Text
                  style={[
                    styles.facilityChipText,
                    facilityType === type && styles.facilityChipTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gpsBox}>
            <View style={styles.gpsHeader}>
              <Text style={styles.inputLabel}>SITE GPS COORDINATES</Text>
              <TouchableOpacity onPress={fetchGpsLocation} disabled={loadingGps}>
                {loadingGps ? (
                  <ActivityIndicator size="small" color="#f38808" />
                ) : (
                  <Text style={styles.gpsRefreshText}>📍 Detect GPS</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.coordInputsRow}>
              <View style={styles.coordInputCol}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <TextInput
                  style={styles.textInput}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                  placeholder="37.7749"
                  placeholderTextColor="#81b1b3"
                />
              </View>
              <View style={styles.coordInputCol}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <TextInput
                  style={styles.textInput}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                  placeholder="-122.4194"
                  placeholderTextColor="#81b1b3"
                />
              </View>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>⬅ BACK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleNextStep2}>
              <Text style={styles.nextBtnText}>CONTINUE TO DETAILS ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: DETAILS & URGENCY */}
      {step === 3 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Step 3: Job Details & Urgency</Text>
          <Text style={styles.stepSubtitle}>
            Describe the issue to help Customer Care dispatch the right technician.
          </Text>

          <Text style={styles.inputLabel}>ISSUE TITLE</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Roof HVAC Unit Pressure Fault"
            placeholderTextColor="#81b1b3"
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>DETAILED DESCRIPTION</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe symptoms, noise, or scope of maintenance needed..."
            placeholderTextColor="#81b1b3"
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>DISPATCH URGENCY LEVEL</Text>
          <View style={styles.urgencyGrid}>
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyChip,
                  urgency === level && styles.urgencyChipSelected,
                ]}
                onPress={() => setUrgency(level)}
              >
                <Text
                  style={[
                    styles.urgencyChipText,
                    urgency === level && styles.urgencyChipTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backBtnText}>⬅ BACK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextBtn, styles.submitBtn, { flex: 1 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextBtnText}>🚀 SUBMIT SERVICE REQUEST</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c2d40',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  kicker: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2b435f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#f38808',
    borderColor: '#f38808',
  },
  stepDotNum: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#f38808',
  },
  stepCard: {
    backgroundColor: '#2b435f',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: '#81b1b3',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillarCardSelected: {
    borderColor: '#f38808',
    backgroundColor: 'rgba(243, 136, 8, 0.12)',
  },
  pillarIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  pillarInfo: {
    flex: 1,
  },
  pillarTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  nextBtn: {
    backgroundColor: '#f38808',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: '#4aad83',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputLabel: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  facilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  facilityChip: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  facilityChipSelected: {
    backgroundColor: '#f38808',
    borderColor: '#f38808',
  },
  facilityChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
  },
  facilityChipTextSelected: {
    color: '#ffffff',
  },
  gpsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  gpsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gpsRefreshText: {
    color: '#f38808',
    fontSize: 12,
    fontWeight: '800',
  },
  coordInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInputCol: {
    flex: 1,
  },
  coordLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1c2d40',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtnText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '800',
    fontSize: 13,
  },
  urgencyGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  urgencyChip: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  urgencyChipSelected: {
    backgroundColor: '#e53e3e',
    borderColor: '#e53e3e',
  },
  urgencyChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '800',
  },
  urgencyChipTextSelected: {
    color: '#ffffff',
  },
});
