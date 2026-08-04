import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface NotificationsScreenProps {
  onSimulateAlert: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onSimulateAlert }) => {
  const sampleNotifications = [
    {
      id: 'notif_1',
      title: '⚡ Priority Dispatch Alert',
      body: 'New Commercial HVAC ticket available 2.4 km away.',
      time: '10 mins ago',
      unread: true,
    },
    {
      id: 'notif_2',
      title: '✅ Quote Approved by Customer',
      body: 'Elevator Shaft Safety Inspection quote accepted. Work in progress.',
      time: '2 hours ago',
      unread: false,
    },
    {
      id: 'notif:3',
      title: '🛰️ GPS Telemetry Stream Active',
      body: 'Background location tracking enabled for assigned dispatch route.',
      time: 'Yesterday',
      unread: false,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Dispatch Alerts & Logs</Text>
          <Text style={styles.subtitle}>Real-time Push Notifications & System Audit Trail</Text>
        </View>

        <Card variant="elevated" borderRadius={24} padding={18} style={styles.testCard}>
          <Text style={styles.testTitle}>🧪 FCM Push Test Control</Text>
          <Text style={styles.testDesc}>
            Trigger a simulated dispatch alert modal to verify worker acceptance flow.
          </Text>
          <Button
            title="TEST DISPATCH ALERT"
            onPress={onSimulateAlert}
            variant="primary"
            size="medium"
            style={{ marginTop: 10 }}
          />
        </Card>

        <Text style={styles.sectionHeading}>RECENT NOTIFICATIONS</Text>

        {sampleNotifications.map((n) => (
          <Card key={n.id} variant="elevated" borderRadius={20} padding={16} style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              {n.unread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifBody}>{n.body}</Text>
            <Text style={styles.notifTime}>{n.time}</Text>
          </Card>
        ))}
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
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  testCard: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  testTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  testDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  notifCard: {
    marginBottom: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  notifBody: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifTime: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
});
