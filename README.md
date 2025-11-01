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

### 3. Environment Setup

### 4. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- MySQL database on port `3306`
- (Add MinIO service if needed in docker-compose.yml)

### 5. Database Setup

Run database migrations or seed scripts to set up the database schema:

```bash
# Example migration command (adjust based on your setup)
npm run migrate
```

### 6. Start the Development Server

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