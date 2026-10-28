# Testing Guide: Frontend Risk Assessment Integration

## 🧪 Phase 2 Testing Checklist

### Prerequisites
1. **Database Setup:**
   ```powershell
   .\setup-database.ps1
   ```
   Verify tables exist: `risk_assessments`, `artifacts`, `generated_documents`

2. **Backend Running:**
   ```powershell
   cd backend
   npm run start:dev
   ```
   Should see: `Nest application successfully started on port 3001`

3. **Frontend Running:**
   ```powershell
   npm run dev
   ```
   Should see: `Local: http://localhost:5173/`

4. **Environment Variables:**
   ```powershell
   .\switch-env.ps1 dev
   ```
   Verify `.env` has `VITE_API_URL=http://localhost:3001/api`

---

## 📝 Test Scenarios

### Test 1: Complete Assessment Flow (Happy Path)
**Expected:** User submits assessment → Backend calculates risk → Results display

1. Navigate to: `http://localhost:5173/risk-assessment`
2. Enter organization name: "Test Company Ltd"
3. Enter email (optional): "test@example.com"
4. Answer all 10 questions (Step 1-5)
5. Click "Submit Assessment"

**Expected Results:**
- ✅ Button shows "Submitting..." during API call
- ✅ Form is disabled during submission
- ✅ Redirects to `/risk-assessment/results/:id` (with UUID)
- ✅ Results page displays:
  - Organization name: "Test Company Ltd"
  - Risk tier badge (BASIC/MODERATE/HIGH)
  - Risk drivers list (if applicable)
  - Focus areas list
  - SDF flag (if large-scale processing)

**Backend Verification:**
```sql
SELECT * FROM risk_assessments ORDER BY created_at DESC LIMIT 1;
```
Should show new entry with correct `org_name`, `risk_tier`, `risk_score`

---

### Test 2: Authentication Error Handling
**Expected:** Invalid/missing token → Redirect to login

1. Open DevTools → Application → Local Storage
2. Delete or modify `token` value
3. Navigate to: `http://localhost:5173/risk-assessment/results/some-id`

**Expected Results:**
- ✅ 401 error from backend
- ✅ Automatic redirect to `/login`
- ✅ Console shows: "Unauthorized, redirecting to login"

---

### Test 3: Network Error Handling
**Expected:** Backend down → Error message displays

1. Stop backend server (Ctrl+C in backend terminal)
2. Fill out assessment form
3. Click "Submit Assessment"

**Expected Results:**
- ✅ Error banner appears with AlertCircle icon
- ✅ Message shows: "Submission Error"
- ✅ Details: "Network Error" or "Failed to submit assessment"
- ✅ Button returns to "Submit Assessment" (not disabled)
- ✅ User can retry after backend restarts

---

### Test 4: Form Progress Persistence
**Expected:** Progress saves to localStorage during navigation

1. Start new assessment
2. Fill Step 1 (Q1-Q2)
3. Click "Next" to Step 2
4. Fill Q3-Q4
5. Close browser tab
6. Re-open `http://localhost:5173/risk-assessment`

**Expected Results:**
- ✅ Form loads with previously answered questions
- ✅ Current step is restored (Step 2 or 3)
- ✅ Organization name and email restored

**Clear Progress Test:**
- Complete and submit assessment
- Check localStorage: `dpdpa_assessment_progress` should be deleted

---

### Test 5: Results Page - API Fetch
**Expected:** Fetches assessment from backend, not localStorage

1. Submit an assessment (note the UUID in URL)
2. Open DevTools → Network tab
3. Reload results page

**Expected Results:**
- ✅ Network request to: `GET /api/risk-assessment/:id`
- ✅ Request includes `Authorization: Bearer <token>` header
- ✅ Response status: 200 OK
- ✅ Response body contains risk tier, score, drivers, focus areas
- ✅ Page displays data from API response (not localStorage)

---

### Test 6: Template Generation Navigation
**Expected:** Buttons link to template generation pages

1. Complete assessment and view results
2. Locate "Next Steps: Generate Compliance Documents" section
3. Click "Generate Documents from Templates"

**Expected Results:**
- ✅ Navigates to: `/template-generation?assessmentId=<uuid>`
- ✅ Assessment ID is in query parameters

4. Go back to results
5. Click "Create Custom Document with AI"

