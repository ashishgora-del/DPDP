# Phase 3: Backend Template Generation Module - COMPLETE ✅

**Date:** February 2026  
**Status:** ✅ COMPLETE  
**Dependencies:** Phase 0, Phase 1, Phase 2

---

## 📋 Overview

Phase 3 successfully implemented the backend template generation module with Azure OpenAI integration. The system can now generate DPDPA-compliant documents from templates or custom prompts using AI, with full context from risk assessments.

---

## ✅ Completed Tasks

### 1. DTOs (Data Transfer Objects)
Created 4 DTO files with full validation:

#### **generate-from-template.dto.ts**
```typescript
- artifactId: UUID (required)
- assessmentId: UUID (optional - provides context)
- orgName: string (required)
- context: Record<string, any> (optional - additional metadata)
```

#### **generate-custom.dto.ts**
```typescript
- prompt: string (min 20 chars - user's custom request)
- assessmentId: UUID (optional)
- orgName: string (required)
```

#### **update-document.dto.ts**
```typescript
- content: string (optional - updated Markdown)
- status: enum (DRAFT/FINAL/ARCHIVED)
- title: string (optional)
```

#### **list-artifacts.dto.ts**
```typescript
- category: enum (CUSTOMER/EMPLOYEE/VENDOR/etc.)
- riskTier: string (BASIC/MODERATE/HIGH)
```

All DTOs include:
- ✅ Class-validator decorators
- ✅ Swagger API documentation
- ✅ Proper type safety
- ✅ Optional/required field validation

---

### 2. GenAI Service (Azure OpenAI Integration)
**File:** `backend/src/template-generation/genai.service.ts`

**Core Features:**
- ✅ Azure OpenAI client initialization
- ✅ Configurable via environment variables
- ✅ Two generation methods:
  - `generateFromTemplate()` - Template-based generation
  - `generateCustomDocument()` - Free-form prompt generation
- ✅ Context injection from risk assessments
- ✅ Professional prompt engineering
- ✅ Error handling and logging
- ✅ Temperature: 0.7, Max tokens: 4000

**System Prompt:**
```
Expert legal document generator specializing in India's DPDPA 2023
- Generates clear, professional, legally sound documents
- Ensures DPDPA compliance in all outputs
- Uses plain language accessible to non-lawyers
- Includes mandatory clauses and disclosures
- Formats in clean Markdown
- References DPDPA sections where applicable
```

**Context Injection:**
- Risk tier (BASIC/MODERATE/HIGH)
- SDF flag (Significant Data Fiduciary status)
- Focus areas from assessment
- Risk drivers from assessment
- Organization name
- Additional custom context

---

### 3. Template Generation Service
**File:** `backend/src/template-generation/template-generation.service.ts`

**Database Operations:**
```typescript
✅ listArtifacts(filters) - Fetch templates by category/risk tier
✅ getArtifact(id) - Get single template details
✅ generateFromTemplate(userId, dto) - Create document from template
✅ generateCustomDocument(userId, dto) - Create custom document
✅ getDocument(id, userId) - Fetch generated document with ownership check
✅ getUserDocuments(userId, page, limit) - Paginated list
✅ updateDocument(id, userId, dto) - Update content/status/title
✅ deleteDocument(id, userId) - Delete with ownership verification
```

**Security Features:**
- ✅ Ownership validation on all operations
- ✅ User ID from JWT token
- ✅ Foreign key constraints
- ✅ 404 for not found resources
- ✅ 403 for unauthorized access

**Business Logic:**
1. Fetch artifact/template from database
2. Optionally fetch assessment context (if assessmentId provided)
3. Call GenAI service with context
4. Save generated document to database
5. Return document details with ID

---

### 4. Template Generation Controller
**File:** `backend/src/template-generation/template-generation.controller.ts`

