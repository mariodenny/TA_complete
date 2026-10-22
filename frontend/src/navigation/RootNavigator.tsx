import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../theme';

import { TabNavigator } from './TabNavigator';
import { AddDeviceScreen } from '../screens/devices/AddDeviceScreen';
import { DeviceDetailScreen } from '../screens/devices/DeviceDetailScreen';
import { AddSensorScreen } from '../screens/sensors/AddSensorScreen';
import { PlantsScreen } from '../screens/plants/PlantsScreen';
import { AddPlantScreen } from '../screens/plants/AddPlantScreen';
import { PlantDetailScreen } from '../screens/plants/PlantDetailScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="leaf" size={44} color={Colors.primary} />
      </View>
      <Text style={styles.splashTitle}>Smart Pot</Text>
      <Text style={styles.splashSubtitle}>Memeriksa status sesi...</Text>
      <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.lg }} />
    </View>
  );
}

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack: Login & Register only
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main Protected App Stack
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="AddDevice" component={AddDeviceScreen} />
            <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
            <Stack.Screen name="AddSensor" component={AddSensorScreen} />
            <Stack.Screen name="Plants" component={PlantsScreen} />
            <Stack.Screen name="AddPlant" component={AddPlantScreen} />
            <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceMint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  splashSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
