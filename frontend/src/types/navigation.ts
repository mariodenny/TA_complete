import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Devices: undefined;
  Activity: undefined;
  Home: undefined;
  Settings: { plantId?: number } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  AddDevice: undefined;
  DeviceDetail: { deviceId: number };
  AddSensor: { deviceId?: number };
  Plants: undefined;
  AddPlant: undefined;
  PlantDetail: { plantId: number };
};
