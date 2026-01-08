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

export interface EnvironmentProfile {
  id: string;
  name: string;
  clientId: string;
  url: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateEnvironmentProfileData {
  name: string;
  clientId: string;
  url: string;
}

export interface PowerBIConfig {
  embedUrl: string;
  reportId: string;
  groupId: string;
  accessKey: string;
}

export interface InsightStats {
  totalDocuments: number;
  totalSharedDocuments: number;
  activeUsers: number;
  processingSuccess: number;
  processingFailed: number;
  averageProcessingTime: number;
}

export interface PowerBIEmbedConfig {
  embedUrl: string;
  reportId: string;
  groupId: string;
  accessToken: string;
  userName: string;
  userId: string;
}