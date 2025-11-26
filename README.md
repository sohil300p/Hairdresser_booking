# Barber Booking System - Backend API

A comprehensive backend API for managing barber shop appointments, allowing customers to book haircut appointments seamlessly.

## 🎯 Project Overview

This backend system enables customers of a barber shop to reserve appointments for haircuts. The API provides secure authentication, appointment management, and file storage capabilities.

## ✨ Features

- **User Authentication**: Secure JWT-based authentication system
- **Appointment Booking**: Customers can book, view, and manage their appointments
- **Barber Management**: Manage barber profiles and availability
- **File Storage**: Integration with MinIO for storing images and documents
- **API Documentation**: Swagger documentation for easy API exploration
- **Testing**: Postman collection and Swagger UI for API testing

## 🛠️ Tech Stack

- **Framework**: Express.js (Node.js)
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Object Storage**: MinIO (S3-compatible storage)
- **Cache**: Redis
- **SMS Service**: MeliPayamak integration
- **API Testing**: Postman & Swagger
- **Containerization**: Docker & Docker Compose


### 1. Clone the Repository

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (Note: Port 3307 is used if 3306 is occupied)
DATABASE_URL="mysql://barberuser:barberpass@localhost:3307/barber_booking"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=barber-uploads
MINIO_USE_SSL=false

# API Documentation
SWAGGER_BASE_PATH=/api-docs
```

**Note**: If port 3306 is already in use by another MySQL instance, Docker will automatically use port 3307. Update the `DATABASE_URL` accordingly.

### 3. Start MySQL Database with Docker

```bash
docker compose up -d
```

This will start:
- MySQL database on port `3307` (or `3306` if available)
- Database name: `barber_booking`
- User: `barberuser`
- Password: `barberpass`

**Important**: Wait 10-15 seconds after starting Docker for MySQL to be ready.

### 4. Setup Prisma and Database

Generate Prisma Client and run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init
```

**Note**: If you get a shadow database permission error, make sure you're using the `root` user credentials in `DATABASE_URL` for migrations:
```
DATABASE_URL="mysql://root:rootpassword@localhost:3307/barber_booking"
```

After migration, you can switch back to the regular user for the application.

The migration will create the following tables:
- `users` - User accounts (phone-based authentication)
- `barbers` - Barber profiles
- `appointments` - Appointment bookings

### 5. MinIO Object Storage Setup

MinIO is used for storing uploaded files (avatars, images, etc.). The Docker Compose setup includes MinIO with the following configuration:

#### Access MinIO Console
- **URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin`

#### MinIO Configuration in `.env`
```env
# MinIO Object Storage Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=barber-uploads
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_CONSOLE_URL=http://localhost:9001
MINIO_PUBLIC_URL=http://localhost:9000
```

#### Production MinIO Setup
For production, update the MinIO configuration:
```env
MINIO_ENDPOINT=your-minio-server.com
MINIO_PORT=443
MINIO_ACCESS_KEY=your-production-access-key
MINIO_SECRET_KEY=your-production-secret-key
MINIO_USE_SSL=true
MINIO_PUBLIC_URL=https://your-minio-server.com
```

#### MinIO Features
- **Automatic bucket creation**: The `barber-uploads` bucket is created automatically
- **Public read policy**: Uploaded files are publicly accessible via URL
- **File validation**: Supports JPG, PNG, WebP formats with size limits
- **Avatar upload**: Drag & drop interface with preview functionality

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🚀 Production Deployment (Docker)

The repository ships with a production-ready compose stack that builds the backend, frontend, and MySQL services without exposing container ports. This layout is compatible with Dockploy/Traefik-managed ingress.

1. **Prepare environment variables**
   - Populate the root `.env` with production secrets (JWT keys, database credentials, Map.ir key, etc.).
   - Ensure the database URL host resolves inside the compose network (it is overridden to `mysql` by default).
   - Set `VITE_MAPIR_API_KEY` and (optionally) `VITE_API_BASE_URL` before building the frontend image.

2. **Build images**

   ```bash
   docker compose -f docker-compose.production.yml build
   ```

3. **Run the stack** (Traefik will discover services via labels you supply):

   ```bash
   docker compose -f docker-compose.production.yml up -d
   ```

4. **Add Traefik labels**
   - Uncomment and customise the sample labels in `docker-compose.production.yml` for both `backend` and `frontend` services to match your domains.

5. **Database persistence**
   - A `mysql-data` named volume stores MySQL data between deployments.

6. **Updating configuration**
   - Re-run the build command whenever frontend or backend dependencies change.
   - Redeploy with `docker compose -f docker-compose.production.yml up -d` to roll out new images.

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```