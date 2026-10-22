import { ApiClient } from './apiClient';
import { StorageService } from './storageService';
import { ESPDevice } from '../types/models';
import { INITIAL_MOCK_DEVICES } from './mockData';

const DEVICES_STORAGE_KEY = 'smartpot_local_devices';

export const DeviceService = {
  async getDevices(): Promise<ESPDevice[]> {
    const isMock = await StorageService.getUseMock();
    if (isMock) {
      const stored = await StorageService.getItem<ESPDevice[]>(DEVICES_STORAGE_KEY);
      if (!stored) {
        await StorageService.setItem(DEVICES_STORAGE_KEY, INITIAL_MOCK_DEVICES);
        return INITIAL_MOCK_DEVICES;
      }
      return stored;
    }

    // Real API mode
    try {
      const res = await ApiClient.get<ESPDevice[]>('/api/devices/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err: any) {
      if (err.statusCode === 401) throw err;
      console.warn('Backend device list warning:', err.message);
    }

    // Read devices registered locally through the app
    const stored = await StorageService.getItem<ESPDevice[]>(DEVICES_STORAGE_KEY);
    return stored || [];
  },

  async getDeviceById(id: number): Promise<ESPDevice | null> {
    const isMock = await StorageService.getUseMock();
    if (isMock) {
      const devices = await this.getDevices();
      return devices.find((d) => d.device_id === id) || null;
    }

    try {
      const res = await ApiClient.get<any>(`/api/devices/${id}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const row = res.data[0];
        const sensorsCount = res.data.filter((r: any) => r.sensor_id != null).length;
        return {
          device_id: row.device_id,
          name: row.device_name,
          location: row.device_location,
          mac_address: row.mac_address,
          ip_address: row.ip_address,
          user_id: row.user_id,
          is_online: Boolean(row.is_online),
          model: 'ESP32',
          status: row.is_online ? 'online' : 'offline',
          sensors_count: sensorsCount,
          device_created_at: row.device_created_at,
        };
      }
    } catch (err: any) {
      if (err.statusCode === 401) throw err;
      console.warn('Backend get device warning:', err.message);
    }

    const devices = await this.getDevices();
    return devices.find((d) => d.device_id === id) || null;
  },

  async createDevice(params: {
    name: string;
    model: string;
    mac_address: string;
    wifi_ssid?: string;
    wifi_password?: string;
    location?: string;
  }): Promise<ESPDevice> {
    const isMock = await StorageService.getUseMock();

    const newDevice: ESPDevice = {
      device_id: Date.now(),
      name: params.name,
      location: params.location || 'Taman Depan',
      mac_address: params.mac_address,
      model: params.model as any,
      status: 'setup_draft',
      is_online: false,
      wifi_ssid: params.wifi_ssid,
      sensors_count: 0,
      device_created_at: new Date().toISOString(),
    };

    if (!isMock) {
      const res = await ApiClient.post('/api/devices/', {
        name: params.name,
        location: params.location || 'Taman Depan',
        mac_address: params.mac_address,
      });
      if (res.data?.device_id) {
        newDevice.device_id = res.data.device_id;
      }
    }

    // Save into device cache
    const devices = await this.getDevices();
    const updated = [newDevice, ...devices];
    await StorageService.setItem(DEVICES_STORAGE_KEY, updated);

    return newDevice;
  },
};
