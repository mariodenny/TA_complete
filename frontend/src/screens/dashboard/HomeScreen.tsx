import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { Plant, ESPDevice, PlantThreshold } from '../../types/models';
import { PlantService } from '../../services/plantService';
import { DeviceService } from '../../services/deviceService';
import { ThresholdService } from '../../services/thresholdService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select, SelectOption } from '../../components/common/Select';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RealtimeService } from '../../services/socketService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isMockMode, apiUrl, selectedDeviceId, setSelectedDeviceId } = useApp();

  const [devices, setDevices] = useState<ESPDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<ESPDevice | null>(null);
  const [linkedPlant, setLinkedPlant] = useState<Plant | null>(null);
  const [threshold, setThreshold] = useState<PlantThreshold | null>(null);
  const [pumpOn, setPumpOn] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    try {
      // 1. Fetch all devices
      const devList = await DeviceService.getDevices();
      setDevices(devList);

      if (devList.length === 0) {
        setCurrentDevice(null);
        setLinkedPlant(null);
        setThreshold(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Determine active device
      let activeDev = devList.find((d) => d.device_id === selectedDeviceId);
      if (!activeDev) {
        activeDev = devList[0];
        setSelectedDeviceId(activeDev.device_id);
      }
      setCurrentDevice(activeDev);

      // 3. Find plant linked to this active device
      const allPlants = await PlantService.getPlants();
      const plant = allPlants.find((p) => p.device_id === activeDev?.device_id) || null;
      setLinkedPlant(plant);
      setImageError(false);

      // 4. Fetch threshold if plant exists
      if (plant) {
        const th = await ThresholdService.getThreshold(plant.id);
        setThreshold(th);
      } else {
        setThreshold(null);
      }

      setLastUpdate(new Date());
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [selectedDeviceId])
  );

  // Real-time socket stream
  useEffect(() => {
    RealtimeService.connect();

    const unsubReading = RealtimeService.on('sensor_data', (data) => {
      if (data && currentDevice?.is_online) {
        setLinkedPlant((prev) =>
          prev
            ? {
                ...prev,
                soil_condition: data.soil_condition ?? prev.soil_condition,
                temp_c: data.temp_c ?? prev.temp_c,
                humidity: data.humidity ?? prev.humidity,
                lux_value: data.lux_value ?? prev.lux_value,
              }
            : null
        );
        setLastUpdate(new Date());
      }
    });

    const unsubPump = RealtimeService.on('pump_status', (data) => {
      if (typeof data?.active === 'boolean') {
        setPumpOn(data.active);
      }
    });

    return () => {
      unsubReading();
      unsubPump();
    };
  }, [currentDevice?.device_id, currentDevice?.is_online]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const deviceOptions: SelectOption[] = devices.map((d) => ({
    label: d.name,
    value: d.device_id,
    subtitle: `${d.model || 'ESP32'} • ${d.is_online ? 'Online' : d.status === 'setup_draft' ? 'Belum terhubung' : 'Offline'}`,
    icon: 'hardware-chip-outline',
  }));

  // Resolve plant image URL safely
  const getFullImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanBase = apiUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  };

  const imageUrl = getFullImageUrl(linkedPlant?.image_url);

  // Status against thresholds
  const getMoistureStatus = (val?: number | null): string => {
    if (val == null) return 'Tidak ada data';
    if (!threshold?.is_configured) return 'Belum diatur';
    if (threshold.moisture_dry && val < threshold.moisture_dry) return '⚠️ Kering';
    if (threshold.moisture_wet && val > threshold.moisture_wet) return '💧 Basah';
    return '✓ Optimal';
  };

  const getTempStatus = (val?: number | null): string => {
    if (val == null) return 'Tidak ada data';
    if (!threshold?.is_configured) return 'Belum diatur';
    if (threshold.temp_cold && val < threshold.temp_cold) return '❄️ Dingin';
    if (threshold.temp_hot && val > threshold.temp_hot) return '🔥 Terlalu panas';
    return '✓ Normal';
  };

  const isDeviceOffline = !currentDevice?.is_online;

  return (
    <View style={styles.container}>
      <Header
        title="Smart Pot"
        subtitle="Sistem pemantauan & irigasi otomatis."
      >
        {devices.length > 0 && (
          <Select
            options={deviceOptions}
            value={currentDevice?.device_id || null}
            onSelect={(val) => setSelectedDeviceId(val)}
            placeholder="Pilih perangkat ESP32"
            containerStyle={styles.deviceSelectHeader}
          />
        )}
      </Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Mode Tag */}
        <View style={styles.topMetaRow}>
          <Badge
            label={isMockMode ? '🧪 Mode Mock (Demo)' : '🌐 Backend Flask Aktif'}
            variant={isMockMode ? 'warning' : 'success'}
            size="sm"
          />
          {lastUpdate && (
            <Text style={styles.timestampText}>
              Pembaruan: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Empty State when no devices */}
        {devices.length === 0 && !loading ? (
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="hardware-chip-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Perangkat ESP32</Text>
            <Text style={styles.emptySubtitle}>
              Tambahkan board ESP32 Anda terlebih dahulu untuk menghubungkan sensor dan tanaman.
            </Text>
            <Button
              title="+ Tambah ESP Device"
              onPress={() => navigation.navigate('AddDevice')}
              style={styles.emptyActionBtn}
            />
          </Card>
        ) : (
          <>
            {/* Context Hero Card: Identitas Device & Tanaman */}
            <Card style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                {/* Plant Image or Placeholder */}
                <View style={styles.imageWrapper}>
                  {imageUrl && !imageError ? (
                    <>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.plantImage}
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                      {imageLoading && (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                          style={styles.imageLoader}
                        />
                      )}
                    </>
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Ionicons name="leaf" size={28} color={Colors.primary} />
                    </View>
                  )}
                </View>

                {/* Plant & Device Names */}
                <View style={styles.heroInfo}>
                  <Text style={styles.plantNameText}>
                    {linkedPlant ? linkedPlant.name : 'Tanaman Belum Ditautkan'}
                  </Text>
                  <Text style={styles.plantLocationText}>
                    {linkedPlant ? linkedPlant.location : 'Belum ada profil tanaman'}
                  </Text>

                  <View style={styles.deviceMetaBadgeRow}>
                    <Ionicons name="hardware-chip-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.deviceNameMeta}>{currentDevice?.name}</Text>
                  </View>
                </View>

                {/* Connection Status Badge */}
                <Badge
                  label={
                    currentDevice?.is_online
                      ? 'Online'
                      : currentDevice?.status === 'setup_draft'
                      ? 'Draft'
                      : 'Offline'
                  }
                  variant={
                    currentDevice?.is_online
                      ? 'success'
                      : currentDevice?.status === 'setup_draft'
                      ? 'default'
                      : 'error'
                  }
                  size="sm"
                />
              </View>

              {/* Offline Warning Banner */}
              {isDeviceOffline && (
                <View style={styles.offlineNotice}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
                  <Text style={styles.offlineNoticeText}>
                    ESP32 offline. Menampilkan data tersimpan terakhir, bukan data waktu nyata.
                  </Text>
                </View>
              )}

              {/* Sensor Summary Bar */}
              <View style={styles.sensorSummaryRow}>
                <Text style={styles.sensorCountText}>
                  Sensor terpasang: {currentDevice?.sensors_count || 0}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (currentDevice) {
                      navigation.navigate('AddSensor', { deviceId: currentDevice.device_id });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addSensorLink}>+ Tambah Sensor</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Metric Cards 2x2 Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Soil Moisture"
                  value={linkedPlant?.soil_condition ?? null}
                  unit="%"
                  icon="water"
                  color={Colors.moistureBlue}
                  subtitle={getMoistureStatus(linkedPlant?.soil_condition)}
                  isStale={isDeviceOffline}
                />
                <MetricCard
                  label="Temperature"
                  value={linkedPlant?.temp_c ?? null}
                  unit="°C"
                  icon="thermometer"
                  color={Colors.temperatureRed}
                  subtitle={getTempStatus(linkedPlant?.temp_c)}
                  isStale={isDeviceOffline}
                />
              </View>

              <View style={styles.metricsRow}>
                <MetricCard
                  label="Humidity"
                  value={linkedPlant?.humidity ?? null}
                  unit="%"
                  icon="cloud-outline"
                  color="#0284C7"
                  subtitle="Kelembapan udara"
                  isStale={isDeviceOffline}
                />
                <MetricCard
                  label="Light Intensity"
                  value={linkedPlant?.lux_value ?? null}
                  unit="Lux"
                  icon="sunny"
                  color={Colors.lightYellow}
                  subtitle="Intensitas cahaya"
                  isStale={isDeviceOffline}
                />
              </View>
            </View>

            {/* Water Pump Status Card */}
            <Card style={styles.pumpCard}>
              <View style={styles.pumpHeaderRow}>
                <View style={styles.pumpTitleContainer}>
                  <View
                    style={[
                      styles.pumpIconBadge,
                      { backgroundColor: pumpOn ? Colors.primary : '#EAEFEA' },
                    ]}
                  >
                    <Ionicons
                      name="water"
                      size={20}
                      color={pumpOn ? Colors.textWhite : Colors.textSecondary}
                    />
                  </View>
                  <View>
                    <Text style={styles.pumpCardTitle}>Pompa Irigasi Air</Text>
                    <Text style={styles.pumpCardSubtitle}>
                      Status terkonfirmasi: {pumpOn ? 'Menyiram' : 'Standby / Mati'}
                    </Text>
                  </View>
                </View>

                <Badge
                  label={threshold?.auto_mode !== false ? 'Otomatis' : 'Manual'}
                  variant="mint"
                  size="sm"
                />
              </View>

              <View style={styles.safetyNotice}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
                <Text style={styles.safetyText}>
                  Pengaman lokal ESP32 aktif: durasi pompa otomatis dibatasi maksimal 60 detik per siklus.
                </Text>
              </View>
            </Card>

            {/* Navigation Shortcuts */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => {
                  if (linkedPlant) {
                    navigation.navigate('MainTabs', {
                      screen: 'Settings',
                      params: { plantId: linkedPlant.id },
                    } as any);
                  } else {
                    navigation.navigate('MainTabs', { screen: 'Settings' } as any);
                  }
                }}
              >
                <Ionicons name="options-outline" size={18} color={Colors.primary} />
                <Text style={styles.shortcutText}>Atur Threshold</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => navigation.navigate('Plants')}
              >
                <Ionicons name="leaf-outline" size={18} color={Colors.primary} />
                <Text style={styles.shortcutText}>Kelola Tanaman</Text>
              </TouchableOpacity>
            </View>
          </>
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
  deviceSelectHeader: {
    marginBottom: 0,
    marginTop: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  emptyActionBtn: {
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  heroCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageWrapper: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLoader: {
    position: 'absolute',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  plantNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plantLocationText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deviceMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  deviceNameMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 6,
    marginTop: Spacing.md,
  },
  offlineNoticeText: {
    fontSize: 11.5,
    color: '#8A6115',
    flex: 1,
  },
  sensorSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  sensorCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addSensorLink: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  metricsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pumpCard: {
    marginBottom: Spacing.md,
  },
  pumpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  pumpTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pumpIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pumpCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pumpCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMintLight,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  safetyText: {
    fontSize: 11.5,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs + 2,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
