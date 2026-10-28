# Phase 6: Testing & Validation Guide

## Pre-Flight Validation

Run validation before starting servers:
```bash
cd backend
node scripts/validate.js
```

This checks:
- ✅ All critical files present
- ✅ Environment variables configured
- ✅ Dependencies installed
- ⚠️ Azure OpenAI credentials (optional)

## Starting the Application

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3001`

### 2. Start Frontend (Terminal 2)
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Health Check

After both servers are running:

```bash
cd backend
npm run health
```

Tests all endpoints:
- Root endpoint
- Health check
- Risk Assessment API
- Template Generation API
- Learning Platform API
- Auth endpoints

## End-to-End Tests

Full workflow testing:

```bash
cd backend
node scripts/e2e-test.js
```

Tests complete flows:
1. **Authentication Flow**
   - User registration
   - User login
   - JWT token handling

2. **Risk Assessment Flow**
   - Create assessment
   - Retrieve assessment
   - List user assessments
   - Verify risk tier calculation

3. **Template Generation Flow**
   - List available templates
   - Generate document from template
   - Retrieve generated document
   - Update document content
   - List user documents

4. **Learning Platform Flow**
   - List courses
   - Get course details
   - Enroll in course

## Manual Testing Checklist

### Risk Assessment Module

1. **Start New Assessment**
   - Navigate to `/risk-assessment`
   - Click "Start Assessment"
   - Fill out questionnaire
   - Verify all fields work

2. **View Results**
   - Check risk tier display (BASIC/MODERATE/HIGH)
   - Verify recommendations appear
   - Test SDF flag indicator
   - Click "Generate Compliance Documents"

### Template Generation Module

3. **Browse Templates**
   - Navigate to `/template-generation`
   - Verify 6+ templates display
   - Test category filtering
   - Test search functionality
   - Click template card for details

4. **Generate from Template**
   - Select any template
   - Click "Generate Document"
   - Wait for AI generation (requires Azure OpenAI)
   - Verify navigation to editor

5. **Custom AI Generation**
   - Click "Custom AI Document"
   - Enter organization name
   - Enter custom prompt (min 20 chars)
   - Click "Generate"
   - Verify document creation

6. **Document Editor**
   - Toggle Edit/Preview modes
   - Edit title and content
   - Change status (DRAFT/FINAL/ARCHIVED)
   - Click Save
   - Export to Markdown
   - Test unsaved changes indicator

7. **Document Management**
   - Navigate to `/template-generation/documents`
   - View all documents
   - Test pagination
   - Delete a document
   - Verify confirmation modal

### Navigation & UI

8. **Breadcrumbs**
   - Verify breadcrumbs on all pages
   - Click breadcrumb links
   - Test navigation hierarchy

9. **Quick Nav**
   - Click floating compass button (bottom-right)
   - Test all quick links
   - Verify smooth animations

10. **Authentication**
    - Test login/logout
    - Verify JWT persistence
    - Test protected routes

## Common Issues & Solutions

### Issue: Backend won't start
**Solution:** 
- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env.development`
- Run `npm install` in backend directory

### Issue: Frontend won't connect
**Solution:**
- Verify backend is running on port 3001
- Check VITE_API_URL in frontend
- Clear browser cache

### Issue: AI generation fails
**Solution:**
- Azure OpenAI credentials needed
- Template-based generation works without AI
- Check AZURE_OPENAI_API_KEY in `.env.development`

### Issue: 401 Unauthorized errors
**Solution:**
- Login again (JWT may have expired)
- Clear localStorage
- Check JWT_SECRET matches between requests

### Issue: Database connection fails
**Solution:**
- Start PostgreSQL service
- Verify credentials in DATABASE_URL
- Check if database exists: `dymgcxar_AI_police_v2`

## Performance Testing

### Load Testing (Optional)
Use tools like Apache Bench or Artillery:

```bash
# Test risk assessment endpoint
ab -n 100 -c 10 http://localhost:3001/api/risk-assessment

# Test template list endpoint
ab -n 100 -c 10 http://localhost:3001/api/template-generation/artifacts
```

### Response Time Targets
- API endpoints: < 200ms
- Document generation: < 5s (with AI)
- Page loads: < 1s

## Browser Testing

Test in multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

## Mobile Responsiveness

Test at these breakpoints:
- 📱 Mobile: 375px
- 📱 Tablet: 768px
- 💻 Desktop: 1024px
- 🖥️ Large: 1920px

## Deployment Checklist

Before deploying to production:

### Backend
- [ ] Update DATABASE_URL to production database
- [ ] Change JWT_SECRET to secure random string
- [ ] Add real Azure OpenAI credentials
- [ ] Set NODE_ENV=production
- [ ] Enable CORS only for production domain
- [ ] Test health check endpoint
- [ ] Run E2E tests

### Frontend
- [ ] Update VITE_API_URL to production backend
- [ ] Build: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Verify all routes work
- [ ] Test authentication flow

### Database
- [ ] Run migrations
- [ ] Seed initial data (templates, courses)
- [ ] Set up backups
- [ ] Configure connection pooling

## Test Results Documentation

Record test results:

```
Date: __________
Tester: __________

Pre-Flight Validation: ✅ / ❌
Backend Health Check: ✅ / ❌
Frontend Loading: ✅ / ❌
E2E Tests: ✅ / ❌

Manual Tests:
- Risk Assessment: ✅ / ❌
- Template Generation: ✅ / ❌
- Document Editor: ✅ / ❌
- Navigation: ✅ / ❌
- Authentication: ✅ / ❌

Issues Found:
1. ___________________________
2. ___________________________

Performance:
- Avg API Response: _____ ms
- Page Load Time: _____ s
- AI Generation: _____ s
```

## Success Criteria

Phase 6 is complete when:
- ✅ All automated tests pass
- ✅ Manual testing checklist complete
- ✅ No critical bugs found
- ✅ Performance targets met
- ✅ All modules integrated properly
- ✅ Documentation complete
- ✅ Ready for production deployment

## Next Steps After Testing

1. Fix any issues found during testing
2. Document known limitations
3. Create user documentation
4. Plan production deployment
5. Set up monitoring and logging
6. Configure backup strategy
