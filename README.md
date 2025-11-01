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
- **Object Storage**: MinIO
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

### 5. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

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

## 💾 Database Setup Guide

### For First Time Setup:

1. **Start Docker MySQL:**
   ```bash
   docker compose up -d
   ```

2. **Wait for MySQL to be ready** (10-15 seconds):
   ```bash
   docker logs barber-mysql --tail 10
   ```
   Look for: `ready for connections`

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Verify Tables Created:**
   ```bash
   npx prisma studio
   ```
   This opens a GUI at `http://localhost:5555` where you can view your database.

### Database Schema:

- **users**: Stores user accounts with phone-based authentication
  - Fields: `id`, `first_name`, `last_name`, `phone` (unique), `password`, `profile_image`, `role`, `created_at`, `updated_at`

- **barbers**: Barber profiles linked to users
  - Fields: `id`, `user_id` (FK), `specialization`, `experience_years`, `rating`, `bio`, `profile_image`

- **appointments**: Appointment bookings
  - Fields: `id`, `user_id` (FK), `barber_id` (FK), `appointment_date`, `status`, `service_type`, `notes`

### Troubleshooting:

**Port 3306 Already in Use:**
- Docker automatically uses port 3307
- Update `DATABASE_URL` in `.env` to use port 3307

**Shadow Database Permission Error:**
- Use `root` user for migrations: `DATABASE_URL="mysql://root:rootpassword@localhost:3307/barber_booking"`
- After migration, switch back to regular user

**Connection Failed:**
- Make sure Docker container is running: `docker ps`
- Check MySQL logs: `docker logs barber-mysql`
- Verify port in `DATABASE_URL` matches Docker port mapping

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript (if applicable)
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
npm test           # Run tests
```

## 🔒 Security Best Practices

- Store sensitive data in environment variables
- Use HTTPS in production
- Implement rate limiting
- Validate and sanitize all user inputs
- Use strong JWT secrets
- Implement proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Soheil saffari