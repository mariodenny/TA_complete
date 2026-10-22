import { ApiClient } from './apiClient';
import { StorageService } from './storageService';
import { PlantThreshold } from '../types/models';
import { INITIAL_MOCK_THRESHOLDS } from './mockData';

const THRESHOLDS_STORAGE_KEY = 'smartpot_local_thresholds';

export const ThresholdService = {
  async getThreshold(plantId: number): Promise<PlantThreshold> {
    const isMock = await StorageService.getUseMock();
    if (!isMock) {
      try {
        const res = await ApiClient.get(`/api/plants/treshold/${plantId}`);
        if (res.data) {
          const row = res.data;
          return {
            plant_id: plantId,
            is_configured: true,
            moisture_dry: row.soil_percentage ? Math.max(10, row.soil_percentage - 20) : null,
            moisture_wet: row.soil_percentage || null,
            temp_warm: row.temp_c || null,
            temp_cold: row.temp_c ? row.temp_c - 6 : null,
            temp_hot: row.temp_c ? row.temp_c + 6 : null,
            lux_min: row.lux || null,
            auto_mode: true,
          };
        }
      } catch (err: any) {
        if (err.statusCode === 401) throw err;
        // 404 means no threshold configured yet for this plant
      }
    }

    const stored = await StorageService.getItem<Record<number, PlantThreshold>>(THRESHOLDS_STORAGE_KEY);
    const thresholds = stored || (isMock ? INITIAL_MOCK_THRESHOLDS : {});

    if (thresholds[plantId]) {
      return thresholds[plantId];
    }

    return {
      plant_id: plantId,
      is_configured: false,
      moisture_dry: null,
      moisture_wet: null,
      temp_cold: null,
      temp_warm: null,
      temp_hot: null,
      lux_min: null,
      auto_mode: true,
    };
  },

  async saveThreshold(
    plantId: number,
    threshold: Partial<PlantThreshold>
  ): Promise<{ success: boolean; message: string }> {
    const isMock = await StorageService.getUseMock();

    const current = await this.getThreshold(plantId);
    const updated: PlantThreshold = {
      ...current,
      ...threshold,
      plant_id: plantId,
      is_configured: true,
    };

    if (!isMock) {
      // Backend contract: POST /api/plants/<int:plant_id>/treshold with JSON
      await ApiClient.post(`/api/plants/${plantId}/treshold`, {
        soil_percentage: updated.moisture_wet || updated.moisture_dry || 75,
        humidity_percentage: 65,
        temp_c: updated.temp_warm || 25,
        lux: updated.lux_min || 1000,
      });
    }

    // Persist detailed values in local storage cache
    const stored = (await StorageService.getItem<Record<number, PlantThreshold>>(THRESHOLDS_STORAGE_KEY)) || {};
    stored[plantId] = updated;
    await StorageService.setItem(THRESHOLDS_STORAGE_KEY, stored);

    return { success: true, message: 'Batas parameter lingkungan berhasil disimpan!' };
  },
};
