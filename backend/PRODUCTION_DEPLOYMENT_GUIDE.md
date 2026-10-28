# Backend Deployment Guide - PostgreSQL Native (No Prisma)

## 🎯 Overview

This guide covers deploying the NestJS backend to cPanel after migrating from Prisma ORM to native PostgreSQL with the `pg` library.

## 📋 Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Tests passing (`npm test`)
- [ ] Database connection tested locally
- [ ] Environment variables documented
- [ ] Health check endpoints working
- [ ] Production build successful

## 🚀 Deployment Steps

### 1. Build Production Bundle

```bash
cd backend
npm run build:prod
```

This creates a `dist/` folder with:
- Compiled JavaScript files
- package.json & package-lock.json
- .env.example template
- README.md with deployment instructions

### 2. Prepare Environment Variables

Create `.env` file on the server with:

```env
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Secrets (generate unique secrets)
JWT_SECRET=<generate-32-byte-hex>
JWT_REFRESH_SECRET=<generate-32-byte-hex>

# API Configuration
API_PREFIX=api

# CORS (your frontend domain)
CORS_ORIGIN=https://yourdomain.com
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Upload to cPanel

**Via FTP/SFTP:**
1. Connect to your cPanel server
2. Navigate to `/home/username/nodejs/api/`
3. Upload entire `dist/` folder contents
4. Upload `.env` file (create from .env.example)

**Via cPanel File Manager:**
1. Login to cPanel
2. Open File Manager
3. Navigate to `/home/username/nodejs/api/`
4. Upload dist.zip (if zipped) and extract
5. Create `.env` file with your configuration

### 4. Install Dependencies

**Via cPanel Terminal:**
```bash
cd /home/username/nodejs/api
npm install --production
```

**Via SSH (if available):**
```bash
ssh username@yourdomain.com
cd nodejs/api
npm install --production
```

### 5. Configure cPanel Node.js App

1. Login to cPanel
2. Go to **Setup Node.js App**
3. Click **Create Application**

**Configuration:**
- Node.js version: `18.x` or higher
- Application mode: `Production`
- Application root: `/home/username/nodejs/api`
- Application URL: `api.yourdomain.com` (or subdomain)
- Application startup file: `main.js`
- Environment variables: (add from .env)

4. Click **Create**

### 6. Start Application

In cPanel Node.js App Manager:
1. Find your application
2. Click **Start**
3. Wait for status: **Running**

### 7. Verify Deployment

**Health Check Endpoints:**

```bash
# Overall health
curl https://api.yourdomain.com/api/health

# Database connection
curl https://api.yourdomain.com/api/health/db

# Readiness probe
curl https://api.yourdomain.com/api/health/ready

# Liveness probe
curl https://api.yourdomain.com/api/health/live
```

**Or use the health check script:**
```bash
npm run health https://api.yourdomain.com
```

**Expected Response (health endpoint):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-21T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "responseTime": "15ms",
  "environment": "production",
  "nodeVersion": "v18.20.8"
}
```

### 8. Access API Documentation

Swagger UI available at:
```
https://api.yourdomain.com/api/docs
```

## 🔧 Post-Deployment Configuration

### Database Setup

**If database not yet created:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE your_database_name;

# Create user
CREATE USER your_username WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;

