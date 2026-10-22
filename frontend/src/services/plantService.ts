import { ApiClient } from './apiClient';
import { StorageService } from './storageService';
import { Plant } from '../types/models';
import { INITIAL_MOCK_PLANTS } from './mockData';

const PLANTS_STORAGE_KEY = 'smartpot_local_plants';

export const PlantService = {
  async getPlants(): Promise<Plant[]> {
    const isMock = await StorageService.getUseMock();
    if (isMock) {
      const stored = await StorageService.getItem<Plant[]>(PLANTS_STORAGE_KEY);
      if (!stored) {
        await StorageService.setItem(PLANTS_STORAGE_KEY, INITIAL_MOCK_PLANTS);
        return INITIAL_MOCK_PLANTS;
      }
      return stored;
    }

    try {
      const res = await ApiClient.get<Plant[]>('/api/plants/');
      return Array.isArray(res.data) ? res.data : [];
    } catch (e: any) {
      if (e.statusCode === 401) throw e;
      console.warn('API error fetching plants:', e.message);
      // Return empty array on network failure rather than substituting fake data silently
      const stored = await StorageService.getItem<Plant[]>(PLANTS_STORAGE_KEY);
      return stored || [];
    }
  },

  async getPlantById(id: number): Promise<Plant | null> {
    const isMock = await StorageService.getUseMock();
    if (isMock) {
      const plants = await this.getPlants();
      return plants.find((p) => p.id === id) || null;
    }

    try {
      const res = await ApiClient.get<Plant>(`/api/plants/${id}`);
      return res.data || null;
    } catch (e: any) {
      if (e.statusCode === 401) throw e;
      const plants = await this.getPlants();
      return plants.find((p) => p.id === id) || null;
    }
  },

  async createPlant(params: {
    name: string;
    location: string;
    device_id?: number | null;
    imageUri?: string;
  }): Promise<Plant> {
    const isMock = await StorageService.getUseMock();

    const newPlant: Plant = {
      id: Date.now(),
      user_id: 1,
      device_id: params.device_id || null,
      name: params.name,
      location: params.location,
      image_url: params.imageUri || null,
      humidity: null,
      temp_c: null,
      soil_condition: null,
      lux_value: null,
      created_at: new Date().toISOString(),
    };

    if (!isMock) {
      const formData = new FormData();
      formData.append('name', params.name);
      formData.append('location', params.location);
      if (params.device_id) {
        formData.append('device_id', String(params.device_id));
      }
      if (params.imageUri) {
        const filename = params.imageUri.split('/').pop() || 'plant.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: params.imageUri,
          name: filename,
          type,
        } as any);
      }

      const res = await ApiClient.postFormData('/api/plants/', formData);
      if (res.data?.plant_id) {
        newPlant.id = res.data.plant_id;
        newPlant.image_url = res.data.image_url;
      }
    }

    const plants = await this.getPlants();
    const updated = [newPlant, ...plants];
    await StorageService.setItem(PLANTS_STORAGE_KEY, updated);

    return newPlant;
  },

  async updatePlant(id: number, data: Partial<Plant>): Promise<boolean> {
    const isMock = await StorageService.getUseMock();
    if (!isMock) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.location) formData.append('location', data.location);
      await ApiClient.put(`/api/plants/${id}`, formData);
    }

    const plants = await this.getPlants();
    const updated = plants.map((p) => (p.id === id ? { ...p, ...data } : p));
    await StorageService.setItem(PLANTS_STORAGE_KEY, updated);
    return true;
  },

  async deletePlant(id: number): Promise<boolean> {
    const isMock = await StorageService.getUseMock();
    if (!isMock) {
      await ApiClient.delete(`/api/plants/${id}`);
    }

    const plants = await this.getPlants();
    const updated = plants.filter((p) => p.id !== id);
    await StorageService.setItem(PLANTS_STORAGE_KEY, updated);
    return true;
  },
};
