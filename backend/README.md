# Document Sharing System - Backend API

A secure Node.js backend API for document sharing with JWT authentication, role-based access control, and Azure Blob Storage integration.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt

- **File Management**
  - File upload with validation
  - Azure Blob Storage integration
  - Secure file sharing with generated links
  - Team file sharing (Admin only)

- **User Management**
  - User CRUD operations (Admin only)
  - User profile management
  - Account activation/deactivation

- **Security**
  - Helmet.js for security headers
  - Rate limiting
  - Input validation with Joi
  - CORS configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **File Storage**: Azure Blob Storage
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, bcrypt, express-rate-limit

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Azure Blob Storage connection string
   - Other configuration options

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/document-sharing |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection | - |
| `AZURE_STORAGE_CONTAINER_NAME` | Azure container name | documents |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 104857600 (100MB) |
| `ALLOWED_FILE_TYPES` | Comma-separated file extensions | pdf,doc,docx,txt,jpg,jpeg,png,gif,xlsx,xls,ppt,pptx |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/validate-token` - Validate JWT token

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/my-files` - Get user's files
- `GET /api/files/team-files` - Get team shared files
- `POST /api/files/:id/share` - Generate share link
- `POST /api/files/:id/share-team` - Share with team (Admin)
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/download/:blobName` - Download file
- `GET /api/files/shared/:token` - Access shared file

### Health Check
- `GET /api/health` - Server health status

## Development

The backend includes mock services for development:

- **Mock Azure Blob Storage**: Files are stored in memory during development
- **Mock Authentication**: Demo users are available for testing
- **Development Downloads**: Files are served directly from the backend

### Demo Users

For development and testing:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## Production Deployment

1. Set up MongoDB database
2. Configure Azure Blob Storage
3. Set production environment variables
4. Deploy to your preferred hosting platform

## Security Considerations

- Always use HTTPS in production
- Set strong JWT secrets
- Configure proper CORS origins
- Set up proper Azure Blob Storage permissions
- Enable MongoDB authentication
- Use environment variables for sensitive data
- Implement proper logging and monitoring

## File Upload Limits

- Maximum file size: 100MB (configurable)
- Allowed file types: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, XLSX, XLS, PPT, PPTX
- Files are validated before upload
- Unique file names prevent conflicts

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication and authorization errors
- File upload errors
- Database errors
- Generic server errors with appropriate HTTP status codes