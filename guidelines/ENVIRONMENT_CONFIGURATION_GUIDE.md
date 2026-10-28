# 🔧 Environment Configuration Guide

## Overview

This project uses **separate environment files** for development and production to preserve your cPanel deployment configuration while allowing local development.

## File Structure

```
📁 Project Root
├── .env                    ← Active config (DO NOT edit directly)
├── .env.development        ← Local development settings
├── .env.production         ← cPanel production settings
├── .env.backup            ← Auto-created during build (temporary)
│
📁 backend/
├── .env                    ← Active config (DO NOT edit directly)
├── .env.development        ← Local development settings
├── .env.production         ← cPanel production settings
└── .env.backup            ← Auto-created during build (temporary)
```

---

## 🎯 How It Works

### 1. **Development Mode** (Local Work)
When working locally on your machine:

```powershell
# Switch to development mode
Copy-Item .env.development .env -Force
Copy-Item backend\.env.development backend\.env -Force

# Start development
npm run dev                    # Frontend
cd backend && npm run start:dev  # Backend
```

**Settings:**
- Frontend API: `http://localhost:3001/api`
- Backend Port: `3001`
- Database: Local PostgreSQL
- CORS: Allows localhost origins

---

### 2. **Production Build** (cPanel Deployment)
When building for cPanel deployment:

```powershell
# Just run the build script - it handles everything!
.\build-for-cpanel.ps1

# What happens automatically:
# 1. Backs up current .env files to .env.backup
# 2. Copies .env.production to .env
# 3. Builds frontend and backend
# 4. Creates deployment ZIPs
# 5. Restores original .env files from backup
```

**Settings:**
- Frontend API: `https://urjourney.in/api`
- Backend Port: `3001` (configured in cPanel)
- Database: cPanel PostgreSQL
- CORS: Allows production domains only

---

## 📝 Configuration Files

### Frontend `.env.development`
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME="DPDP Compliance Platform"
VITE_APP_VERSION="1.0.0"
```

### Frontend `.env.production`
```env
VITE_API_URL=https://urjourney.in/api
VITE_APP_NAME="DPDP Compliance Platform"
VITE_APP_VERSION="1.0.0"
```

### Backend `.env.development`
```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/dymgcxar_AI_police_v2"
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRATION="1h"
REFRESH_TOKEN_SECRET="dev-refresh-secret"
REFRESH_TOKEN_EXPIRATION="7d"
PORT=3001
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### Backend `.env.production`
```env
NODE_ENV=production
DATABASE_URL="postgresql://cpanel_user:cpanel_pass@localhost:5432/dymgcxar_AI_police_v2"
JWT_SECRET="<STRONG-32-CHAR-SECRET>"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_SECRET="<ANOTHER-STRONG-SECRET>"
REFRESH_TOKEN_EXPIRATION="7d"
PORT=3001
CORS_ORIGINS="https://urjourney.in,https://www.urjourney.in"
```

---

## 🔐 Security Best Practices

### 1. Generate Strong Secrets

**PowerShell (Windows):**
```powershell
# Generate a 32-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Bash (Linux/Mac):**
```bash
# Generate a 32-character random string
openssl rand -base64 32
```

**Online Tool:**
```
https://generate-random.org/api-token-generator?count=2&length=32
```

### 2. Update Production Secrets

**IMPORTANT:** Before deploying to cPanel, update `backend/.env.production`:

```env
# Replace these with your generated secrets:
JWT_SECRET="aB3dE8fG2hI5jK7lM0nO9pQ4rS6tU1vW"
REFRESH_TOKEN_SECRET="xY9zA2bC5dE8fG1hI4jK7lM0nO3pQ6rS"
```

### 3. Update Database Credentials

Update `backend/.env.production` with your actual cPanel PostgreSQL credentials:

```env
# Format:
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"

# Example:
DATABASE_URL="postgresql://dymgcxar_admin:MySecurePass123@localhost:5432/dymgcxar_AI_police_v2"
```

**Where to find these:**
1. Login to cPanel
2. Go to "PostgreSQL Databases"
3. Find your database name and username
4. Use the password you set when creating the user

---

## 🚀 Common Workflows

### Starting Local Development

```powershell
# 1. Switch to development mode
Copy-Item .env.development .env -Force
Copy-Item backend\.env.development backend\.env -Force

