import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { ESPDevice, Sensor } from '../../types/models';
import { DeviceService } from '../../services/deviceService';
import { SensorService } from '../../services/sensorService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

type RouteProps = RouteProp<RootStackParamList, 'DeviceDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const DeviceDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { deviceId } = route.params;

  const [device, setDevice] = useState<ESPDevice | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const dev = await DeviceService.getDeviceById(deviceId);
      setDevice(dev);

      const sensorList = await SensorService.getSensors(deviceId);
      setSensors(sensorList);
      setLoading(false);
    })();
  }, [deviceId]);

  if (!device && !loading) {
    return (
      <View style={styles.container}>
        <Header title="Device details" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Device not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={device?.name || 'Device details'}
        subtitle={`${device?.model || 'ESP32'} Board Configuration`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Device Status & Metadata */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="hardware-chip-outline"
                size={24}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{device?.name}</Text>
              <Text style={styles.deviceLocation}>{device?.location || 'Home'}</Text>
            </View>
            <Badge
              label={
                device?.is_online
                  ? 'Online'
                  : device?.status === 'setup_draft'
                  ? 'Setup Draft'
                  : 'Offline'
              }
              variant={device?.is_online ? 'success' : 'default'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Hardware Model</Text>
            <Text style={styles.value}>{device?.model || 'ESP32'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>MAC Address</Text>
            <Text style={styles.valueMono}>{device?.mac_address}</Text>
          </View>

          {device?.ip_address && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>IP Address</Text>
              <Text style={styles.value}>{device?.ip_address}</Text>
            </View>
          )}

          {device?.wifi_ssid && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Configured Wi-Fi</Text>
              <Text style={styles.value}>{device?.wifi_ssid}</Text>
            </View>
          )}
        </Card>

        {/* Assigned Sensors Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assigned sensors</Text>
          <Button
            title="+ Add sensor"
            size="sm"
            variant="secondary"
            onPress={() => navigation.navigate('AddSensor', { deviceId })}
          />
        </View>

        {sensors.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="git-branch-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sensors assigned yet</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan sensor Soil Moisture, Temperature, Humidity, atau Light Intensity untuk perangkat ini.
            </Text>
            <Button
              title="Add first sensor"
              size="sm"
              onPress={() => navigation.navigate('AddSensor', { deviceId })}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : (
          sensors.map((s) => (
            <Card key={s.sensor_id} style={styles.sensorCard}>
              <View style={styles.sensorRow}>
                <View style={styles.sensorIconContainer}>
                  <Ionicons
                    name={
                      s.category === 'moisture' || s.sensor_type === 'soil_moisture'
                        ? 'water-outline'
                        : s.category === 'lux' || s.sensor_type === 'lux_value'
                        ? 'sunny-outline'
                        : s.category === 'humidity'
                        ? 'cloud-outline'
                        : 'thermometer-outline'
                    }
                    size={20}
                    color={Colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sensorName}>{s.sensor_name}</Text>
                  <Text style={styles.sensorType}>
                    Kategori: {s.category === 'moisture' ? 'Soil Moisture' : s.category === 'temperature' ? 'Temperature' : s.category === 'humidity' ? 'Humidity' : 'Light Intensity'}
                  </Text>
                </View>

                {s.latest_value != null && (
                  <Badge
                    label={`${s.latest_value} ${s.category === 'moisture' || s.sensor_type === 'soil_moisture' ? '%' : s.category === 'lux' || s.sensor_type === 'lux_value' ? 'Lux' : '°C'}`}
                    variant="mint"
                    size="sm"
                  />
                )}
              </View>
            </Card>
          ))
        )}
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
  card: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deviceLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  valueMono: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  sensorCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sensorIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sensorType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
