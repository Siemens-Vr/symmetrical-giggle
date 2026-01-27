# VRStore Backend Setup Guide

This guide will walk you through setting up the VRStore backend from scratch.

## Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Database Setup](#database-setup)
3. [Redis Setup](#redis-setup)
4. [Email Service Configuration](#email-service-configuration)
5. [Application Configuration](#application-configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites Installation

### Node.js

**Windows:**
1. Download Node.js v18+ from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### PostgreSQL

**Windows:**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer (remember the password you set for the postgres user)
3. Add PostgreSQL to PATH (usually done automatically)
4. Verify installation:
   ```powershell
   psql --version
   ```

### Redis

**Windows:**
Redis doesn't have official Windows support, but you have options:

**Option 1: Using WSL (Recommended)**
```powershell
# Install WSL
wsl --install

# Inside WSL, install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Test
redis-cli ping
```

**Option 2: Using Docker**
```powershell
# Install Docker Desktop
# Then run:
docker run -d -p 6379:6379 redis:alpine
```

**Option 3: Memurai (Windows Native)**
Download from [memurai.com](https://www.memurai.com/)

---

## Database Setup

### 1. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vrstore;

# Create user (optional)
CREATE USER vrstore_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vrstore TO vrstore_user;

# Exit
\q
```

### 2. Update Connection String

In your `.env` file:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/vrstore?schema=public"
```

Or if you created a separate user:

```env
DATABASE_URL="postgresql://vrstore_user:your_password@localhost:5432/vrstore?schema=public"
```

### 3. Run Migrations

```powershell
npm run prisma:generate
npm run prisma:migrate
```

---

## Redis Setup

### Verify Redis is Running

**WSL:**
```powershell
wsl redis-cli ping
# Should return: PONG
```

**Docker:**
```powershell
docker ps
# Should show redis container running
```

### Update Redis Configuration

In your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

If using Docker or remote Redis with password:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

---

## Email Service Configuration

### Option 1: Gmail (Development)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Generate a new app password for "Mail"

3. **Update `.env`**:
   ```env
   EMAIL_SERVICE=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   EMAIL_FROM_NAME=VRStore
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```

### Option 2: SendGrid (Production)

1. Sign up at [sendgrid.com](https://sendgrid.com/)
2. Create an API key
3. Update `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM_NAME=VRStore
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

### Option 3: Development Mode (Console Logging)

For development, you can skip email configuration. OTP codes will be logged to the console:

```env
EMAIL_SERVICE=console
```

---

## Application Configuration

### 1. Copy Environment File

```powershell
cp .env.example .env
```

### 2. Generate JWT Secrets

**PowerShell:**
```powershell
# Generate random secrets
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

Run this command 3 times to generate 3 different secrets for:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_TEMP_SECRET`

### 3. Complete `.env` Configuration

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vrstore?schema=public"

# JWT Secrets (use generated secrets)
JWT_ACCESS_SECRET=your-generated-secret-1
JWT_REFRESH_SECRET=your-generated-secret-2
JWT_TEMP_SECRET=your-generated-secret-3

# JWT Expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
JWT_TEMP_EXPIRY=15m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

# Email (choose one option from above)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email From
EMAIL_FROM_NAME=VRStore
EMAIL_FROM_ADDRESS=noreply@vrstore.com

# Application
APP_NAME=VRStore
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Security
BCRYPT_ROUNDS=12
MIN_AGE_REQUIREMENT=13

# CORS
CORS_ORIGIN=http://localhost:3001
```

---

## Running the Application

### 1. Install Dependencies

```powershell
npm install
```

### 2. Generate Prisma Client

```powershell
npm run prisma:generate
```

### 3. Run Migrations

```powershell
npm run prisma:migrate
```

### 4. Start Development Server

```powershell
npm run start:dev
```

### 5. Verify Everything Works

Open your browser and navigate to:

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

---

## Troubleshooting

### "Cannot connect to database"

**Check PostgreSQL is running:**
```powershell
Get-Service postgresql*
```

**Start PostgreSQL if stopped:**
```powershell
Start-Service postgresql-x64-14  # Adjust version number
```

**Test connection:**
```powershell
psql -U postgres -d vrstore
```

### "Cannot connect to Redis"

**WSL:**
```powershell
wsl sudo service redis-server start
wsl redis-cli ping
```

**Docker:**
```powershell
docker start <redis-container-id>
```

### "Prisma Client not generated"

```powershell
npm run prisma:generate
```

### "Migration failed"

```powershell
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then run migrations again
npm run prisma:migrate
```

### "Email not sending"

1. Check your email service configuration in `.env`
2. For Gmail, ensure you're using an App Password, not your regular password
3. Check console logs for error messages
4. In development, set `EMAIL_SERVICE=console` to log OTPs to console

### "Port 3000 already in use"

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### "Module not found" errors

```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## Next Steps

After successful setup:

1. ✅ Test the signup flow using Swagger docs
2. ✅ Create a test user account
3. ✅ Verify OTP emails are being sent/logged
4. ✅ Test both individual and organization signup paths
5. ✅ Set up your frontend to connect to the API

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs in the terminal
2. Review the Prisma migration logs
3. Verify all environment variables are set correctly
4. Ensure all services (PostgreSQL, Redis) are running
