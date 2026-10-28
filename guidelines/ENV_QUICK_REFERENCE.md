# 🚀 Environment Quick Reference Card

## 📌 Pin This - Most Used Commands

### Switch to Development Mode
```powershell
.\switch-env.ps1 dev
```

### Switch to Production Mode
```powershell
.\switch-env.ps1 prod
```

### Check Current Environment
```powershell
.\switch-env.ps1 status
```

### Build for cPanel Deployment
```powershell
.\build-for-cpanel.ps1
# Automatically uses production config and restores afterwards
```

---

## 📂 File Reference

| File | Purpose | Edit? |
|------|---------|-------|
| `.env` | Active config (auto-managed) | ❌ No |
| `.env.development` | Local dev settings | ✅ Yes |
| `.env.production` | cPanel settings | ✅ Yes (once) |
| `backend/.env` | Active config (auto-managed) | ❌ No |
| `backend/.env.development` | Local dev settings | ✅ Yes |
| `backend/.env.production` | cPanel settings | ✅ Yes (once) |

---

## 🎯 Daily Workflow

### Morning Routine
```powershell
# 1. Switch to dev mode (if not already)
.\switch-env.ps1 dev

# 2. Start development
npm run dev                      # Terminal 1 - Frontend
cd backend && npm run start:dev  # Terminal 2 - Backend
```

### Before Deployment
```powershell
# 1. Commit your code
git add .
git commit -m "Your message"
git push

# 2. Build for cPanel
.\build-for-cpanel.ps1

# 3. Upload files
# deploy/frontend-upload.zip → cPanel public_html/trinetrai/
# deploy/backend-upload.zip → cPanel nodejs_apps/backend/
```

---

## 🔐 One-Time Setup (Production)

### Edit: `backend/.env.production`

```env
# 1. Update Database Credentials (from cPanel)
DATABASE_URL="postgresql://dymgcxar_admin:YOUR_PASSWORD@localhost:5432/dymgcxar_AI_police_v2"

# 2. Generate Strong Secrets (PowerShell)
# Run this command TWICE to get 2 different secrets:
# -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# 3. Update with Generated Secrets
JWT_SECRET="<paste-first-secret-here>"
REFRESH_TOKEN_SECRET="<paste-second-secret-here>"

# 4. Save and close
```

---

## ⚡ Environment at a Glance

### Development Mode
- **Frontend API:** `http://localhost:3001/api`
- **Backend Port:** `3001`
- **Database:** Local PostgreSQL
- **CORS:** Allows localhost

### Production Mode
- **Frontend API:** `https://urjourney.in/api`
- **Backend Port:** `3001` (cPanel managed)
- **Database:** cPanel PostgreSQL
- **CORS:** Allows urjourney.in only

---

## 🆘 Quick Fixes

### API Calls Not Working
```powershell
.\switch-env.ps1 status  # Check environment
.\switch-env.ps1 dev     # Switch to dev if needed
```

### Database Connection Error
```powershell
Get-Content backend\.env | Select-String "DATABASE_URL"
# Verify it matches your current mode (local/cPanel)
```

### After Build, Still in Prod Mode
```powershell
.\switch-env.ps1 dev  # Always switch back
```

---

## 📞 Need More Help?

- **Full Guide:** `ENVIRONMENT_CONFIGURATION_GUIDE.md`
- **Setup Summary:** `ENVIRONMENT_SETUP_SUMMARY.md`
- **Implementation:** `RISK_ASSESSMENT_TEMPLATE_GENERATION_IMPLEMENTATION.md`

---

**💡 Pro Tip:** Keep this file open in a tab while developing!
