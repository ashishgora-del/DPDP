# cPanel Node.js App Configuration

**Copy these exact values into cPanel Node.js Selector**

---

## 🔧 Create New Application Form

### Field 1: Node.js version
```
20.11.1  (or latest available)
```

### Field 2: Application mode
```
production
```

### Field 3: NODE_ENV variable
```
production
```

### Field 4: Application root
```
/home/yourUsername/nodesjs/api
```
*(Replace `yourUsername` with your actual cPanel username)*

### Field 5: Application URL
```
https://api.urjourney.in
```
*(Or if same domain: https://urjourney.in/api)*

### Field 6: Application startup file
```
dist/main.js
```

---

## 📋 Complete Form Example

```
┌─────────────────────────────────────────────────┐
│ Create New Node.js Application                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Node.js version:        [20.11.1         ▼]   │
│                                                 │
│ Application mode:       [production      ▼]   │
│                                                 │
│ NODE_ENV variable:      [production          ] │
│                                                 │
│ Application root:       [/home/yourUsername/  │
│                          nodesjs/api          ] │
│                                                 │
│ Application URL:        [https://api.urjourney│
│                          .in                   ] │
│                                                 │
│ Application startup:    [dist/main.js         ] │
│                                                 │
│                      [Create] [Cancel]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ After Clicking "Create"

cPanel will:
1. Create `/home/yourUsername/nodesjs/api/` directory
2. Set up reverse proxy to your domain
3. **DO NOT** auto-install npm packages

---

## 📤 Next Steps (GUI Only)

### Step 1: Upload ZIP via File Manager
1. Open **File Manager** in cPanel
2. Navigate to: `/home/yourUsername/nodesjs/api/`
3. Upload: `dpdp-backend-deployment.zip`
4. Right-click → **Extract**
5. Confirm to replace files
6. Delete the ZIP file

### Step 2: Install Dependencies via cPanel
1. Go back to **Node.js Selector**
2. Find your created app
3. Look for "Edit Environment" button
4. Find the **Terminal** or **Console** tab
5. Run: `npm install --production`
   *(Wait for completion - may take 2-5 minutes)*

### Step 3: Set Environment Variables
In Node.js Selector → Edit Environment:

```
DATABASE_URL = postgresql://dpdp_user:password@localhost:5432/dpdp_db
JWT_SECRET = (your-generated-secret-min-32-chars)
JWT_REFRESH_SECRET = (your-generated-secret-min-32-chars)
CORS_ORIGIN = https://urjourney.in,https://urjourney.in/trinetrai
LOG_LEVEL = info
```

### Step 4: Run Database Migrations
In Terminal/Console:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Step 5: Start the App
1. Click **Start** button in Node.js Selector
2. Status should show: ✅ Running
3. Check logs for: `🚀 Application is running on: http://localhost:3000`

---

## 🔗 Test Backend API

Visit in browser:
```
https://api.urjourney.in/api/docs
```

Should see Swagger documentation 📚

---

**No terminal/SSH needed - All via cPanel GUI!** ✅
