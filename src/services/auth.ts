import { AuthUser, LoginCredentials } from '../types';
import { apiService } from './api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiService.post<{
      user: { id: string; name: string; email: string; role: 'user' | 'admin' };
      token: string;
    }>('/auth/login', credentials);
    
    return {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      token: response.token
    };
  }

  async validateToken(token: string): Promise<AuthUser> {
    const response = await apiService.post<{
      user: { id: string; name: string; email: string; role: 'user' | 'admin' };
    }>('/auth/validate-token');
    
    return {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      token
    };
  }
}

export const authService = new AuthService();