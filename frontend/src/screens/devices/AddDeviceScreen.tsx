import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select, SelectOption } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { NoticeBox } from '../../components/common/NoticeBox';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { DeviceService } from '../../services/deviceService';

const BOARD_MODELS: SelectOption[] = [
  { label: 'ESP32 (Standard DevKit)', value: 'ESP32', subtitle: 'Dual-core, Wi-Fi & Bluetooth' },
  { label: 'ESP8266 (NodeMCU / D1 Mini)', value: 'ESP8266', subtitle: 'Single-core 80MHz, Wi-Fi' },
  { label: 'ESP32-S3', value: 'ESP32-S3', subtitle: 'Dual-core Xtensa LX7' },
  { label: 'ESP32-C3 (RISC-V)', value: 'ESP32-C3', subtitle: 'Single-core RISC-V 160MHz' },
];

export const AddDeviceScreen: React.FC = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [model, setModel] = useState<string>('ESP32');
  const [macAddress, setMacAddress] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Device name is required';
    }
    if (!model) {
      errs.model = 'Please select a board model';
    }
    if (!macAddress.trim()) {
      errs.macAddress = 'Device ID / MAC address is required';
    } else if (macAddress.trim().length < 6) {
      errs.macAddress = 'Please enter a valid MAC address or Board ID';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await DeviceService.createDevice({
        name: name.trim(),
        model: model,
        mac_address: macAddress.trim(),
        wifi_ssid: wifiSsid.trim() || undefined,
        wifi_password: wifiPassword || undefined,
      });

      Alert.alert(
        'Setup Draft Saved',
        'Device created as setup draft. You can now assign sensors to this board.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save device');
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
        title="Add ESP device"
        subtitle="Give your board a name and connection details."
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1: Device Identity */}
        <Card style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={Colors.primary}
              style={styles.cardIcon}
            />
            <Text style={styles.cardSectionTitle}>Device identity</Text>
          </View>

          <Input
            label="Device name"
            placeholder="e.g. Front garden ESP"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
          />

          <Select
            label="Board model"
            placeholder="Select ESP32 or ESP8266"
            value={model}
            options={BOARD_MODELS}
            onSelect={(val) => {
              setModel(val);
              if (errors.model) setErrors({ ...errors, model: '' });
            }}
            error={errors.model}
          />

          <Input
            label="Device ID / MAC address"
            placeholder="Enter the ID shown on your board"
            value={macAddress}
            onChangeText={(text) => {
              setMacAddress(text);
              if (errors.macAddress) setErrors({ ...errors, macAddress: '' });
            }}
            error={errors.macAddress}
            autoCapitalize="characters"
          />
        </Card>

        {/* Card 2: Wi-Fi Connection */}
        <Card style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="wifi-outline"
              size={18}
              color={Colors.primary}
              style={styles.cardIcon}
            />
            <Text style={styles.cardSectionTitle}>Wi-Fi connection</Text>
          </View>

          <Input
            label="Network name (SSID)"
            placeholder="Enter your 2.4 GHz Wi-Fi name"
            value={wifiSsid}
            onChangeText={setWifiSsid}
            rightIcon="wifi"
          />

          <Input
            label="Wi-Fi password"
            placeholder="Enter network password"
            value={wifiPassword}
            onChangeText={setWifiPassword}
            isPassword
            hint="Use the same network as your ESP board."
          />
        </Card>

        {/* Notice Info Box */}
        <NoticeBox
          message="Saving creates a setup draft. Connection is not verified until your board is paired."
          style={styles.noticeBox}
        />

        {/* Save Button */}
        <Button
          title="Save device"
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    marginRight: Spacing.sm,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
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

