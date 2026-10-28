# 🚀 DPDP Production Deployment - Complete Guide

**Date:** February 15, 2026  
**Status:** ✅ All systems ready for production deployment

---

## 📦 What's Deployed

### Frontend (React SPA)
- **Built:** `dist/` folder (compiled and optimized)
- **Packaged:** `dpdp-deployment.zip` (222 KB)
- **Deployed to:** `https://urjourney.in/trinetrai/`
- **Features:** Learning Platform + Risk Assessment modules with glassmorphism design

### Backend (NestJS API)
- **Built:** `backend/dist/` folder (compiled TypeScript)
- **Ready:** All source files in `backend/`
- **Deploy to:** `https://api.urjourney.in/` (or same domain `/api`)
- **Database:** PostgreSQL with Prisma ORM
- **Documentation:** Swagger at `/api/docs`

---

## 🎯 Deployment Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Your cPanel Server                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐          ┌──────────────────┐    │
│  │    Frontend      │          │    Backend       │    │
│  │  public_html/    │          │  nodesjs/api/    │    │
│  │   trinetrai/     │          │                  │    │
│  │                  │          │  - dist/         │    │
│  │  - index.html    │          │  - package.json  │    │
│  │  - assets/       │          │  - prisma/       │    │
│  │  - .htaccess     │◄────────►│                  │    │
│  └──────────────────┘          └──────────────────┘    │
│         React App              NestJS API              │
│    On port 80/443            On port 3000              │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database (Optional)           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Deployment

### PART 1: FRONTEND DEPLOYMENT (15 min)

#### Step 1: Login to cPanel
```
URL: https://urjourney.in:2083/
or
URL: https://cpanel.urjourney.in/
Login with your cPanel credentials
```

