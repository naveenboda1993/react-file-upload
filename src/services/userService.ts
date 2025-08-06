
import { User } from '../types';
import { apiService } from './api';

class UserService {
  async getUsers(): Promise<User[]> {
    const response = await apiService.get<{ users: User[] }>('/users');
    return response.users;
  }

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await apiService.post<User>('/users', user);
    return response;
  }

  async updateUser(user: User): Promise<User> {
    const response = await apiService.put<User>(`/users/${user._id}`, user);
    return response;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiService.delete(`/users/${userId}`);
  }
}

export const userService = new UserService();