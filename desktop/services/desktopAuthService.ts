import { AuthUser, LoginCredentials } from '../../src/types';
import { desktopApiService } from './desktopApiService';

class DesktopAuthService {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await desktopApiService.post<{
      user: { id: string; name: string; email: string; role: 'user' | 'admin' };
      token: string;
    }>('/auth/login', credentials);
    
    const user: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      token: response.token
    };

    // Store token in both localStorage and desktopFileService
    localStorage.setItem('token', response.token);
    return user;
  }

  async validateToken(token: string): Promise<AuthUser> {
    const response = await desktopApiService.post<{
      user: { id: string; name: string; email: string; role: 'user' | 'admin' };
    }>('/auth/validate-token');
    
    const user: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      token
    };

    localStorage.setItem('token', token);
    return user;
  }
}

export const desktopAuthService = new DesktopAuthService();