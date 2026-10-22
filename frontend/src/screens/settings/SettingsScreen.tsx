import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../types/navigation';
import { Plant, PlantThreshold } from '../../types/models';
import { PlantService } from '../../services/plantService';
import { ThresholdService } from '../../services/thresholdService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Select, SelectOption } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { NoticeBox } from '../../components/common/NoticeBox';
import { Badge } from '../../components/common/Badge';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';

type SettingsRouteProp = RouteProp<MainTabParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const route = useRoute<SettingsRouteProp>();
  const { selectedPlantId, setSelectedPlantId } = useApp();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [currentPlantId, setCurrentPlantId] = useState<number>(
    route.params?.plantId || selectedPlantId || 1
  );

  const [threshold, setThreshold] = useState<PlantThreshold | null>(null);
  const [moistureDry, setMoistureDry] = useState('');
  const [moistureWet, setMoistureWet] = useState('');
  const [tempCold, setTempCold] = useState('');
  const [tempWarm, setTempWarm] = useState('');
  const [tempHot, setTempHot] = useState('');
  const [lightMin, setLightMin] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await PlantService.getPlants();
      setPlants(list);
      if (list.length > 0 && !currentPlantId) {
        setCurrentPlantId(list[0].id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (currentPlantId) {
      loadThreshold(currentPlantId);
    }
  }, [currentPlantId]);

  const loadThreshold = async (plantId: number) => {
    const data = await ThresholdService.getThreshold(plantId);
    setThreshold(data);
    setMoistureDry(data.moisture_dry ? String(data.moisture_dry) : '');
    setMoistureWet(data.moisture_wet ? String(data.moisture_wet) : '');
    setTempCold(data.temp_cold ? String(data.temp_cold) : '');
    setTempWarm(data.temp_warm ? String(data.temp_warm) : '');
    setTempHot(data.temp_hot ? String(data.temp_hot) : '');
    setLightMin(data.lux_min ? String(data.lux_min) : '');
  };

  const plantOptions: SelectOption[] = plants.map((p) => ({
    label: p.name,
    value: p.id,
    subtitle: p.location,
    icon: 'leaf-outline',
  }));

  const validate = () => {
    if (moistureDry && moistureWet && Number(moistureDry) >= Number(moistureWet)) {
      Alert.alert('Validation Error', 'Dry threshold must be less than Wet threshold.');
      return false;
    }
    if (tempCold && tempWarm && Number(tempCold) >= Number(tempWarm)) {
      Alert.alert('Validation Error', 'Cold limit must be less than Warm threshold.');
      return false;
    }
    if (tempWarm && tempHot && Number(tempWarm) >= Number(tempHot)) {
      Alert.alert('Validation Error', 'Warm limit must be less than Too Hot threshold.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || !currentPlantId) return;

    setSaving(true);
    try {
      const res = await ThresholdService.saveThreshold(currentPlantId, {
        moisture_dry: moistureDry ? Number(moistureDry) : null,
        moisture_wet: moistureWet ? Number(moistureWet) : null,
        temp_cold: tempCold ? Number(tempCold) : null,
        temp_warm: tempWarm ? Number(tempWarm) : null,
        temp_hot: tempHot ? Number(tempHot) : null,
        lux_min: lightMin ? Number(lightMin) : null,
      });

      await loadThreshold(currentPlantId);
      Alert.alert('Success', res.message || 'Environmental thresholds saved!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save thresholds');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = threshold?.is_configured;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Settings"
        subtitle="Choose when your sensor colors change."
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Plant Selector */}
        <Card style={styles.plantSelectorCard}>
          <Text style={styles.selectorLabel}>Apply limits to</Text>
          <Select
            options={plantOptions}
            value={currentPlantId}
            onSelect={(id) => {
              setCurrentPlantId(id);
              setSelectedPlantId(id);
            }}
            placeholder="Select plant"
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Moisture Limits */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Moisture limits</Text>
            <Text style={styles.statusLabel}>
              {isConfigured && threshold?.moisture_dry ? 'Active' : 'Not set'}
            </Text>
          </View>

          {/* Dry below */}
          <View style={styles.limitRow}>
            <View style={styles.labelCol}>
              <View style={[styles.bullet, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.limitLabel}>Dry - below</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numInput}
                value={moistureDry}
                onChangeText={setMoistureDry}
                placeholder="--"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>%</Text>
            </View>
          </View>

          {/* Wet above */}
          <View style={styles.limitRow}>
            <View style={styles.labelCol}>
              <View style={[styles.bullet, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.limitLabel}>Wet - above</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numInput}
                value={moistureWet}
                onChangeText={setMoistureWet}
                placeholder="--"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>%</Text>
            </View>
          </View>

          {/* Normal guidance */}
          <View style={styles.guidanceRow}>
            <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
            <Text style={styles.guidanceText}>
              Normal - between the two limits
            </Text>
          </View>
        </Card>

        {/* Temperature Limits */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Temperature limits</Text>
            <Text style={styles.statusLabel}>
              {isConfigured && threshold?.temp_warm ? 'Active' : 'Not set'}
            </Text>
          </View>

          {/* Cold below */}
          <View style={styles.limitRow}>
            <View style={styles.labelCol}>
              <View style={[styles.bullet, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.limitLabel}>Cold - below</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numInput}
                value={tempCold}
                onChangeText={setTempCold}
                placeholder="--"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>°C</Text>
            </View>
          </View>

          {/* Warm from */}
          <View style={styles.limitRow}>
            <View style={styles.labelCol}>
              <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.limitLabel}>Warm - from</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numInput}
                value={tempWarm}
                onChangeText={setTempWarm}
                placeholder="--"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>°C</Text>
            </View>
          </View>

          {/* Too hot from */}
          <View style={styles.limitRow}>
            <View style={styles.labelCol}>
              <View style={[styles.bullet, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.limitLabel}>Too hot - from</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numInput}
                value={tempHot}
                onChangeText={setTempHot}
                placeholder="--"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>°C</Text>
            </View>
          </View>

          {/* Temperature guidance */}
          <View style={styles.guidanceRow}>
            <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
            <Text style={styles.guidanceText}>
              Normal - from cold limit to warm limit{'\n'}Set limits in order: cold {'<'} warm {'<'} too hot.
            </Text>
          </View>
        </Card>

        {/* Notice Info Box */}
        <NoticeBox
          message="No thresholds are configured. Readings stay unclassified until you set and save your limits."
          style={styles.noticeBox}
        />

        {/* Save Button */}
        <Button
          title="Save thresholds"
          onPress={handleSave}
          loading={saving}
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
  plantSelectorCard: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  limitLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: BorderRadius.md,
    height: 38,
    paddingHorizontal: Spacing.md,
    minWidth: 90,
    justifyContent: 'center',
  },
  numInput: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 40,
  },
  unitText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: 2,
  },
  guidanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  noticeBox: {
    marginVertical: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.full,
  },
});

