# DPDP Complete Deployment Checklist

## 📋 Pre-Deployment

### Environment Setup
- [ ] Backend built: `backend/dist/` folder created
- [ ] Frontend built: `dist/` folder created (for cPanel)
- [ ] `.env` files created with all required variables
- [ ] Database created on hosting
- [ ] SSL certificates ready for both domains

### Files Ready
- [ ] Frontend ZIP ready: `dpdp-deployment.zip`
- [ ] Backend files prepared:
  - [ ] `backend/dist/`
  - [ ] `backend/package.json`
  - [ ] `backend/package-lock.json`
  - [ ] `backend/prisma/`

---

## 🌐 Frontend Deployment (React)

### Upload to cPanel

**Location:** `https://urjourney.in/trinetrai/`

- [ ] Login to cPanel
- [ ] Open File Manager
- [ ] Navigate to `public_html`
- [ ] Create folder: `trinetrai`
- [ ] Upload `dpdp-deployment.zip` to `public_html/trinetrai/`
- [ ] Extract ZIP file
- [ ] Delete ZIP file after extraction

### Verify Frontend

- [ ] Files present:
  - [ ] `index.html`
  - [ ] `.htaccess`
  - [ ] `assets/` folder
- [ ] Visit `https://urjourney.in/trinetrai/`
- [ ] Page loads (may show "No routes matched" initially)
- [ ] Check browser console for errors

---

## 🔌 Backend Deployment (Node.js)

### Create Node.js Application in cPanel

- [ ] Open cPanel
- [ ] Go to: **Node.js Selector** (or Node.js Icon)
- [ ] Click: **Create Application**
- [ ] Configure:
  - Node.js version: **20.x** (or latest)
  - Application mode: **production**
  - Application root: `/home/username/nodesjs/api`
  - Application URL: `https://api.urjourney.in` (or your backend domain)
  - Startup file: `dist/main.js`
- [ ] Click: **Create**

### Upload Backend Files

- [ ] Create folder: `/home/username/nodesjs/api/`
- [ ] Upload to this folder:
  - [ ] `dist/` folder (entire directory)
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `prisma/` folder

### Install Dependencies

- [ ] In cPanel Node.js interface, run:
  ```
  npm install --production
  ```
  
  Or via SSH if available:
  ```bash
  cd /home/username/nodesjs/api
  npm install --production
  ```

### Configure Environment Variables

- [ ] In cPanel Node.js interface, set:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dpdp_db
JWT_SECRET=<generate-new-random-string>
JWT_REFRESH_SECRET=<generate-new-random-string>
CORS_ORIGIN=https://urjourney.in,https://urjourney.in/trinetrai
LOG_LEVEL=info
```

**Generate secrets with:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Setup

- [ ] Create PostgreSQL database (via cPanel)
  - Database name: `dpdp_db`
  - User: `dpdp_user`
  - Password: (strong password)

- [ ] Run migrations:
  ```bash
  cd /home/username/nodesjs/api
  npx prisma migrate deploy
  npx prisma db seed
  ```

### Start Application

- [ ] In cPanel Node.js Selector:
  - [ ] Click: **Start** or **Restart**
  - [ ] Status should show: **Running**
  - [ ] Check logs for any errors

### Verify Backend

- [ ] Visit: `https://api.urjourney.in/api/docs`
  - Should show Swagger UI documentation
  
- [ ] Test authentication endpoint:
  ```bash
  curl -X POST https://api.urjourney.in/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
  ```

---

## 🔗 Frontend-Backend Integration

### Update Frontend API URL

The frontend is configured to automatically detect:
- **Development:** Uses `http://localhost:3001/api`
- **Production:** Uses `https://urjourney.in/api` (same domain)

**If backend on different domain (e.g., api.urjourney.in):**

In cPanel, create `.htaccess` in `public_html/trinetrai/`:
```apache
# Add this if API on different domain
<IfModule mod_env.c>
  SetEnv VITE_API_URL https://api.urjourney.in/api
</IfModule>
```

### Test Frontend-Backend Connection

1. Open frontend in browser: `https://urjourney.in/trinetrai/`
2. Open browser DevTools Console (F12)
3. Check for any API errors
4. Try logging in with credentials:
   - Email: `yagyabuttan@gmail.com`
   - Password: `yagyayagya`
5. Verify courses load in catalog

---

## 🔐 Security Checklist

### SSL/HTTPS
- [ ] SSL certificate installed for frontend domain
- [ ] SSL certificate installed for backend domain
- [ ] Both domains accessible via HTTPS

