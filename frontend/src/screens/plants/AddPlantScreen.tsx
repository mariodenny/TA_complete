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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ESPDevice } from '../../types/models';
import { DeviceService } from '../../services/deviceService';
import { PlantService } from '../../services/plantService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select, SelectOption } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

export const AddPlantScreen: React.FC = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [devices, setDevices] = useState<ESPDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const devList = await DeviceService.getDevices();
      setDevices(devList);
    })();
  }, []);

  const deviceOptions: SelectOption[] = [
    { label: 'None (Assign later)', value: 0 },
    ...devices.map((d) => ({
      label: d.name,
      value: d.device_id,
      subtitle: `${d.model} (${d.status})`,
      icon: 'hardware-chip-outline' as const,
    })),
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Plant name is required';
    if (!location.trim()) errs.location = 'Location description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await PlantService.createPlant({
        name: name.trim(),
        location: location.trim(),
        device_id: deviceId && deviceId !== 0 ? deviceId : null,
      });

      Alert.alert('Plant Created', 'New plant profile added to your collection!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create plant profile');
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
        title="Add plant"
        subtitle="Create a new plant profile to track."
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Plant information</Text>
          </View>

          <Input
            label="Plant name"
            placeholder="e.g. Cabe Rawit Merah"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
          />

          <Input
            label="Location"
            placeholder="e.g. Taman Depan Pot #2"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              if (errors.location) setErrors({ ...errors, location: '' });
            }}
            error={errors.location}
          />

          <Select
            label="Assigned ESP Device (Optional)"
            placeholder="Select ESP board"
            value={deviceId}
            options={deviceOptions}
            onSelect={setDeviceId}
          />
        </Card>

        <Button
          title="Save plant"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
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
  card: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
  },
});

