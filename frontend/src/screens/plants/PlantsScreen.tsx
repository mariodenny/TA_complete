import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { Plant } from '../../types/models';
import { PlantService } from '../../services/plantService';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PlantsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setSelectedPlantId } = useApp();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadPlants = async () => {
    try {
      const list = await PlantService.getPlants();
      setPlants(list);
    } catch (e) {
      console.warn('Failed to load plants', e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const filteredPlants = plants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header
        title="Plants"
        subtitle="Your plant collection, all in one place."
      />

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
        {/* Search Row & Add Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={18}
              color={Colors.textSecondary}
              style={{ marginRight: Spacing.sm }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plants"
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddPlant')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All plants</Text>
          <Text style={styles.plantCount}>{filteredPlants.length} plants</Text>
        </View>

        {/* Plant Cards */}
        {filteredPlants.map((plant) => (
          <Card
            key={plant.id}
            style={styles.plantCard}
            onPress={() => {
              setSelectedPlantId(plant.id);
              navigation.navigate('PlantDetail', { plantId: plant.id });
            }}
          >
            {/* Top row */}
            <View style={styles.plantHeaderRow}>
              <View style={styles.plantImageContainer}>
                <Ionicons name="leaf" size={24} color={Colors.primary} />
              </View>

              <View style={styles.plantInfo}>
                <Text style={styles.plantName}>{plant.name}</Text>
                <Text style={styles.plantSubtitle}>
                  {plant.location || 'Sensor readings'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textMuted}
              />
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              {/* Temp */}
              <View style={styles.metricItem}>
                <Ionicons
                  name="thermometer-outline"
                  size={15}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metricLabel}>Temp</Text>
                <Text style={styles.metricValue}>
                  {plant.temp_c !== null && plant.temp_c !== undefined
                    ? `${plant.temp_c}°C`
                    : '--'}
                </Text>
              </View>

              {/* Moisture */}
              <View style={styles.metricItem}>
                <Ionicons
                  name="water-outline"
                  size={15}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metricLabel}>Moisture</Text>
                <Text style={styles.metricValue}>
                  {plant.soil_condition !== null && plant.soil_condition !== undefined
                    ? `${plant.soil_condition}%`
                    : '--'}
                </Text>
              </View>

              {/* Light */}
              <View style={styles.metricItem}>
                <Ionicons
                  name="sunny-outline"
                  size={15}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metricLabel}>Light</Text>
                <Text style={styles.metricValue}>
                  {plant.lux_value !== null && plant.lux_value !== undefined
                    ? `${plant.lux_value.toLocaleString()} Lux`
                    : '--'}
                </Text>
              </View>
            </View>
          </Card>
        ))}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plantCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  plantCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md + 2,
  },
  plantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantImageContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plantSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