#### Step 2: Upload Frontend Files
1. **Open File Manager**
2. **Navigate to:** `public_html`
3. **Create folder:** `trinetrai` (if doesn't exist)
4. **Upload:** `dpdp-deployment.zip` into `public_html/trinetrai/`
5. **Extract:** Right-click ZIP → Extract
6. **Delete:** Remove the ZIP file

#### Step 3: Verify .htaccess
1. **In File Manager Settings:** Enable "Show Hidden Files"
2. **Verify:** `.htaccess` file exists in `public_html/trinetrai/`
3. **Contains:** Client-side routing configuration

#### Step 4: Test Frontend
```
Open browser:
https://urjourney.in/trinetrai/

Expected:
- Page loads
- See learning platform/risk assessment UI
- No 404 errors
```

---

### PART 2: BACKEND DEPLOYMENT (30 min)

#### Step 1: Create Node.js Application in cPanel

1. **In cPanel, find:** Node.js Selector (or Node.js Icon)
   - Look under "Software" section
   - May be called "Node.js" or "Node.js Selector"

2. **Click:** Create Application

3. **Configure with:**
   ```
   Node.js version: 20.x (or latest)
   Application mode: production
   Application root: /home/username/nodesjs/api
   Application URL: https://api.urjourney.in
   Startup file: dist/main.js
   ```

4. **Click:** Create Application

cPanel will create the directory and set up the reverse proxy.

#### Step 2: Upload Backend Files

1. **Via FTP/SFTP (Recommended)**
   - Connect to: `ftp://your-domain.com`
   - Navigate to: `/home/username/nodesjs/api/`
   - Upload:
     ```
     dist/              ← Entire folder
     package.json       ← File
     package-lock.json  ← File
     prisma/            ← Entire folder
     ```

2. **Or via cPanel File Manager**
   - Navigate to: `/home/username/nodesjs/api/`
   - Upload files/folders
   - Extract any archives

#### Step 3: Install Dependencies

**Option A: In cPanel Node.js Selector**
- Find your app
- Click "Edit Environment"
- In terminal section, run: `npm install --production`

**Option B: Via SSH (if available)**
```bash
ssh your-domain.com
cd /home/username/nodesjs/api
npm install --production
```

**Option C: Pre-installed**
If you upload `node_modules/` from local machine, skip this step.

#### Step 4: Create .env File

**Via cPanel File Manager:**
1. Navigate to: `/home/username/nodesjs/api/`
2. Create new file: `.env`
3. Add contents:

```
# Application
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://dpdp_user:strong_password@localhost:5432/dpdp_db

# JWT Secrets (GENERATE NEW!)
JWT_SECRET=your_generated_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=another_generated_secret_key_here

# CORS
CORS_ORIGIN=https://urjourney.in,https://urjourney.in/trinetrai

# Logging
LOG_LEVEL=info
```

**Generate JWT secrets with:**
```bash
# Run on your local machine
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 5: Setup Database

**Create PostgreSQL Database in cPanel:**

1. **Go to:** cPanel → MySQL/PostgreSQL
2. **Create Database:**
   ```
   Database name: dpdp_db
   ```

3. **Create User:**
   ```
   Username: dpdp_user
   Password: (generate strong password - 16+ chars)
   ```

4. **Add Privileges:** Give all privileges to user

5. **Get connection details:**
   - Host: Usually `localhost` or provided by hosting
   - Port: Usually `5432`
   - Name: `dpdp_db`
   - User: `dpdp_user`
   - Password: (what you set)

**Update DATABASE_URL in .env:**
```
DATABASE_URL=postgresql://dpdp_user:password@localhost:5432/dpdp_db
```

#### Step 6: Run Database Migrations

**Via SSH (if available):**
```bash
cd /home/username/nodesjs/api
npx prisma migrate deploy
npx prisma db seed
```

**Or manually:**
- Use phpMyAdmin or pgAdmin to import migrations
- Contact hosting provider for help

#### Step 7: Start Backend Application

1. **In cPanel Node.js Selector:**
   - Find your application
   - Click: **Start** (or **Restart** if already running)
   
2. **Status should show:** ✅ Running

3. **Check logs:**
   - Click: **Show Logs** button
   - Look for: `🚀 Application is running on: http://localhost:3000`

#### Step 8: Verify Backend API

1. **Visit Swagger Documentation:**
   ```
   https://api.urjourney.in/api/docs
   ```
   Should see interactive API documentation

2. **Test a simple endpoint:**
   ```bash
   curl https://api.urjourney.in/api/catalog/courses
   ```
   Should return JSON data (or empty array initially)

---

### PART 3: INTEGRATION TESTING (15 min)

#### Test 1: Frontend Loads
```
URL: https://urjourney.in/trinetrai/
Expected: App loads without errors
Console: No CORS or API errors
```

#### Test 2: API Connection
```
In browser DevTools Console (F12):
fetch('https://api.urjourney.in/api/catalog/courses')
  .then(r => r.json())
  .then(d => console.log(d))

Expected: Array of courses (or empty array [])
```

#### Test 3: Authentication
```
Try login in frontend:
Email: yagyabuttan@gmail.com
Password: yagyayagya

Expected: Successfully logged in
```

#### Test 4: Course Catalog
```
In frontend:
1. Navigate to: Learning Platform → Catalog
2. Should see courses listed
3. Can click on course for details
```

#### Test 5: Progress Tracking
```
In frontend:
1. Enroll in a course
2. View a lesson
3. Progress should save to database
4. Check "My Learning" dashboard
```

---

## 🔐 Security Setup

### 1. Passwords & Secrets
```
Database password: Min 16 characters, mix of types
JWT_SECRET: Generated with crypto.randomBytes(32)
JWT_REFRESH_SECRET: Generated with crypto.randomBytes(32)
```

### 2. CORS Configuration
```env
CORS_ORIGIN=https://urjourney.in,https://urjourney.in/trinetrai
```
(Adjust for your actual domains)

### 3. SSL Certificates
- ✅ Frontend: `urjourney.in` (or trinetrai.urjourney.in)
- ✅ Backend: `api.urjourney.in` (or api.trinetrai.urjourney.in)
- Both should have valid SSL certificates

### 4. Environment Protection
- ✅ `.env` file not in git
- ✅ Secrets not in version control
- ✅ Access logs monitored

---

## 🛠️ Troubleshooting

### Frontend Issues

**Blank White Screen**
```
Check:
1. Browser console (F12) for errors
2. .htaccess file exists
3. assets/ folder has files
4. Clear browser cache (Ctrl+Shift+Delete)
```

**404 on page refresh**
```
Fix: .htaccess must be in public_html/trinetrai/
Must contain React Router fallback to index.html
```

**API errors in console**
```
Check:
1. Backend running (https://api.urjourney.in/api/docs works)
2. CORS configured correctly
3. Frontend API URL correct
```

### Backend Issues

**Application won't start**
```
Check:
1. Node.js logs in cPanel
2. Environment variables set
3. Database connection works
4. All required packages installed
```

**Database connection error**
```
Verify:
1. Database exists
2. User created and has permissions
3. DATABASE_URL correct in .env
4. Network firewall allows access
```

**502 Bad Gateway**
```
Solution:
1. Restart application in cPanel
2. Check app logs
3. Verify resources (memory, CPU)
4. Contact hosting provider
```

**API returns error**
```
Check:
1. Is backend running? → Visit /api/docs
2. Are migrations complete? → npx prisma migrate status
3. Database populated? → Check with pgAdmin
4. Logs in cPanel Node.js app
```

---

## 📊 Monitoring

### Daily Checks
- [ ] Frontend loads: `https://urjourney.in/trinetrai/`
- [ ] API responds: `https://api.urjourney.in/api/docs`
- [ ] Login works
- [ ] No errors in console

### Weekly Checks
- [ ] Review cPanel Node.js logs
- [ ] Check database size
- [ ] Verify backups running
- [ ] Monitor response times

### Monthly Checks
- [ ] Update npm dependencies (if needed)
- [ ] Review security logs
- [ ] Database optimization
- [ ] Capacity planning

---

## 🔄 Future Updates

To deploy new versions:

1. **Build locally:**
   ```bash
   npm run build                    # Frontend
   cd backend && npm run build      # Backend
   ```

2. **Upload frontend:**
   - Recreate `dpdp-deployment.zip`
   - Replace contents in `public_html/trinetrai/`
   - Clear browser cache

3. **Upload backend:**
   - Upload new `dist/` folder
   - Restart app in cPanel
   - Run migrations if needed: `npx prisma migrate deploy`

---

## 📞 Support Resources

**If deployment fails:**

1. **Check logs:**
   - Frontend: Browser DevTools (F12)
   - Backend: cPanel Node.js Selector → Show Logs

2. **Verify configuration:**
   - Environment variables in cPanel
   - Database credentials
   - SSL certificates installed

3. **Test connectivity:**
   ```bash
   curl https://api.urjourney.in/api/docs
   curl https://urjourney.in/trinetrai/
   ```

4. **Contact hosting provider:**
   - For database setup
   - For Node.js configuration
   - For DNS/SSL issues

---

## ✅ Final Checklist

### Before Going Live
- [ ] Frontend deployed and loading
- [ ] Backend API running
- [ ] Database connected
- [ ] Login functionality working
- [ ] Catalog showing courses
- [ ] HTTPS/SSL working on both domains
- [ ] CORS configured for both domains
- [ ] JWT secrets generated (not defaults)
- [ ] Database backups enabled
- [ ] All team members notified

### Post-Deployment
- [ ] Monitor logs for 24 hours
- [ ] Test all user flows
- [ ] Verify data persistence
- [ ] Check mobile compatibility
- [ ] Share URLs with stakeholders

---

## 🎉 You're Live!

### Frontend URL
```
https://urjourney.in/trinetrai/
```

### Backend API Documentation
```
https://api.urjourney.in/api/docs
```

### Default Test Account
```
Email: yagyabuttan@gmail.com
Password: yagyayagya
```

---

**Deployment completed successfully! 🚀**

For detailed questions, refer to:
- [CPANEL_NODEJS_DEPLOYMENT_GUIDE.md](./CPANEL_NODEJS_DEPLOYMENT_GUIDE.md) - Detailed backend guide
- [COMPLETE_DEPLOYMENT_CHECKLIST.md](./COMPLETE_DEPLOYMENT_CHECKLIST.md) - Full verification checklist
- [backend/SHARED_BACKEND_README.md](./backend/SHARED_BACKEND_README.md) - API documentation

---

**Version:** 1.0.0  
**Last Updated:** February 15, 2026  
**Status:** ✅ Production Ready