# 2. Install dependencies (first time only)
npm install
cd backend
npm install
cd ..

# 3. Start backend
cd backend
npm run start:dev

# 4. In a new terminal, start frontend
npm run dev

# 5. Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
# API Docs: http://localhost:3001/api/docs
```

### Building for cPanel Deployment

```powershell
# 1. Update backend/.env.production with real credentials (one-time setup)
# 2. Run build script (handles everything automatically)
.\build-for-cpanel.ps1

# 3. Upload generated files
# - deploy/frontend-upload.zip → cPanel public_html/trinetrai/
# - deploy/backend-upload.zip → cPanel nodejs_apps/backend/

# 4. Your original .env files are automatically restored!
```

### Switching Environments Manually

```powershell
# To Development
Copy-Item .env.development .env -Force
Copy-Item backend\.env.development backend\.env -Force

# To Production
Copy-Item .env.production .env -Force
Copy-Item backend\.env.production backend\.env -Force

# Verify current environment
Get-Content .env | Select-String "VITE_API_URL"
Get-Content backend\.env | Select-String "NODE_ENV"
```

---

## 🔍 Troubleshooting

### Issue: "API calls failing in development"
**Solution:** Verify you're in development mode
```powershell
Get-Content .env
# Should show: VITE_API_URL=http://localhost:3001/api
```

### Issue: "Database connection error"
**Solution:** Check your DATABASE_URL
```powershell
Get-Content backend\.env | Select-String "DATABASE_URL"
# Development: Should show localhost
# Production: Should show your cPanel credentials
```

### Issue: "CORS errors in browser"
**Solution:** Check CORS_ORIGINS matches your environment
```powershell
Get-Content backend\.env | Select-String "CORS_ORIGINS"
# Development: Should include localhost:5173
# Production: Should include urjourney.in
```

### Issue: "Build script not using production settings"
**Solution:** Ensure `.env.production` files exist
```powershell
Test-Path .env.production
Test-Path backend\.env.production
# Both should return: True
```

### Issue: "My .env got overwritten"
**Solution:** The build script creates backups automatically
```powershell
# If build is in progress, .env.backup exists
Copy-Item .env.backup .env -Force
Copy-Item backend\.env.backup backend\.env -Force

# Or switch back to development
Copy-Item .env.development .env -Force
```

---

## 📋 Checklist: Before First Deployment

```
Configuration Setup:
[ ] .env.development exists (frontend)
[ ] .env.production exists (frontend) 
[ ] backend/.env.development exists
[ ] backend/.env.production exists

Production Secrets:
[ ] Generated strong JWT_SECRET (32+ chars)
[ ] Generated strong REFRESH_TOKEN_SECRET (32+ chars)
[ ] Updated DATABASE_URL with real cPanel credentials
[ ] Updated CORS_ORIGINS with production domain

Testing:
[ ] Tested local development (npm run dev)
[ ] Backend starts without errors
[ ] Frontend connects to backend API
[ ] Test build script: .\build-for-cpanel.ps1
[ ] Verified .env files restored after build

Security:
[ ] All .env files are in .gitignore
[ ] Never committed actual secrets to git
[ ] Used different secrets for dev and prod
[ ] Database password is strong
```

---

## 🆘 Need Help?

### Check Active Configuration
```powershell
# Frontend
Write-Host "=== Frontend Config ===" -ForegroundColor Cyan
Get-Content .env

# Backend
Write-Host "`n=== Backend Config ===" -ForegroundColor Cyan
Get-Content backend\.env
```

### Quick Reset to Development
```powershell
# Safe reset command
Copy-Item .env.development .env -Force
Copy-Item backend\.env.development backend\.env -Force
Write-Host "✓ Switched to DEVELOPMENT mode" -ForegroundColor Green
```

### View Build Script Behavior
```powershell
# Dry run - see what would happen (add to script if needed)
Get-Content build-for-cpanel.ps1 | Select-String "env"
```

---

## 📚 Additional Resources

- **PostgreSQL Connection Strings:** https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
- **JWT Best Practices:** https://datatracker.ietf.org/doc/html/rfc8725
- **CORS Configuration:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html

---

**✅ Your cPanel configuration is safe!** The build script automatically preserves your original settings.
