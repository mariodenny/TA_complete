export type DeviceStatus = 'setup_draft' | 'not_paired' | 'online' | 'offline' | 'error';

export type BoardModel = 'ESP32' | 'ESP8266' | 'ESP32-S3' | 'ESP32-C3';

export interface ESPDevice {
  device_id: number;
  name: string;
  location: string;
  mac_address: string;
  ip_address?: string | null;
  user_id?: number;
  is_online: boolean;
  model: BoardModel;
  status: DeviceStatus;
  wifi_ssid?: string;
  sensors_count: number;
  device_created_at?: string;
}

// 4 main sensor categories displayed to the user
export type SensorCategory = 'moisture' | 'temperature' | 'humidity' | 'lux';

// Backend sensor enum values: ('ldr_value', 'humidity_and_temperature', 'soil_moisture', 'lux_value')
export type BackendSensorType = 'soil_moisture' | 'humidity_and_temperature' | 'lux_value' | 'ldr_value';

export interface Sensor {
  sensor_id: number;
  device_id: number;
  sensor_name: string;
  category: SensorCategory;
  sensor_type: BackendSensorType;
  pin?: string;
  plant_id?: number | null;
  latest_value?: number | null;
  sensor_created_at?: string;
}

export interface Plant {
  id: number;
  user_id: number;
  device_id: number | null;
  name: string;
  location: string;
  image_url?: string | null;
  humidity?: number | null;
  temp_c?: number | null;
  soil_condition?: number | null;
  lux_value?: number | null;
  created_at?: string;
}

export interface PlantThreshold {
  plant_id: number;
  is_configured: boolean;
  moisture_dry?: number | null;
  moisture_wet?: number | null;
  temp_cold?: number | null;
  temp_warm?: number | null;
  temp_hot?: number | null;
  lux_min?: number | null;
  auto_mode?: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
}

export type ActivityEventType = 'reading' | 'connection' | 'pump' | 'watering' | 'threshold' | 'alert';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  device_id?: number;
  plant_id?: number;
}