**Expected Results:**
- ✅ Navigates to: `/template-generation/custom?assessmentId=<uuid>`
- ✅ Assessment ID is in query parameters

---

### Test 7: Loading States
**Expected:** Loading spinner during API call

1. Navigate to results page with valid assessment ID
2. Watch for loading state (may be fast on localhost)

**Expected Results:**
- ✅ Shows `LoadingState` component briefly
- ✅ Message: "Loading assessment results..."
- ✅ Spinner animation visible

---

### Test 8: Invalid Assessment ID
**Expected:** Error message for non-existent assessment

1. Navigate to: `http://localhost:5173/risk-assessment/results/invalid-uuid-123`

**Expected Results:**
- ✅ Error UI displays
- ✅ Message: "Error Loading Assessment" or "Assessment not found"
- ✅ Button: "Start New Assessment"
- ✅ Clicking button goes to `/risk-assessment`

---

### Test 9: Risk Tier Calculation
**Expected:** Backend calculates different risk tiers correctly

#### BASIC Risk (0-30 points)
- Answers that trigger BASIC:
  - Q3: Adults only (no children)
  - Q4: Small-scale processing
  - Q5: Basic personal information
  - Q7: No AI/automated profiling

**Expected:** Green badge, "BASIC RISK"

#### MODERATE Risk (31-60 points)
- Answers that trigger MODERATE:
  - Q3: Mix of children and adults (+10 points)
  - Q4: Medium-scale processing
  - Q5: Sensitive personal data (+10 points)

**Expected:** Amber badge, "MODERATE RISK"

#### HIGH Risk (61+ points)
- Answers that trigger HIGH:
  - Q3: Minors only (+20 points)
  - Q4: Large-scale processing (+15 points)
  - Q5: Sensitive categories (+10 points)
  - Q7: AI-based profiling (+15 points)

**Expected:** Red badge, "HIGH RISK", may show SDF flag

---

### Test 10: SDF Flag
**Expected:** SDF flag appears for large-scale processing

1. Answer Q4 with "Large-scale (100k+ records)" or similar
2. Submit assessment

**Expected Results:**
- ✅ Purple/pink gradient box appears below risk tier
- ✅ Title: "Significant Data Fiduciary (SDF) Status"
- ✅ Mentions DPIA and DPO requirements

---

## 🐛 Debugging Tips

### Backend Not Responding
```powershell
# Check if backend is running
netstat -ano | findstr :3001

# Check backend logs
cd backend
npm run start:dev
# Look for errors in console
```

### Frontend API Errors
```javascript
// Open DevTools → Console
// Check network tab for failed requests
// Verify CORS headers allow localhost:5173
```

### Database Connection Issues
```powershell
# Test database connection
cd backend
# Check .env file has correct DATABASE_URL
# Try connecting with pgAdmin or psql
```

### Token Expiration
```javascript
// In DevTools console:
localStorage.getItem('token')
// If expired, login again to get new token
```

---

## ✅ Success Criteria

Phase 2 is fully working if ALL tests pass:
- [x] Assessment submission calls backend API
- [x] Risk calculation happens on backend (not client-side)
- [x] Results page fetches from database
- [x] JWT authentication works
- [x] Error handling displays user-friendly messages
- [x] Loading states show during API calls
- [x] Template generation buttons navigate correctly
- [x] Progress tracking uses localStorage (assessments use backend)

---

## 📊 Expected API Responses

### POST /api/risk-assessment/submit
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "riskTier": "MODERATE",
  "riskScore": 45,
  "sdfFlag": false,
  "riskDrivers": [
    "Sensitive personal data processing",
    "Cross-border data transfers"
  ],
  "focusAreas": [
    "Data Subject Rights (DSR) Framework",
    "Consent Management System"
  ]
}
```

### GET /api/risk-assessment/:id
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "orgName": "Test Company Ltd",
  "email": "test@example.com",
  "riskTier": "MODERATE",
  "riskScore": 45,
  "sdfFlag": false,
  "riskDrivers": [...],
  "focusAreas": [...],
  "q1_orgProfile": "...",
  "q2_geography": "...",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

## 🚀 Next: Phase 3 Testing

After Phase 3 implementation, test:
- Artifact listing API
- Template-based document generation
- Custom AI document generation
- Document storage and retrieval
- Integration with risk assessment context
