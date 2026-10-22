import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { NoticeBox } from '../../components/common/NoticeBox';
import { Colors, Spacing, BorderRadius } from '../../theme';

export const ActivityScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header
        title="Activity"
        subtitle="Riwayat aktivitas dan audit log sistem IoT."
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Honest Empty State Card */}
        <Card style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Aktivitas yang Tersedia</Text>
          <Text style={styles.emptySubtitle}>
            Layanan pencatatan riwayat aktivitas (audit log) saat ini belum diimplementasikan pada backend Flask.
          </Text>
        </Card>

        {/* Notice Info Box */}
        <NoticeBox
          message="Integrasi backend untuk log kejadian (riwayat penyiraman pompa, sinkronisasi sensor, dan perubahan threshold) ditandai sebagai pekerjaan lanjutan backend."
          style={styles.noticeBox}
        />

        {/* Planned Features Preview */}
        <Text style={styles.sectionHeader}>Rencana Fitur Pencatatan Log</Text>

        <Card style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.miniIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="water-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Riwayat Siklus Penyiraman</Text>
              <Text style={styles.featureDesc}>
                Mencatat waktu pompa aktif, durasi penyiraman, dan trigger otomatis berdasarkan kelembapan tanah.
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.miniIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="options-outline" size={18} color="#7C3AED" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Audit Perubahan Threshold</Text>
              <Text style={styles.featureDesc}>
                Mencatat kapan batas kelembapan atau suhu tanaman diperbarui oleh pengguna.
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.miniIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="wifi-outline" size={18} color="#059669" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Log Konektivitas ESP32</Text>
              <Text style={styles.featureDesc}>
                Mencatat waktu perangkat terhubung, terputus, atau mengalami kegagalan transmisi data.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  noticeBox: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureCard: {
    marginBottom: Spacing.sm + 2,
    padding: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  miniIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
