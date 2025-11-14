import { EnvironmentProfile, CreateEnvironmentProfileData } from '../types';
import { apiService } from './api';

class EnvironmentService {
  async getEnvironmentProfiles(): Promise<EnvironmentProfile[]> {
    const response = await apiService.get<{ profiles: EnvironmentProfile[] }>('/environment-profiles');
    return response.profiles;
  }

  async createEnvironmentProfile(profileData: CreateEnvironmentProfileData): Promise<EnvironmentProfile> {
    const response = await apiService.post<{ profile: EnvironmentProfile }>('/environment-profiles', profileData);
    return response.profile;
  }

  async deleteEnvironmentProfile(profileId: string): Promise<void> {
    await apiService.delete(`/environment-profiles/${profileId}`);
  }
}

export const environmentService = new EnvironmentService();