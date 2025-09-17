# Database Setup Instructions

## Option 1: Local PostgreSQL Installation

### Windows (using Chocolatey)

```bash
choco install postgresql
```

### Windows (using Installer)

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember your postgres user password

### macOS (using Homebrew)

```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Option 2: Docker (Recommended for Development)

```bash
# Create and start PostgreSQL container
docker run --name lawfirm-postgres \
  -e POSTGRES_DB=lawfirm_db \
  -e POSTGRES_USER=lawfirm_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15

# Your DATABASE_URL would be:
# DATABASE_URL="postgresql://lawfirm_user:your_secure_password@localhost:5432/lawfirm_db"
```

## Option 3: Cloud PostgreSQL (Production)

### Supabase

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings > Database

### Railway

1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy connection string from Variables tab

### Neon

1. Go to https://neon.tech
2. Create new project
3. Copy connection string from dashboard

## Setup Steps

1. **Create Database User (for local installations)**

```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create user and database
CREATE USER lawfirm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
CREATE DATABASE lawfirm_db OWNER lawfirm_user;
GRANT ALL PRIVILEGES ON DATABASE lawfirm_db TO lawfirm_user;

-- Exit psql
\q
```

2. **Test Connection**

```bash
# Test with psql
psql "postgresql://lawfirm_user:your_secure_password@localhost:5432/lawfirm_db" -c "SELECT 1;"

# Or use our test script
npm run db:test
```

3. **Update Environment Variables**

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your actual database URL
DATABASE_URL="postgresql://lawfirm_user:your_secure_password@localhost:5432/lawfirm_db"
```

4. **Run Migrations**

```bash
npx prisma migrate dev
```
