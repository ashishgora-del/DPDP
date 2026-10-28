# Quick Start Guide

## Prerequisites
- ✅ Node.js 18+ installed
- ✅ PostgreSQL running
- ✅ Dependencies installed (`npm install` in root and backend)

## Start Development Servers

### Option 1: Automated (Windows)
```bash
start-dev.bat
```

### Option 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access the Application

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3001
- 📚 **API Docs**: http://localhost:3001/api (Swagger)

## Testing Commands

### Validation
```bash
cd backend
npm run validate
```

### Health Check
```bash
cd backend
npm run health
```

### End-to-End Tests
```bash
cd backend
npm run test:integration
```

## First Steps

1. **Open Frontend**: http://localhost:5173
2. **Register Account**: Click "Sign In" → Register
3. **Start Assessment**: Click "Start Compliance Journey"
4. **Generate Documents**: After assessment, click "Generate Compliance Documents"

## Module Overview

### Risk Assessment (`/risk-assessment`)
- Answer 10 questions about your organization
- Get automated risk tier (BASIC/MODERATE/HIGH)
- Receive compliance recommendations
- Identify if you're a Significant Data Fiduciary (SDF)

### Template Generation (`/template-generation`)
- Browse 6+ DPDPA compliance templates
- Generate documents with AI (requires Azure OpenAI)
- Edit documents with Markdown support
- Manage all your compliance documents

### Learning Platform (`/learning-platform`)
- Access DPDPA compliance courses
- Track progress and certifications
- Interactive learning modules

## Key Features

- 🔐 **JWT Authentication** - Secure user sessions
- 🤖 **AI-Powered** - Azure OpenAI for document generation
- 📝 **Markdown Editor** - Easy document editing
- 🧭 **Smart Navigation** - Breadcrumbs + Quick Nav menu
- 📊 **Risk Analysis** - Automated compliance scoring
- 🎓 **Learning Platform** - Built-in training system

## Stopping Servers

Press `Ctrl+C` in each terminal window to stop the servers.

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in `backend/.env.development`
- Run: `cd backend && npm install`

### Frontend won't connect
- Ensure backend is running on port 3001
- Check browser console for errors
- Clear browser cache and cookies

### Database errors
- Verify database exists: `dymgcxar_AI_police_v2`
- Check PostgreSQL credentials
- Try: `cd backend && npm run db:reset`

### Authentication issues
- Clear browser localStorage
- Re-register account
- Check JWT_SECRET is configured

## Environment Variables

### Backend (`backend/.env.development`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dymgcxar_AI_police_v2?schema=public"
JWT_SECRET="dpdp-secure-jwt-secret-key-2026-production-ready"
AZURE_OPENAI_API_KEY="your-key" # Optional
AZURE_OPENAI_ENDPOINT="https://..." # Optional
```

### Frontend (Vite)
Frontend automatically uses `http://localhost:3001` in development.

## Next Steps

After starting:
1. Run validation: `cd backend && npm run validate`
2. Run health check: `cd backend && npm run health`
3. Complete manual testing (see [TESTING_GUIDE.md](TESTING_GUIDE.md))
4. Try all features
5. Run E2E tests: `cd backend && npm run test:integration`

## Need Help?

- Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions
- Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture overview
- See console logs in terminal windows for error details
