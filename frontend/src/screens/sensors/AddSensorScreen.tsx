import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { ESPDevice, SensorCategory } from '../../types/models';
import { DeviceService } from '../../services/deviceService';
import { SensorService } from '../../services/sensorService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select, SelectOption } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { NoticeBox } from '../../components/common/NoticeBox';
import { Colors, Spacing, BorderRadius } from '../../theme';

type RouteProps = RouteProp<RootStackParamList, 'AddSensor'>;

// Exactly 4 main sensor categories
const SENSOR_CATEGORIES: SelectOption[] = [
  {
    label: 'Soil Moisture',
    value: 'moisture',
    subtitle: 'Memantau tingkat kelembapan tanah tanaman',
  },
  {
    label: 'Temperature',
    value: 'temperature',
    subtitle: 'Memantau suhu udara di sekitar pot tanaman',
  },
  {
    label: 'Humidity',
    value: 'humidity',
    subtitle: 'Memantau kelembapan relatif udara',
  },
  {
    label: 'Light Intensity',
    value: 'lux',
    subtitle: 'Memantau intensitas cahaya dalam satuan lux',
  },
];

export const AddSensorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();

  const [devices, setDevices] = useState<ESPDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(
    route.params?.deviceId || null
  );
  const [sensorName, setSensorName] = useState('');
  const [category, setCategory] = useState<SensorCategory>('moisture');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const devList = await DeviceService.getDevices();
      setDevices(devList);
      if (!selectedDeviceId && devList.length > 0) {
        setSelectedDeviceId(devList[0].device_id);
      }
    })();
  }, []);

  const deviceOptions: SelectOption[] = devices.map((d) => ({
    label: d.name,
    value: d.device_id,
    subtitle: `${d.model || 'ESP32'} - ${d.status === 'setup_draft' ? 'Draft' : d.is_online ? 'Online' : 'Offline'}`,
    icon: 'hardware-chip-outline',
  }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedDeviceId) {
      errs.device = 'Pilih perangkat ESP32 induk';
    }
    if (!sensorName.trim()) {
      errs.name = 'Nama sensor wajib diisi';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !selectedDeviceId) return;

    setLoading(true);
    try {
      await SensorService.createSensor({
        device_id: selectedDeviceId,
        sensor_name: sensorName.trim(),
        category: category,
      });

      Alert.alert('Sensor Ditambahkan', 'Sensor berhasil ditautkan ke perangkat ESP32!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Menambahkan Sensor', err.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Add sensor"
        subtitle="Choose the ESP board this sensor belongs to."
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1: Assign to ESP Device */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeaderTitle}>Assign to ESP device</Text>

          <Select
            placeholder="Pilih perangkat ESP"
            value={selectedDeviceId}
            options={deviceOptions}
            onSelect={(val) => {
              setSelectedDeviceId(val);
              if (errors.device) setErrors({ ...errors, device: '' });
            }}
            error={errors.device}
          />

          <Text style={styles.helperSubtext}>
            Sensor ini akan disimpan di bawah konfigurasi board yang dipilih.
          </Text>
        </Card>

        {/* Card 2: Sensor Details */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeaderTitle}>Sensor details</Text>

          <Input
            label="Sensor name"
            placeholder="cth. Sensor Kelembapan Tanah 1"
            value={sensorName}
            onChangeText={(text) => {
              setSensorName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
          />

          <Select
            label="Sensor type"
            value={category}
            options={SENSOR_CATEGORIES}
            onSelect={(val) => setCategory(val as SensorCategory)}
          />
        </Card>

        {/* Notice Info Box */}
        <NoticeBox
          message="Pastikan ESP32 telah dipasangkan ke Wi-Fi agar pembacaan data sensor dapat diterima secara langsung."
          style={styles.noticeBox}
        />

        {/* Save Button */}
        <Button
          title="Save sensor"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  formCard: {
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  helperSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  noticeBox: {
    marginVertical: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.full,
  },
});
