import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { RealtimeService } from '../../services/socketService';
import { ApiClient } from '../../services/apiClient';

export const ProfileScreen: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { isMockMode, setIsMockMode, apiUrl, updateApiUrl } = useApp();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [editingUrl, setEditingUrl] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSaveUrl = async () => {
    if (!inputUrl.trim()) return;
    await updateApiUrl(inputUrl.trim());
    setEditingUrl(false);
    Alert.alert('Pengaturan Disimpan', `Alamat Backend URL diubah ke:\n${inputUrl.trim()}`);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await ApiClient.get('/');
      Alert.alert('Koneksi Berhasil', `Server merespons: "${typeof res === 'string' ? res : '200 OK'}"`);
    } catch (err: any) {
      Alert.alert(
        'Koneksi Gagal',
        `Tidak dapat terhubung ke ${apiUrl}.\n\nError: ${err.message}\n\nPastikan Flask backend berjalan dan port 5700 dapat diakses.`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleMock = async (val: boolean) => {
    await setIsMockMode(val);
    if (!val) {
      RealtimeService.connect();
    } else {
      RealtimeService.disconnect();
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pengaturan & Profil"
        subtitle="Kelola koneksi server, mode pengujian, dan akun."
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user ? user.username : 'Pengguna Smart Pot'}
              </Text>
              <Text style={styles.userEmail}>
                {user ? user.email : 'user@smartpot.local'}
              </Text>
            </View>
            <Badge
              label={token ? 'Terautentikasi' : 'Belum Login'}
              variant={token ? 'success' : 'default'}
              size="sm"
            />
          </View>
        </Card>

        {/* Development & Mock Mode */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Mode API & Pengujian</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.settingTitle}>Gunakan Data Mock</Text>
              <Text style={styles.settingDesc}>
                Aktifkan jika backend Flask belum aktif atau sedang menjalankan demo mandiri offline.
              </Text>
            </View>
            <Switch
              value={isMockMode}
              onValueChange={handleToggleMock}
              trackColor={{ false: '#D4DDD5', true: Colors.primaryLight }}
              thumbColor={isMockMode ? Colors.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Backend API URL */}
          <View style={styles.apiUrlSection}>
            <View style={styles.apiUrlHeader}>
              <Text style={styles.settingTitle}>Alamat Server Flask (Base URL)</Text>
              <TouchableOpacity
                onPress={() => setEditingUrl(!editingUrl)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.editLink}>
                  {editingUrl ? 'Batal' : 'Ubah URL'}
                </Text>
              </TouchableOpacity>
            </View>

            {editingUrl ? (
              <View style={styles.urlInputRow}>
                <Input
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  placeholder="http://192.168.1.X:5700"
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  autoCapitalize="none"
                />
                <Button
                  title="Simpan"
                  size="sm"
                  onPress={handleSaveUrl}
                  style={{ height: 46 }}
                />
              </View>
            ) : (
              <Text style={styles.currentUrlText}>{apiUrl}</Text>
            )}

            <View style={styles.testBtnRow}>
              <Button
                title="Uji Koneksi Server"
                variant="subtle"
                size="sm"
                icon="flash-outline"
                loading={testingConnection}
                onPress={handleTestConnection}
                style={styles.testBtn}
              />
            </View>

            <Text style={styles.urlTip}>
              • Android Emulator: gunakan http://10.0.2.2:5700{'\n'}
              • HP Fisik: gunakan IP LAN komputer (cth. http://192.168.1.15:5700)
            </Text>
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Informasi Aplikasi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi Aplikasi</Text>
            <Text style={styles.infoValue}>1.0.0 (Expo SDK 58)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Socket Real-time</Text>
            <Text style={styles.infoValue}>
              {RealtimeService.isConnected() ? 'Terkoneksi' : isMockMode ? 'Mode Mock' : 'Standby'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Perangkat</Text>
            <Text style={styles.infoValue}>ESP32 IoT Controller</Text>
          </View>
        </Card>

        {/* Auth Action */}
        <Button
          title="Keluar dari Akun (Logout)"
          variant="outline"
          icon="log-out-outline"
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={{ color: Colors.error }}
        />
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
  sectionCard: {
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  apiUrlSection: {
    marginTop: Spacing.xs,
  },
  apiUrlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  editLink: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  currentUrlText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: Colors.borderInput,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  testBtnRow: {
    marginTop: Spacing.sm,
  },
  testBtn: {
    height: 38,
    borderRadius: BorderRadius.md,
  },
  urlTip: {
    fontSize: 11.5,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logoutButton: {
    marginTop: Spacing.md,
    borderColor: Colors.error,
  },
});
