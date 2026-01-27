# VRStore Backend

A production-ready NestJS backend for the VRStore platform with comprehensive signup and onboarding system.

## Features

- ✅ Email OTP verification for signup
- ✅ Dual-path onboarding (Individual & Organization)
- ✅ Secure password hashing with bcrypt
- ✅ JWT-based authentication with refresh tokens
- ✅ Session management with device tracking
- ✅ Rate limiting on all auth endpoints
- ✅ Background job processing with BullMQ
- ✅ PostgreSQL database with Prisma ORM
- ✅ Comprehensive API documentation with Swagger
- ✅ 2FA integration points (TOTP ready)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **npm** or **yarn**

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to the backend directory
cd Backend

# Install dependencies
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vrstore?schema=public"

# JWT Secrets (IMPORTANT: Change these!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_TEMP_SECRET=your-super-secret-temp-key-change-this

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for development, emails will log to console)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## API Endpoints

### Signup Flow

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup/initiate` | POST | Initiate signup with email |
| `/auth/signup/verify-otp` | POST | Verify OTP code |
| `/auth/signup/resend-otp` | POST | Resend OTP code |
| `/auth/signup/set-password` | POST | Set password (requires temp token) |
| `/auth/signup/complete-individual` | POST | Complete individual signup |
| `/auth/signup/complete-organization` | POST | Complete organization signup |
| `/auth/signup/check-slug` | GET | Check organization slug availability |

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── controllers/         # API controllers
│   ├── services/            # Business logic
│   ├── dto/                 # Data transfer objects
│   └── guards/              # Auth guards
├── repositories/            # Data access layer
├── workers/                 # Background jobs
│   └── email/               # Email processing
├── common/                  # Shared utilities
│   └── utils/               # Helper functions
├── config/                  # Configuration files
├── prisma/                  # Prisma module
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

## Security Features

- **OTP Hashing**: All OTPs are hashed with bcrypt before storage
- **Password Hashing**: Passwords hashed with bcrypt (cost factor 12)
- **Refresh Token Hashing**: Refresh tokens hashed with SHA-256
- **Rate Limiting**: Protects against brute force attacks
- **Session Tracking**: Device and IP tracking for security
- **JWT Expiry**: Short-lived access tokens (15 min)

## Development Tools

```bash
# Format code
npm run format

# Lint code
npm run lint

# Generate Prisma client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
# Windows:
Get-Service postgresql*

# Test connection
psql -U username -d vrstore
```

### Redis Connection Issues

```bash
# Check Redis is running
# Windows (if using WSL):
wsl redis-cli ping

# Should return: PONG
```

### Email Not Sending

In development mode, emails are logged to the console. Check the terminal output for OTP codes.

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
