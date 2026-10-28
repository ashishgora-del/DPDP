# Backend Deployment Package

This folder contains the production-ready backend for cPanel deployment.

## 📦 Package Contents

```
backend/
├── dist/                    ← Compiled NestJS application
├── prisma/                  ← Database schemas and migrations
│   ├── schema.prisma       ← Database schema definition
│   └── migrations/         ← Migration files
├── package.json            ← Dependencies list
├── package-lock.json       ← Locked versions
└── .env                    ← Configuration (create on server)
```

## 🚀 Quick Start on cPanel

### 1. Upload to cPanel
```
Navigate to: /home/username/nodesjs/api/
Upload dist/, prisma/, package.json, package-lock.json
```

### 2. Install Dependencies
```bash
cd /home/username/nodesjs/api
npm install --production
```

### 3. Create .env File
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost/dpdp_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=https://urjourney.in
```

### 4. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 5. Start Application
```
cPanel → Node.js Selector → Create/Restart Application
```

## 📊 API Endpoints

Once running, API documentation available at:
```
https://api.urjourney.in/api/docs
```

## 🔧 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Signing secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
- `JWT_REFRESH_SECRET` - Refresh token secret

**Optional:**
- `NODE_ENV` - Set to "production"
- `PORT` - Usually 3000 (cPanel manages)
- `CORS_ORIGIN` - Frontend URL

## 🐛 Troubleshooting

**Application won't start:**
- Check environment variables in cPanel
- Verify database connection
- View logs in Node.js Selector

**Database errors:**
- Ensure migrations have run
- Check DATABASE_URL is correct
- Verify database user has proper permissions

**API returns 502:**
- Restart application in cPanel
- Check application logs

## 📚 Full Documentation

See [CPANEL_NODEJS_DEPLOYMENT_GUIDE.md](../CPANEL_NODEJS_DEPLOYMENT_GUIDE.md) for complete deployment instructions.
