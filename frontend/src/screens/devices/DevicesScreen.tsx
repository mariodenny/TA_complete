import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { ESPDevice } from '../../types/models';
import { DeviceService } from '../../services/deviceService';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { NoticeBox } from '../../components/common/NoticeBox';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DevicesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setSelectedDeviceId } = useApp();
  const [devices, setDevices] = useState<ESPDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDevices = async () => {
    try {
      const data = await DeviceService.getDevices();
      setDevices(data);
    } catch (e) {
      console.warn('Failed to load devices', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const draftCount = devices.filter((d) => d.status === 'setup_draft').length;

  return (
    <View style={styles.container}>
      <Header
        title="ESP devices"
        subtitle="Manage your boards and their sensors."
      >
        <Button
          title="+ Add new ESP device"
          onPress={() => navigation.navigate('AddDevice')}
          style={styles.addButton}
        />
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
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your devices</Text>
          {draftCount > 0 && (
            <Text style={styles.draftCounter}>{draftCount} setup drafts</Text>
          )}
        </View>

        {/* Device Cards */}
        {devices.map((device) => {
          const isDraft = device.status === 'setup_draft';
          const isOnline = device.is_online;

          return (
            <Card
              key={device.device_id}
              style={styles.deviceCard}
              onPress={() => {
                setSelectedDeviceId(device.device_id);
                navigation.navigate('DeviceDetail', { deviceId: device.device_id });
              }}
            >
              {/* Top row with Chip icon, titles, chevron */}
              <View style={styles.deviceTopRow}>
                <View style={styles.chipIconContainer}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceSubtitle}>
                    {device.model || 'ESP32'} - {isDraft ? 'Saved draft' : isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textMuted}
                />
              </View>

              {/* Status Badges Row */}
              <View style={styles.badgesRow}>
                <Badge
                  label={isOnline ? 'Online' : isDraft ? 'Not paired' : 'Offline'}
                  variant={isOnline ? 'success' : isDraft ? 'default' : 'error'}
                  size="sm"
                />
                <Badge
                  label={
                    device.sensors_count && device.sensors_count > 0
                      ? `${device.sensors_count} sensor${device.sensors_count > 1 ? 's' : ''}`
                      : 'No sensors assigned'
                  }
                  variant="outline"
                  size="sm"
                />
              </View>

              {/* Bottom Actions Row */}
              <View style={styles.deviceActionRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDeviceId(device.device_id);
                    navigation.navigate('DeviceDetail', { deviceId: device.device_id });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.completeSetupText}>
                    {isDraft ? 'Complete setup' : 'View details'}
                  </Text>
                </TouchableOpacity>

                <Button
                  title="+ Add sensor"
                  variant="subtle"
                  size="sm"
                  onPress={() => {
                    setSelectedDeviceId(device.device_id);
                    navigation.navigate('AddSensor', { deviceId: device.device_id });
                  }}
                  textStyle={styles.addSensorText}
                  style={styles.addSensorBtn}
                />
              </View>
            </Card>
          );
        })}

        {/* Notice Info Box */}
        <NoticeBox
          message="These are setup-drafts, not live devices. Pair a board to start receiving sensor readings."
          style={styles.noticeBox}
        />

        {/* Quick Link to Plants */}
        <Card
          style={styles.plantsLinkCard}
          onPress={() => navigation.navigate('Plants')}
        >
          <View style={styles.plantsLinkRow}>
            <View style={styles.plantsIconContainer}>
              <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.plantsLinkContent}>
              <Text style={styles.plantsLinkTitle}>Looking for your plants?</Text>
              <Text style={styles.plantsLinkSubtitle}>Open the Plants menu</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textMuted}
            />
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
  addButton: {
    borderRadius: BorderRadius.full,
    height: 44,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  draftCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deviceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  deviceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  deviceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  completeSetupText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  addSensorBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSensorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  noticeBox: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  plantsLinkCard: {
    padding: Spacing.md,
  },
  plantsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  plantsLinkContent: {
    flex: 1,
  },
  plantsLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  plantsLinkSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

