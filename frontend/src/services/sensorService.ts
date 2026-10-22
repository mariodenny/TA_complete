import { StorageService } from './storageService';
import { Sensor, SensorCategory, BackendSensorType } from '../types/models';
import { ApiClient } from './apiClient';

const SENSORS_STORAGE_KEY = 'smartpot_local_sensors';

// Map user category to backend enum: ('soil_moisture', 'humidity_and_temperature', 'lux_value')
export const CATEGORY_TO_BACKEND_TYPE: Record<SensorCategory, BackendSensorType> = {
  moisture: 'soil_moisture',
  temperature: 'humidity_and_temperature',
  humidity: 'humidity_and_temperature',
  lux: 'lux_value',
};

// Map backend enum to user category
export const BACKEND_TYPE_TO_CATEGORY: Record<string, SensorCategory> = {
  soil_moisture: 'moisture',
  humidity_and_temperature: 'temperature',
  temp_c: 'temperature',
  humidity: 'humidity',
  lux_value: 'lux',
  ldr_value: 'lux',
};

export const SensorService = {
  async getSensors(deviceId?: number): Promise<Sensor[]> {
    const isMock = await StorageService.getUseMock();
    if (!isMock && deviceId) {
      try {
        const res = await ApiClient.get<any>(`/api/devices/${deviceId}`);
        if (Array.isArray(res.data)) {
          const sensors = res.data
            .filter((row: any) => row.sensor_id != null)
            .map((row: any): Sensor => ({
              sensor_id: row.sensor_id,
              device_id: row.device_id,
              sensor_name: row.sensor_name || 'Sensor',
              sensor_type: row.sensor_type,
              category: BACKEND_TYPE_TO_CATEGORY[row.sensor_type] || 'moisture',
              sensor_created_at: row.sensor_created_at,
            }));
          return sensors;
        }
      } catch (err: any) {
        if (err.statusCode === 401) throw err;
        console.warn('Gagal memuat sensor dari API:', err.message);
      }
    }

    const sensors = (await StorageService.getItem<Sensor[]>(SENSORS_STORAGE_KEY)) || [];
    if (deviceId) {
      return sensors.filter((s) => s.device_id === deviceId);
    }
    return sensors;
  },

  async createSensor(params: {
    device_id: number;
    sensor_name: string;
    category: SensorCategory;
  }): Promise<Sensor> {
    const backendType = CATEGORY_TO_BACKEND_TYPE[params.category] || 'soil_moisture';

    const newSensor: Sensor = {
      sensor_id: Date.now(),
      device_id: params.device_id,
      sensor_name: params.sensor_name.trim(),
      category: params.category,
      sensor_type: backendType,
      sensor_created_at: new Date().toISOString(),
    };

    const isMock = await StorageService.getUseMock();
    if (!isMock) {
      // Try posting to backend if sensor route is registered in the future
      try {
        await ApiClient.post('/api/sensors/', {
          device_id: params.device_id,
          name: newSensor.sensor_name,
          type: newSensor.sensor_type,
        });
      } catch {
        // Sensor blueprint is not registered in app.py yet; persist in local device store
      }
    }

    const sensors = await this.getSensors();
    const updated = [newSensor, ...sensors];
    await StorageService.setItem(SENSORS_STORAGE_KEY, updated);

    // Increment device sensor count
    const devicesKey = 'smartpot_local_devices';
    const devices = (await StorageService.getItem<any[]>(devicesKey)) || [];
    const updatedDevices = devices.map((d) =>
      d.device_id === params.device_id
        ? { ...d, sensors_count: (d.sensors_count || 0) + 1 }
        : d
    );
    await StorageService.setItem(devicesKey, updatedDevices);

    return newSensor;
  },
};
