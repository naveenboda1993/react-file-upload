const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:8080/api';
const AUTH_TOKEN = localStorage.getItem('token');

interface UploadProgressCallback {
  (progress: number): void;
}

class DesktopFileService {
  private apiUrl = API_URL;
  private authToken = localStorage.getItem('token') || '';

  setApiUrl(url: string) {
    this.apiUrl = url;
    localStorage.setItem('apiUrl', url);
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('token', token);
  }

  async uploadFile(
    file: File,
    processingService: 'sap' | 'abbyy' | 'google' | 'auto' = 'auto',
    onProgress?: UploadProgressCallback
  ): Promise<any> {
    const endpoint = this.getEndpoint(processingService);

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', `${this.apiUrl}${endpoint}`);

      if (this.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
      }

      xhr.send(formData);
    });
  }

  private getEndpoint(processingService: 'sap' | 'abbyy' | 'google' | 'auto'): string {
    switch (processingService) {
      case 'google':
        return '/google-doc-ai/upload';
      case 'abbyy':
        return '/abbyy/upload';
      case 'sap':
      case 'auto':
      default:
        return '/files/upload';
    }
  }

  async getMyFiles(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/files/my-files`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFileStatus(documentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/files/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching file status:', error);
      throw error;
    }
  }
}

export const desktopFileService = new DesktopFileService();
