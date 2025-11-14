import { Document } from '../types';
import { apiService } from './api';

class FileService {
  async getMyFiles(): Promise<Document[]> {
    const response = await apiService.get<{ documents: Document[] }>('/files/my-files');
    return response.documents;
  }
   async getFileData(id:string): Promise<any> {
    const response = await apiService.get<{ documents: any }>('/files/' + id);
    return response;
  }

  async getTeamFiles(): Promise<Document[]> {
    const response = await apiService.get<{ documents: Document[] }>('/files/team-files');
    return response.documents;
  }

  async uploadFile(file: File): Promise<Document> {
    const response = await apiService.uploadFile('/files/upload', file);
    return response.document;
  }

  async deleteFile(fileId: string): Promise<void> {
    await apiService.delete(`/files/${fileId}`);
  }

  async shareFile(fileId: string): Promise<string> {
    const response = await apiService.post<{ shareLink: string }>(`/files/${fileId}/share`);
    return response.shareLink;
  }
}

export const fileService = new FileService();