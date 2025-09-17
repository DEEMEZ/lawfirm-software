# Law Firm SaaS Platform

A comprehensive multi-tenant law firm management system built with Next.js, TypeScript, and PostgreSQL.

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Multi-tenancy**: Row Level Security (RLS) with tenant isolation

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd lawfirm-software
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values:
# DATABASE_URL="postgresql://username:password@localhost:5432/lawfirm_db"
# JWT_SECRET="your-super-secret-jwt-key"
# NEXTAUTH_SECRET="your-nextauth-secret"
# NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Create the database
createdb lawfirm_db

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed initial data
npm run seed
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Create and apply new migration

## Multi-Tenant Architecture

This system uses PostgreSQL Row Level Security (RLS) to ensure complete tenant isolation:

- Each law firm is a separate tenant
- All data access is automatically filtered by `law_firm_id`
- Cross-tenant data access is impossible at the database level

## Authentication & Authorization

- NextAuth.js handles authentication
- JWT tokens contain `user_id`, `role`, and `law_firm_id` claims
- Role-based access control (RBAC) for different user types
- Automatic tenant context setting for all database operations

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Protected dashboard pages
├── lib/                # Shared utilities
│   ├── auth.ts         # Authentication helpers
│   ├── db.ts           # Database client with tenant context
│   └── env.ts          # Environment validation
├── generated/          # Prisma generated client
└── middleware.ts       # Request middleware
```

## Database Schema

Key tables:

- `platform_users` - Global user accounts
- `law_firms` - Tenant organizations
- `users` - Firm-specific user profiles
- `roles` - Permission definitions
- `user_roles` - User-role assignments

All tenant-scoped tables include `law_firm_id` for RLS policies.

## Development Notes

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Pre-commit hooks ensure code quality
- All environment variables validated at startup
