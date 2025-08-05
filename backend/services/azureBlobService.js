const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class AzureBlobService {
  constructor() {
    // For development, we'll use a mock service
    // In production, uncomment the line below and provide real Azure credentials
    // this.blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';
    this.mockStorage = new Map(); // Mock storage for development
  }

  async uploadFile(file, userId) {
    try {
      // Generate unique blob name
      const fileExtension = path.extname(file.originalname);
      const blobName = `${userId}/${uuidv4()}${fileExtension}`;
      
      // In development, we'll mock the upload
      if (process.env.NODE_ENV === 'development') {
        return this.mockUpload(file, blobName);
      }

      // Production Azure Blob Storage upload
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
          blobContentDisposition: `attachment; filename="${file.originalname}"`
        },
        metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      };

      await blockBlobClient.uploadData(file.buffer, uploadOptions);
      
      return {
        blobName,
        downloadUrl: blockBlobClient.url,
        size: file.size
      };
    } catch (error) {
      console.error('Azure Blob upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async deleteFile(blobName) {
    try {
      // In development, use mock deletion
      if (process.env.NODE_ENV === 'development') {
        return this.mockDelete(blobName);
      }

      // Production Azure Blob Storage deletion
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.deleteIfExists();
      return true;
    } catch (error) {
      console.error('Azure Blob delete error:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  async generateDownloadUrl(blobName, expiresInMinutes = 60) {
    try {
      // In development, return mock URL
      if (process.env.NODE_ENV === 'development') {
        return `http://localhost:8080/api/files/download/${encodeURIComponent(blobName)}`;
      }

      // Production: Generate SAS URL for secure download
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const expiresOn = new Date();
      expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);
      
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r', // read permission
        expiresOn
      });
      
      return sasUrl;
    } catch (error) {
      console.error('Generate download URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  // Mock methods for development
  mockUpload(file, blobName) {
    this.mockStorage.set(blobName, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size
    });

    return {
      blobName,
      downloadUrl: `http://localhost:8080/api/files/download/${encodeURIComponent(blobName)}`,
      size: file.size
    };
  }

  mockDelete(blobName) {
    return this.mockStorage.delete(blobName);
  }

  getMockFile(blobName) {
    return this.mockStorage.get(blobName);
  }
}

module.exports = new AzureBlobService();