import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Profile Card */}
        <Card variant="elevated" borderRadius={28} padding={24} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase() || 'W'}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Field Technician'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'worker@metro-fix.com'}</Text>

          <View style={styles.roleTagContainer}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{user?.role || 'WORKER'} ACCOUNT</Text>
            </View>
          </View>

          {/* Rating & Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4.9 ★</Text>
              <Text style={styles.statLabel}>Internal Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>142</Text>
              <Text style={styles.statLabel}>Completed Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>99%</Text>
              <Text style={styles.statLabel}>On-Time Rate</Text>
            </View>
          </View>
        </Card>

        {/* Dispatch Settings */}
        <Text style={styles.sectionHeading}>DISPATCH & SYSTEM SETTINGS</Text>

        <Card variant="elevated" borderRadius={20} padding={16} style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📡 Telemetry GPS Auto-Sync</Text>
            <Text style={styles.settingValue}>ACTIVE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>⚡ Service Pillars</Text>
            <Text style={styles.settingValue}>HARD / SOFT</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🔐 Authentication Token</Text>
            <Text style={styles.settingValue}>JWT Bearer</Text>
          </View>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>🚪 LOGOUT & SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  roleTagContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  roleTag: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleTagText: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingsCard: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