**REST API Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/template-generation/artifacts` | List available templates | ✅ JWT |
| GET | `/api/template-generation/artifacts/:id` | Get template details | ✅ JWT |
| POST | `/api/template-generation/generate/template` | Generate from template | ✅ JWT |
| POST | `/api/template-generation/generate/custom` | Generate custom document | ✅ JWT |
| GET | `/api/template-generation/documents` | List user's documents | ✅ JWT |
| GET | `/api/template-generation/documents/:id` | Get document by ID | ✅ JWT |
| PATCH | `/api/template-generation/documents/:id` | Update document | ✅ JWT |
| DELETE | `/api/template-generation/documents/:id` | Delete document | ✅ JWT |

**Response Codes:**
- 200: Success
- 201: Created
- 204: No Content (delete)
- 404: Not Found
- 403: Forbidden
- 500: AI Generation Failed

---

### 5. Module Registration
**Files Updated:**
- `template-generation.module.ts` - Module definition
- `app.module.ts` - Registered TemplateGenerationModule

**Module Dependencies:**
- ConfigModule (for environment variables)
- DatabaseModule (for PostgreSQL access)
- JwtAuthGuard (from AuthModule)

---

### 6. Environment Configuration

**Added to `.env.development` and `.env.production`:**
```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"
```

**Configuration Steps:**
1. Create Azure OpenAI resource in Azure Portal
2. Deploy GPT-4 model
3. Copy API key and endpoint
4. Update `.env` files

---

### 7. Package Dependencies

**Installed:**
```bash
npm install openai@latest
```

**Package:** `openai` (latest version)
- Azure OpenAI SDK
- Compatible with Azure endpoints
- Chat completions API
- Streaming support (not used yet)

---

## 🔗 Integration Points

### Database Schema (from Phase 0)
```sql
-- Artifacts table (pre-seeded with 12 templates)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  template_content TEXT NOT NULL,
  applicable_tiers VARCHAR(20)[],
  display_order INTEGER
);

-- Generated documents table
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  artifact_id UUID REFERENCES artifacts(id),
  assessment_id UUID REFERENCES risk_assessments(id),
  status VARCHAR(20) DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Risk Assessment Integration
- Fetches assessment by ID
- Validates user ownership
- Extracts: riskTier, sdfFlag, focusAreas, riskDrivers
- Passes context to AI for tailored generation

### AI Generation Flow
```
1. User submits generation request
   ↓
2. Controller validates JWT token
   ↓
3. Service fetches template/assessment
   ↓
4. GenAI service builds prompt with context
   ↓
5. Azure OpenAI generates document
   ↓
6. Service saves to database
   ↓
7. Returns document ID and content
```

---

## 📁 Files Created (11)

### DTOs (5 files)
1. `backend/src/template-generation/dto/generate-from-template.dto.ts`
2. `backend/src/template-generation/dto/generate-custom.dto.ts`
3. `backend/src/template-generation/dto/update-document.dto.ts`
4. `backend/src/template-generation/dto/list-artifacts.dto.ts`
5. `backend/src/template-generation/dto/index.ts`

### Services (2 files)
6. `backend/src/template-generation/genai.service.ts`
7. `backend/src/template-generation/template-generation.service.ts`

### Module Files (2 files)
8. `backend/src/template-generation/template-generation.controller.ts`
9. `backend/src/template-generation/template-generation.module.ts`

### Updated (2 files)
10. `backend/src/app.module.ts` - Added TemplateGenerationModule
11. `backend/.env.development` & `backend/.env.production` - Azure OpenAI config

---

## 🧪 Testing with Swagger

### 1. Start Backend
```powershell
cd backend
npm run start:dev
```

### 2. Open Swagger UI
Navigate to: `http://localhost:3001/api/docs`

### 3. Authenticate
- Click "Authorize" button
- Enter JWT token from login
- Click "Authorize"

### 4. Test Endpoints

#### List Artifacts
```
GET /api/template-generation/artifacts
Query params: category=CUSTOMER, riskTier=MODERATE
```

#### Generate from Template
```
POST /api/template-generation/generate/template
Body:
{
  "artifactId": "uuid-from-artifacts-list",
  "assessmentId": "uuid-from-risk-assessment",
  "orgName": "Test Company Ltd",
  "context": { "industry": "Healthcare" }
}
```

#### Generate Custom Document
```
POST /api/template-generation/generate/custom
Body:
{
  "prompt": "Create a privacy notice for a mobile health app",
  "assessmentId": "uuid-optional",
  "orgName": "HealthApp Inc"
}
```

#### Get Documents
```
GET /api/template-generation/documents?page=1&limit=10
```

#### Update Document
```
PATCH /api/template-generation/documents/{id}
Body:
{
  "content": "Updated document content...",
  "status": "FINAL"
}
```

---

## ⚠️ Important Notes

