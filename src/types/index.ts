export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
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