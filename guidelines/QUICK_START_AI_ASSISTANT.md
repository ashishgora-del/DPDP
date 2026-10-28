# AI-Assisted Document Builder - Quick Start Guide

## Prerequisites

1. **Database Setup**: PostgreSQL running with Phase 1 migrations applied
2. **Backend Running**: NestJS backend on port 3001
3. **Frontend Running**: React frontend on port 5173

---

## Step 1: Seed Template Data

Run this command in the `backend/` directory:

```powershell
cd backend
npm run db:seed-templates
```

This loads the `vendor-risk-assessment.json` template into the database.

**Expected Output:**
```
✅ Loading template: vendor-risk-assessment
✅ Template loaded successfully
```

---

## Step 2: Start Backend

```powershell
cd backend
npm run start:dev
```

Backend should be running on `http://localhost:3001`

---

## Step 3: Start Frontend

```powershell
# From root directory
npm run dev
```

Frontend should be running on `http://localhost:5173`

---

## Step 4: Test the Flow

### 4.1 Navigate to Document Editor

1. Login to the app
2. Go to **Template Generation** module
3. Create a new document or select existing document
4. You should see the **DocumentEditorPage**

### 4.2 Start AI Conversation

1. Look for the **"Fill using AI"** button in the toolbar (gradient blue-purple with sparkles icon)
2. Click it
3. The layout should switch to AI Mode:
   - Left panel: Section progress sidebar
   - Center panel: Live document preview
   - Right panel: Chat interface

### 4.3 Complete First Section

1. AI should greet you with a welcome message
2. First question: "What would you like to name this assessment?"
3. Type an answer in the input field
4. Press Enter or click "Send"
5. AI should ask the next question
6. Continue answering until section 1 completes

### 4.4 Verify Section Update

When section 1 completes:
- ✅ Chat should show: "✅ Section completed and added to document"
- ✅ Center panel should highlight the new section (blue glow for 2s)
- ✅ Left panel should show section 1 with checkmark
- ✅ Progress bar should update to ~7%

### 4.5 Continue to Section 2

1. AI should automatically move to section 2
2. Repeat the process
3. Test pause/resume functionality
4. Test switching back to manual mode

---

## Troubleshooting

### Issue: "Fill using AI" button does nothing

**Check:**
- Backend is running on port 3001
- Template is seeded in database
- Browser console for errors

**Fix:**
```powershell
# Check backend logs
cd backend
npm run start:dev

# Check if template exists
# Open PostgreSQL and run:
SELECT id, name FROM document_templates;
```

### Issue: Section doesn't update in center panel

**Check:**
- Backend conversation API endpoints working
- Document ID is valid
- Section markers in markdown

**Fix:**
- Check browser Network tab for API calls
- Should see POST to `/conversations/:id/answer`
- Response should include `sectionUpdate` when section completes

### Issue: Chat not receiving AI responses

**Check:**
- ConversationService is working
- Template structure is correct
- No errors in backend logs

**Fix:**
```powershell
# Test template structure endpoint
curl -X GET http://localhost:3001/api/template-generation/templates/vendor-risk-assessment/structure \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: TypeScript errors

**Fix:**
```powershell
# Clear cache and rebuild
npm run build
```

---

## API Testing (Optional)

Test backend endpoints directly:

### 1. Get Template Structure
```bash
curl -X GET http://localhost:3001/api/template-generation/templates/vendor-risk-assessment/structure \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Start Conversation
```bash
curl -X POST http://localhost:3001/api/template-generation/documents/DOCUMENT_ID/start-ai-conversation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "vendor-risk-assessment"}'
```

### 3. Submit Answer
```bash
curl -X POST http://localhost:3001/api/template-generation/conversations/CONVERSATION_ID/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fieldId": "assessment_name", "value": "Test Assessment"}'
```

---

## Expected Behavior

### Conversation Flow
1. **Start** → Welcome message + First question
2. **Answer** → Next question or section complete
3. **Section Complete** → Markdown generated + Document updated
4. **Next Section** → Continue with section 2
5. **Repeat** → Until all 15 sections done
6. **Complete** → "🎉 All sections completed!"

### Progress Tracking
- **Overall**: 0% → 7% → 13% → ... → 100%
- **Section**: 1/15 → 2/15 → ... → 15/15
- **Fields**: 1/5 → 2/5 → ... → 5/5 (per section)

### Visual Feedback
- **Loading states**: Spinners during API calls
- **Section highlights**: Blue glow when section completes
- **Progress bars**: Animated updates
- **Message bubbles**: Different colors for AI/user/system

---

## Demo Data

Sample answers for quick testing:

**Section 1: Assessment Overview**
1. Assessment Name: `CRM Vendor Review`
2. Assessment Date: `2026-03-01`
3. Business Unit: `Customer Support`
4. Vendor Name: `XYZ Technologies Pvt Ltd`
5. Service Description: `Customer support ticketing platform`

**Section 2: Vendor Basic Info**
1. Legal Name: `XYZ Technologies Private Limited`
2. Registration Number: `U72900DL2020PTC123456`
3. Address: `123 Tech Park, Delhi, India`
4. Website: `https://xyz.example.com`
5. Contact Name: `John Doe`
6. Contact Email: `john@xyz.example.com`
7. Contact Phone: `+91-9876543210`

Continue with similar realistic data for remaining sections.

---

## Success Criteria

✅ **Phase 3 is working if:**
1. "Fill using AI" button switches to 3-panel layout
2. Chat shows welcome message and first question
3. User can answer questions with different input types
4. Progress bars update correctly
5. Sections appear in center panel when completed
6. All 15 sections can be completed
7. Final document has complete content
8. Can switch back to manual mode

---

## Next Steps

Once Phase 3 is validated:
1. Connect Python AI service (optional - system works with template questions)
2. Add more templates (beyond vendor-risk-assessment)
3. Add validation retry logic
4. Implement draft saving
5. Add export to PDF/DOCX
6. Mobile responsive design

---

**Need Help?**
- Check backend logs: `backend/` directory
- Check browser console: F12 → Console
- Check Network tab: F12 → Network
- Review API responses for errors
