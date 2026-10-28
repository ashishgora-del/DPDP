# cPanel Node.js Backend Deployment Guide

## Overview

This guide explains how to deploy the DPDP Shared Backend (NestJS application) on cPanel hosting. Unlike traditional cPanel deployments, Node.js apps require special setup since cPanel doesn't provide terminal access for npm commands.

## ⚠️ Important Notes

- **No npm terminal access** on cPanel - we use cPanel's Node.js setup tools
- **Database migration** must be handled before or during setup
- **Environment variables** configured via cPanel interface
- **No experimental flags** - standard NestJS production build

---

## 📋 Prerequisites

Before deploying to cPanel, ensure you have:

1. **cPanel hosting account** with Node.js support
2. **Root domain or subdomain** for backend (e.g., `urjourney.in` or `api.urjourney.in`)
3. **PostgreSQL database** access (contact hosting provider if not available)
4. **Backend build folder** (`dist/` - already built locally)

---

## 🚀 Deployment Steps

### Step 1: Prepare Backend Files

**On your local machine (already done):**
- Backend built: `backend/dist/` folder exists
- Dependencies listed: `backend/package.json`
- Environment config: `.env.example` as reference

**Files needed for cPanel:**
```
backend/
├── dist/                 ← Compiled backend
├── node_modules/         ← Dependencies (or install on server)
├── package.json          ← Lists dependencies
├── .env                  ← Configuration (create on server)
└── prisma/
    └── migrations/       ← Database migrations
```

### Step 2: Create Backend ZIP Package

Create a deployment package with built files:

```
dpdp-backend-deployment.zip
├── dist/                 ← Compiled NestJS app
├── node_modules/         ← Pre-built dependencies (optional)
├── package.json
├── package-lock.json
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**Option A: With node_modules (Faster, ~200MB+)**
- Copy everything including `node_modules/`
- Upload once, no npm install needed
- Faster startup

**Option B: Without node_modules (Smaller, ~2MB)**
- Only upload `dist/`, `package.json`, `prisma/`
- cPanel installs dependencies
- Smaller upload size

**Recommendation: Option B** (we'll use this)

### Step 3: Login to cPanel

1. Open **cPanel** for your domain
2. Navigate to the hosting control panel
3. Locate **Node.js** or **Node.js Selector** option

### Step 4: Create Node.js Application in cPanel

**Method 1: Using cPanel GUI (Recommended)**

1. **Go to: Node.js Selector** (under Software section)
2. **Click: Create Application**
3. **Fill in:**
   ```
   Node.js version: 18.x or 20.x (latest stable)
   Application mode: production
   Application root: /home/username/nodesjs/api
   Application URL: https://api.urjourney.in (or your backend domain)
   Startup file: dist/main.js
   ```
4. **Click: Create**

cPanel will:
- ✅ Create the directory structure
- ✅ Set up automatic restarts
- ✅ Configure reverse proxy
- ✅ Provide environment configuration panel

### Step 5: Upload Backend Files

1. **Open cPanel File Manager**
2. **Navigate to:** `/home/username/nodesjs/api` (or your application root)
3. **Upload files:**
   - `dist/` folder (compiled backend)
   - `package.json`
   - `package-lock.json`
   - `prisma/` folder

**Via FTP/SFTP:**
```
FTP Connection:
Server: your-domain.com or ftp.your-domain.com
Port: 21 (or 22 for SFTP)
Username: cPanel username
Password: cPanel password
```

Upload to: `/home/username/nodesjs/api/`

### Step 6: Install Dependencies (if not included)

**In cPanel Node.js interface:**

1. **Go to: Node.js Selector**
2. **Find your application**
3. **Click: Edit Environment**
4. **In terminal section, run:**
   ```
   npm install --production
   ```

**Or via SSH (if available):**
```bash
cd /home/username/nodesjs/api
npm install --production
```

### Step 7: Set Environment Variables

**In cPanel Node.js interface:**

1. **Click: Edit Environment** for your app
2. **Set the following variables:**

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db-host:5432/dpdp_db
JWT_SECRET=your-long-random-secret-key-here
JWT_REFRESH_SECRET=another-long-random-secret-key
CORS_ORIGIN=https://urjourney.in,https://urjourney.in/trinetrai
```

**Get from `.env.example`:**
```bash
cat backend/.env.example
```

### Step 8: Database Setup

**Before starting backend:**

1. **Create PostgreSQL database** (via cPanel → MySQL/PostgreSQL)
2. **Run migrations:**

**Option A: SSH Terminal**
```bash
cd /home/username/nodesjs/api
npx prisma migrate deploy
npx prisma db seed
```

**Option B: Manual setup**
- Import `prisma/migrations/` manually
- Or contact hosting provider for help