### Azure OpenAI Setup Required
Before testing AI generation:
1. Create Azure OpenAI resource
2. Deploy GPT-4 model
3. Copy credentials to `.env`
4. Restart backend server

**Without Azure OpenAI:**
- Endpoints will return 500 error
- Error message: "Azure OpenAI is not configured"
- All other endpoints (list, get, update, delete) work fine

### Rate Limiting
- Global: 100 requests/minute
- AI generation is token-intensive
- Consider lower limits for `/generate/*` endpoints in production

### Token Costs
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Average document: 1000-2000 tokens input, 2000-4000 tokens output
- Estimated cost: $0.15-0.30 per document
- Set budget alerts in Azure

---

## 🔄 Data Flow Examples

### Example 1: Template-Based Generation
```
User Action: Click "Generate Privacy Notice" (CUSTOMER_PRIVACY_NOTICE artifact)
↓
Frontend: POST /api/template-generation/generate/template
{
  "artifactId": "customer-privacy-notice-uuid",
  "assessmentId": "user-assessment-uuid",
  "orgName": "Acme Corp"
}
↓
Backend:
1. Fetch artifact template
2. Fetch assessment (riskTier=MODERATE, sdfFlag=false)
3. Build prompt with context
4. Call Azure OpenAI
5. Save generated document
↓
Response:
{
  "id": "generated-doc-uuid",
  "title": "Customer Privacy Notice - Acme Corp",
  "content": "# Privacy Notice\n\nAcme Corp is committed...",
  "status": "DRAFT",
  "createdAt": "2026-02-27T10:30:00Z"
}
```

### Example 2: Custom Document Generation
```
User Action: Enter custom prompt in AI editor
↓
Frontend: POST /api/template-generation/generate/custom
{
  "prompt": "Create DPIA for facial recognition system",
  "orgName": "SecureTech Ltd"
}
↓
Backend:
1. No template needed
2. Build prompt from user request
3. Call Azure OpenAI with DPDPA system prompt
4. Save generated document
↓
Response:
{
  "id": "custom-doc-uuid",
  "title": "Custom Document - SecureTech Ltd",
  "content": "# Data Protection Impact Assessment\n...",
  "status": "DRAFT"
}
```

---

## 📊 Database Queries

### Get All Documents for User
```sql
SELECT gd.*, a.name as artifact_name, a.category
FROM generated_documents gd
LEFT JOIN artifacts a ON gd.artifact_id = a.id
WHERE gd.user_id = 'user-uuid'
ORDER BY gd.created_at DESC;
```

### Get Templates by Risk Tier
```sql
SELECT * FROM artifacts
WHERE 'MODERATE' = ANY(applicable_tiers)
ORDER BY display_order ASC;
```

### Count Documents by Status
```sql
SELECT status, COUNT(*) 
FROM generated_documents 
WHERE user_id = 'user-uuid'
GROUP BY status;
```

---

## 🎯 Next Steps: Phase 4

Phase 4 will implement the **Frontend Template Generation UI**:

1. **Template Workbench Page:**
   - Browse artifacts by category
   - Filter by risk tier
   - Template preview
   - "Generate" button

2. **AI Editor Page:**
   - Custom prompt input
   - Context display (risk assessment summary)
   - Real-time generation
   - Markdown preview

3. **Document Management:**
   - List generated documents
   - View/edit document content
   - Status management (Draft/Final)
   - Export to PDF/Word

4. **Integration:**
   - Link from ResultsPage buttons
   - Pass assessmentId in URL params
   - Auto-fetch assessment context

---

## ✅ Phase 3 Summary

**Completed:**
- ✅ 11 new files created
- ✅ 8 REST API endpoints
- ✅ Azure OpenAI integration
- ✅ Template-based generation
- ✅ Custom document generation
- ✅ Full CRUD for documents
- ✅ Context injection from assessments
- ✅ Swagger documentation
- ✅ Ownership validation
- ✅ Error handling

**API Endpoints Ready:**
- `/api/template-generation/artifacts` (GET)
- `/api/template-generation/artifacts/:id` (GET)
- `/api/template-generation/generate/template` (POST)
- `/api/template-generation/generate/custom` (POST)
- `/api/template-generation/documents` (GET)
- `/api/template-generation/documents/:id` (GET)
- `/api/template-generation/documents/:id` (PATCH)
- `/api/template-generation/documents/:id` (DELETE)

**Ready for Phase 4: Frontend Template Generation UI**
