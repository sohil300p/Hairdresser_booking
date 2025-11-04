# API Testing Guide

این فایل راهنمای کامل تست API های پروژه Barber Booking است.

## 📋 پیش‌نیازها

1. **نصب Dependencies:**
```bash
npm install
```

2. **راه‌اندازی Docker Services:**
```bash
docker compose up -d
```

این دستور MySQL، Redis و MinIO را راه‌اندازی می‌کند.

3. **راه‌اندازی Prisma:**
```bash
npx prisma generate
npx prisma migrate dev --name add_files_table
```

4. **اجرای سرور:**
```bash
npm run dev
```

## 🛠️ ابزارهای پیشنهادی برای تست

- **Postman** - برای تست API
- **Thunder Client** (VS Code Extension)
- **curl** - از خط فرمان
- **Swagger UI** - (اگر در آینده اضافه شود)

## 📱 API Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running and database is connected",
  "timestamp": "2025-11-03T...",
  "database": {
    "connected": true,
    "status": "connected"
  }
}
```

---

### 2. OTP - Send OTP

**Endpoint:** `POST /api/otp/send`

**Request:**
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09123456789"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 60,
  "remainingAttempts": 4
}
```

**Response (Error - Limit Reached):**
```json
{
  "success": false,
  "message": "Maximum OTP requests (5) reached for today. Please try again tomorrow.",
  "remainingAttempts": 0
}
```

**Note:** OTP در console نمایش داده می‌شود (برای development)

---

### 3. OTP - Verify OTP

**Endpoint:** `POST /api/otp/verify`

**Request:**
```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09123456789",
    "otp": "1234"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "09123456789",
    "firstName": null,
    "lastName": null,
    "profileImage": null,
    "role": "CUSTOMER"
  }
}
```

**Response (Error - Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

---

### 4. Auth - Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "NEW_ACCESS_TOKEN",
  "refreshToken": "NEW_REFRESH_TOKEN"
}
```

---

### 5. Auth - Verify Token

**Endpoint:** `POST /api/auth/verify-token`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_ACCESS_TOKEN_HERE"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "phone": "09123456789",
    "role": "CUSTOMER"
  }
}
```

---

### 6. Auth - Logout

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 7. Files - Upload File

**Endpoint:** `POST /api/files/upload`

**Request (با curl):**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  -F "folder=profiles"
```

**Request (با Postman):**
1. Method: POST
2. URL: `http://localhost:3000/api/files/upload`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: form-data
   - Key: `file` (Type: File)
   - Key: `folder` (Type: Text, Value: `profiles` - optional)

**Response (Success):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileUrl": "http://localhost:9000/barber-uploads/profiles/uuid.jpg",
  "fileName": "profiles/uuid.jpg",
  "fileSize": 123456,
  "contentType": "image/jpeg"
}
```

---

### 8. Files - Download File

**Endpoint:** `GET /api/files/download/:fileName`

**Request:**
```bash
curl http://localhost:3000/api/files/download/profiles/uuid.jpg?folder=profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output downloaded-file.jpg
```

---

### 9. Files - Get File Metadata

**Endpoint:** `GET /api/files/metadata/:fileName`

**Request:**
```bash
curl http://localhost:3000/api/files/metadata/profiles/uuid.jpg?folder=profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "size": 123456,
  "contentType": "image/jpeg",
  "lastModified": "2025-11-03T...",
  "etag": "..."
}
```

---

### 10. Files - Delete File

**Endpoint:** `DELETE /api/files/:fileName`

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/files/profiles/uuid.jpg?folder=profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 11. Files - List Files

**Endpoint:** `GET /api/files/list`

**Request:**
```bash
curl http://localhost:3000/api/files/list?folder=profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "files": [
    "profiles/uuid1.jpg",
    "profiles/uuid2.png"
  ],
  "count": 2
}
```

---

## 🔄 Flow کامل تست

### مرحله 1: ارسال OTP
```bash
POST /api/otp/send
{
  "phone": "09123456789"
}
```
→ OTP در console نمایش داده می‌شود (مثلاً: `1234`)

### مرحله 2: بررسی OTP
```bash
POST /api/otp/verify
{
  "phone": "09123456789",
  "otp": "1234"
}
```
→ دریافت `token` و `refreshToken`

### مرحله 3: استفاده از Token برای API های Protected
```bash
POST /api/files/upload
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  file: [your file]
}
```

---

## 📝 Postman Collection

می‌توانید یک Postman Collection ایجاد کنید:

1. **Environment Variables:**
   - `base_url`: `http://localhost:3000`
   - `token`: (خالی - بعد از verify OTP پر می‌شود)
   - `refresh_token`: (خالی - بعد از verify OTP پر می‌شود)

2. **Collection:**
   - Health Check
   - OTP Send
   - OTP Verify (با Test Script برای ذخیره token)
   - Auth Refresh Token
   - Auth Verify Token
   - Auth Logout
   - Files Upload
   - Files Download
   - Files Metadata
   - Files Delete
   - Files List

---

## ⚠️ نکات مهم

1. **Redis باید در حال اجرا باشد** برای OTP
2. **MinIO باید در حال اجرا باشد** برای File Upload
3. **MySQL باید در حال اجرا باشد** برای Database
4. OTP فقط **60 ثانیه** معتبر است
5. حداکثر **5 OTP** در روز برای هر شماره
6. Token ها را در جای امن نگه دارید

---

## 🐛 Troubleshooting

### خطای اتصال Redis:
```bash
docker compose up -d redis
docker logs barber-redis
```

### خطای اتصال MinIO:
```bash
docker compose up -d minio
docker logs barber-minio
```

### خطای Database:
```bash
docker compose up -d mysql
docker logs barber-mysql
```

### بررسی وضعیت همه سرویس‌ها:
```bash
docker ps
```