### Secrets & Keys
- [ ] JWT_SECRET generated and set (not default)
- [ ] JWT_REFRESH_SECRET generated and set
- [ ] Database password strong (min 16 characters)
- [ ] Never commit `.env` files to git

### CORS Configuration
- [ ] CORS_ORIGIN set to frontend domain
- [ ] No `*` (wildcard) in production CORS

### Database Security
- [ ] Database user has minimum required permissions
- [ ] Database not accessible from public internet
- [ ] Regular backups enabled

---

## 📊 Post-Deployment Testing

### Frontend Tests
- [ ] Home page loads
- [ ] Navigation works
- [ ] Learning Platform accessible at `/learning-platform`
- [ ] Risk Assessment accessible at `/risk-assessment`
- [ ] Login/Register functionality works
- [ ] Catalog shows courses
- [ ] No 404 errors on page refresh
- [ ] Mobile responsive

### Backend Tests
- [ ] Swagger docs accessible: `/api/docs`
- [ ] Health check: `GET /health`
- [ ] Authentication working: `POST /api/auth/login`
- [ ] Can fetch courses: `GET /api/catalog/courses`
- [ ] Database queries executing properly
- [ ] Logs showing normal operation

### Integration Tests
- [ ] Frontend can fetch from backend
- [ ] Login token persists
- [ ] Can enroll in courses
- [ ] Progress saved to database
- [ ] No CORS errors

---

## 🚨 Troubleshooting

### Frontend Shows Blank Page
- [ ] Check browser console for errors
- [ ] Verify `.htaccess` file exists
- [ ] Check assets folder has files
- [ ] View source to see if HTML loaded

### Backend Won't Start
- [ ] Check Node.js logs in cPanel
- [ ] Verify environment variables set
- [ ] Ensure database connection works
- [ ] Check file permissions

### API Returns 502
- [ ] Restart Node.js app in cPanel
- [ ] Check application logs
- [ ] Verify database is running
- [ ] Check CPU/memory usage limits

### Database Connection Errors
- [ ] Verify DATABASE_URL is correct
- [ ] Test connection with psql/pgAdmin
- [ ] Check firewall allows connection
- [ ] Verify database user permissions

### CORS Errors
- [ ] Frontend and backend domains must match CORS_ORIGIN
- [ ] Check exact domain format in CORS_ORIGIN
- [ ] Restart backend after changing CORS

---

## 📈 Monitoring & Maintenance

### Daily
- [ ] Check application logs for errors
- [ ] Monitor API response times
- [ ] Verify database is responsive

### Weekly
- [ ] Check disk space usage
- [ ] Review error logs
- [ ] Verify backups completed

### Monthly
- [ ] Update npm dependencies (if needed)
- [ ] Review security settings
- [ ] Database optimization checks

---

## 🔄 Update Process (Future)

To deploy updates:

1. **Build locally:**
   ```bash
   npm run build              # Frontend
   cd backend && npm run build # Backend
   ```

2. **Frontend update:**
   - Recreate `dpdp-deployment.zip`
   - Upload and extract to cPanel
   - Clear browser cache (Ctrl+Shift+Delete)

3. **Backend update:**
   - Upload new `dist/` folder
   - Run migrations if needed: `npx prisma migrate deploy`
   - Restart in cPanel

---

## 📞 Support

**For deployment issues:**
1. Check relevant log files
2. Review configuration in cPanel
3. Verify all environment variables
4. Test API endpoints manually
5. Contact hosting provider if needed

**For code issues:**
- Check application error logs
- Verify database schema with migrations
- Test API with curl or Postman

---

## ✅ Final Verification

- [ ] Frontend loading at `https://urjourney.in/trinetrai/`
- [ ] Backend API responding at `https://api.urjourney.in/api/docs`
- [ ] Login working correctly
- [ ] Courses displaying in catalog
- [ ] Database storing data
- [ ] No errors in browser console
- [ ] No errors in cPanel application logs
- [ ] HTTPS working on both domains
- [ ] Mobile view working

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes:** 
_________________________________________________________

---

For detailed documentation, see:
- Frontend: [CPANEL_DEPLOYMENT_GUIDE.md](./CPANEL_DEPLOYMENT_GUIDE.md)
- Backend: [CPANEL_NODEJS_DEPLOYMENT_GUIDE.md](./CPANEL_NODEJS_DEPLOYMENT_GUIDE.md)
