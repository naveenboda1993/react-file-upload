export interface User {
  _id?: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt?: string;     // Optional, from API
  isActive?: boolean;     // Optional, from API
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  isShared: boolean;
  shareLink?: string;
  status?: string;
  documentType?: string;
  created?: string;
  finished?: string;
  clientId?: string;
  downloadUrl: string;

}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
}