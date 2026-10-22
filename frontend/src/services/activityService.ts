import { StorageService } from './storageService';
import { ActivityEvent } from '../types/models';
import { INITIAL_MOCK_ACTIVITIES } from './mockData';

const ACTIVITIES_STORAGE_KEY = 'smartpot_local_activities';

export const ActivityService = {
  async getActivities(): Promise<ActivityEvent[]> {
    let activities = await StorageService.getItem<ActivityEvent[]>(ACTIVITIES_STORAGE_KEY);
    if (!activities) {
      await StorageService.setItem(ACTIVITIES_STORAGE_KEY, INITIAL_MOCK_ACTIVITIES);
      activities = INITIAL_MOCK_ACTIVITIES;
    }
    return activities;
  },

  async addActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const newEvent: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const current = await this.getActivities();
    const updated = [newEvent, ...current].slice(0, 50); // Keep last 50
    await StorageService.setItem(ACTIVITIES_STORAGE_KEY, updated);
    return newEvent;
  },

  async clearActivities(): Promise<void> {
    await StorageService.setItem(ACTIVITIES_STORAGE_KEY, []);
  },
};