**Database connection:**
```
Host: db.urjourney.in (or localhost)
Port: 5432
Database: dpdp_db
User: dpdp_user
Password: your-password
```

### Step 9: Start Application

**In cPanel Node.js Selector:**

1. **Click: Restart** (or **Start**)
2. Check status: Should show **Running**
3. View logs: **Show Logs** button

**Verify running:**
```bash
curl https://api.urjourney.in/api/docs
```

Should return Swagger UI documentation.

### Step 10: Configure Frontend API URL

**Update frontend deployment to point to backend:**

In cPanel File Manager, edit `.htaccess` or create `.env`:

```
VITE_API_URL=https://api.urjourney.in/api
```

Or the frontend will automatically use: `https://urjourney.in/api`

---

## 📁 Directory Structure on cPanel

```
/home/username/
├── public_html/              ← Frontend (React SPA)
│   └── trinetrai/            ← Frontend deployment root
│       ├── index.html
│       ├── assets/
│       └── .htaccess
│
└── nodesjs/
    └── api/                  ← Backend (Node.js app)
        ├── dist/             ← Compiled NestJS
        ├── node_modules/
        ├── package.json
        ├── prisma/
        └── .env              ← Configuration
```

---

## 🔐 Security Configuration

### 1. Database Security
```env
DATABASE_URL=postgresql://user:strong-password@secure-host:5432/dpdp_db
```

### 2. JWT Secrets (Generate new)
```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set in cPanel:
```
JWT_SECRET=<generated-string>
JWT_REFRESH_SECRET=<another-generated-string>
```

### 3. CORS Configuration
```env
CORS_ORIGIN=https://urjourney.in,https://urjourney.in/trinetrai
```

### 4. HTTPS/SSL
- Ensure SSL certificate installed on api.urjourney.in
- cPanel usually handles this automatically

---

## 🐛 Troubleshooting

### Application Won't Start

**Check:**
1. Node.js version compatibility (check `package.json` engines)
2. Environment variables set correctly
3. Port availability (usually handled by cPanel reverse proxy)
4. Database connection working

**View logs in cPanel:**
1. Node.js Selector → Your app → Show Logs
2. Check for errors

### Database Connection Error

```
Error: Can't reach database server
```

**Check:**
1. Database exists and accessible
2. DATABASE_URL correct in environment
3. Firewall allows connection
4. Contact hosting provider for DB host/port

### API Returns 502 Bad Gateway

**Usually means:**
- Application crashed
- Node.js not running
- Port misconfiguration

**Fix:**
1. Restart application in cPanel
2. Check logs for errors
3. Verify environment variables

### Migrations Failed

```
Error: migrations folder not found
```

**Run manually:**
```bash
cd /home/username/nodesjs/api
npx prisma migrate deploy
```

Or import SQL files directly via phpMyAdmin/pgAdmin.

---

## 📊 Monitoring & Maintenance

### View Application Logs
```
cPanel → Node.js Selector → Your App → Show Logs
```

### Restart Application
```
cPanel → Node.js Selector → Your App → Restart
```

### Update Dependencies
```bash
cd /home/username/nodesjs/api
npm update
```

### Database Backups
```bash
# PostgreSQL backup
pg_dump dpdp_db > backup.sql
```

---

## 🚀 Production Best Practices

1. ✅ **Use production build** (`dist/` folder)
2. ✅ **Set `NODE_ENV=production`**
3. ✅ **Use strong JWT secrets**
4. ✅ **Enable HTTPS/SSL**
5. ✅ **Regular database backups**
6. ✅ **Monitor application logs**
7. ✅ **Set up error alerting**

---

## 📝 Configuration Reference

### Startup File
```
dist/main.js
```

### Node.js Version
- Minimum: **18.x**
- Recommended: **20.x**

### Required Environment Variables
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=...
```

### Package.json scripts
```json
{
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "build": "nest build"
  }
}
```

---

## 🆘 Getting Help

**Contact hosting provider if:**
- Cannot create Node.js application
- Database connection issues
- Need help with migrations
- SSL certificate problems

**Check logs:**
```
cPanel → Node.js Selector → Show Logs
```

---

## ✅ Deployment Checklist

- [ ] Backend files uploaded to `/home/username/nodesjs/api/`
- [ ] Node.js application created in cPanel
- [ ] Environment variables configured
- [ ] Database created and migrations run
- [ ] Application started and running
- [ ] API accessible at https://api.urjourney.in/api/docs
- [ ] Frontend pointing to correct backend URL
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Application logs monitored

---

**Version:** 1.0.0  
**Last Updated:** February 2026

For more details on backend API, see [backend/SHARED_BACKEND_README.md](./backend/SHARED_BACKEND_README.md)
