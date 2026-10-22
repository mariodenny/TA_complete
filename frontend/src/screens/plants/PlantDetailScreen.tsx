import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { Plant, ESPDevice } from '../../types/models';
import { PlantService } from '../../services/plantService';
import { DeviceService } from '../../services/deviceService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MetricCard } from '../../components/common/MetricCard';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';

type RouteProps = RouteProp<RootStackParamList, 'PlantDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const PlantDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { setSelectedPlantId } = useApp();
  const { plantId } = route.params;

  const [plant, setPlant] = useState<Plant | null>(null);
  const [device, setDevice] = useState<ESPDevice | null>(null);

  useEffect(() => {
    (async () => {
      const p = await PlantService.getPlantById(plantId);
      setPlant(p);
      if (p?.device_id) {
        const d = await DeviceService.getDeviceById(p.device_id);
        setDevice(d);
      }
    })();
  }, [plantId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete ${plant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (plant) {
              await PlantService.deletePlant(plant.id);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={plant?.name || 'Plant details'}
        subtitle={plant?.location || 'Plant Profile'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Plant Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.plantRow}>
            <View style={styles.imageBox}>
              <Ionicons name="leaf" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plantName}>{plant?.name}</Text>
              <Text style={styles.plantLocation}>{plant?.location}</Text>
              <Text style={styles.deviceLinkText}>
                Linked Device: {device ? device.name : 'No ESP linked'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Current Environmental Readings */}
        <Text style={styles.sectionTitle}>Current readings</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Soil Moisture"
            value={plant?.soil_condition ?? null}
            unit="%"
            icon="water"
            color={Colors.moistureBlue}
          />
          <MetricCard
            label="Air Temperature"
            value={plant?.temp_c ?? null}
            unit="°C"
            icon="thermometer"
            color={Colors.temperatureRed}
          />
        </View>

        <View style={[styles.metricsGrid, { marginTop: Spacing.md }]}>
          <MetricCard
            label="Relative Humidity"
            value={plant?.humidity ?? null}
            unit="%"
            icon="cloud-outline"
            color="#0284C7"
          />
          <MetricCard
            label="Light Intensity"
            value={plant?.lux_value ?? null}
            unit="Lux"
            icon="sunny"
            color={Colors.lightYellow}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title="Configure thresholds"
            variant="primary"
            icon="options-outline"
            onPress={() => {
              if (plant) {
                setSelectedPlantId(plant.id);
                navigation.navigate('MainTabs', {
                  screen: 'Settings',
                  params: { plantId: plant.id },
                } as any);
              }
            }}
            style={styles.actionBtn}
          />

          <Button
            title="Delete plant profile"
            variant="outline"
            onPress={handleDelete}
            style={[styles.actionBtn, { borderColor: Colors.error }]}
            textStyle={{ color: Colors.error }}
          />
        </View>
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
  overviewCard: {
    marginBottom: Spacing.lg,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plantLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deviceLinkText: {
    fontSize: 12,
    color: Colors.primaryDark,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionSection: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
  },
});