# Exit
\q
```

**Run migrations (if using migration system):**
```bash
cd /home/username/nodejs/api
npm run migration:run
```

**Seed initial data (optional):**
```bash
npm run db:seed
```

### CORS Configuration

Update CORS origins in cPanel environment variables or .env:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### SSL Certificate

Ensure SSL is configured in cPanel:
1. Go to **SSL/TLS Status**
2. Select your domain
3. Click **Run AutoSSL** (if using Let's Encrypt)

## 📊 Monitoring

### Application Logs

**Via cPanel:**
1. Node.js App Manager
2. Click your application
3. View **Application Logs**

**Via SSH:**
```bash
cd /home/username/nodejs/api
tail -f logs/application.log  # if logging to file
```

### Health Monitoring

Set up a monitoring service (e.g., UptimeRobot, Pingdom) to check:
- `/api/health` endpoint every 5 minutes
- Alert if status !== "ok"
- Alert if response time > 5000ms

### Database Monitoring

Check connection pool status periodically:

```bash
curl https://api.yourdomain.com/api/health/db
```

## 🐛 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
cd /home/username/nodejs/api
cat logs/*.log
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port already in use
- Node.js version mismatch

**Solutions:**
1. Verify all environment variables in `.env`
2. Test database connection manually
3. Restart cPanel Node.js app
4. Check Node.js version matches (18.x+)

### Database Connection Errors

**Error: "password authentication failed"**
- Verify DATABASE_URL credentials
- Check PostgreSQL user permissions
- Ensure database exists

**Error: "connection refused"**
- Check PostgreSQL is running
- Verify host and port in DATABASE_URL
- Check firewall rules

**Test connection manually:**
```bash
psql "postgresql://username:password@localhost:5432/database_name"
```

### 502 Bad Gateway

**Causes:**
- Application crashed
- Application not started
- Port mismatch

**Solutions:**
1. Check application logs
2. Restart application in cPanel
3. Verify startup file is correct (`main.js`)
4. Check PORT environment variable

### Memory Issues

**Error: "JavaScript heap out of memory"**

**Solution:** Increase Node.js memory limit in cPanel:
```
NODE_OPTIONS=--max-old-space-size=2048
```

Add to environment variables in cPanel Node.js App Manager.

### Performance Issues

**Slow response times:**

1. **Check database connection pool:**
   - Default: 20 connections
   - Adjust in `database.service.ts` if needed

2. **Enable production optimizations:**
   - Ensure `NODE_ENV=production`
   - Verify build was production build

3. **Database query optimization:**
   - Check slow query logs
   - Add indexes if needed
   - Use EXPLAIN ANALYZE for slow queries

## 🔄 Updates and Redeployment

### Deploying Updates

```bash
# 1. Build new version
npm run build:prod

# 2. Upload dist/ folder (replace existing)
# Via FTP or cPanel File Manager

# 3. Restart application
# Via cPanel Node.js App Manager
```

### Zero-Downtime Updates

1. **Set up staging environment** (optional)
2. **Test updates on staging** first
3. **Quick swap:**
   - Upload to `/home/username/nodejs/api-new/`
   - Test new version
   - Swap symlinks or rename folders
   - Restart application

### Database Migrations

**Before deploying schema changes:**

```bash
# 1. Backup database
pg_dump -U username database_name > backup.sql

# 2. Test migration locally
npm run migration:run

# 3. Deploy migration on server
cd /home/username/nodejs/api
npm run migration:run

# 4. Restart application
```

## 🔐 Security Best Practices

### Environment Variables

- [ ] Use strong, unique JWT secrets (32+ bytes)
- [ ] Never commit .env files to git
- [ ] Rotate secrets periodically
- [ ] Use different secrets for dev/prod

### Database Security

- [ ] Use strong database password
- [ ] Limit database user permissions
- [ ] Enable SSL for database connections (if supported)
- [ ] Regular backups

### API Security

- [ ] Enable CORS only for trusted domains
- [ ] Use HTTPS (SSL) for all endpoints
- [ ] Implement rate limiting (if not done)
- [ ] Keep dependencies updated

## 📚 Additional Resources

- **NestJS Production Docs:** https://docs.nestjs.com/
- **PostgreSQL Connection Pooling:** https://node-postgres.com/features/pooling
- **cPanel Node.js Docs:** Check your cPanel documentation

## 🆘 Support

If deployment issues persist:

1. Check application logs in cPanel
2. Verify all checklist items above
3. Test health endpoints
4. Check database connectivity
5. Review environment variables

**Common Commands:**
```bash
# Check logs
tail -f /home/username/nodejs/api/logs/*.log

# Test database connection
psql $DATABASE_URL

# Restart application (via cPanel)
# Node.js App Manager → Stop → Start

# Check process
ps aux | grep node
```

---

**Deployment Status:**
- ✅ Migration from Prisma to pg complete
- ✅ All services migrated to native SQL
- ✅ Health checks implemented
- ✅ Production build script created
- ✅ Deployment documentation updated

**Ready for Production! 🚀**
