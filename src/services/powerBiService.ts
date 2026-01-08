import { apiService } from './api';

class PowerBiService {
  async getEmbedToken(): Promise<any> {
    try {
      return await apiService.post('/insights/powerbi-token');
    } catch (error) {
      console.error('Error getting Power BI embed token:', error);
      throw error;
    }
  }

  async getInsightsConfig(): Promise<any> {
    try {
      return await apiService.get('/insights/config');
    } catch (error) {
      console.error('Error getting insights config:', error);
      throw error;
    }
  }

  async getInsightsStats(): Promise<any> {
    try {
      return await apiService.get('/insights/stats');
    } catch (error) {
      console.error('Error getting insights stats:', error);
      throw error;
    }
  }
}

export const powerBiService = new PowerBiService();