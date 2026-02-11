import axios from 'axios';
import { API_BASE_URL } from '@shared/constants.ts';
import {
  API_ENDPOINTS,
  SettingsResponse,
  UserSettingsUpdateRequest,
} from '@shared/api.ts';
import { authService } from './auth';

interface ISettingsService {
  getSettings(): Promise<SettingsResponse>;
  updateSettings(settings: UserSettingsUpdateRequest): Promise<void>;
}

export const settingsService: ISettingsService = {
  async getSettings(): Promise<SettingsResponse> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await axios.get<SettingsResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.SETTINGS.GET}`,
      {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async updateSettings(settings: UserSettingsUpdateRequest): Promise<void> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.SETTINGS.UPDATE}`,
      settings,
      {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  },
};
