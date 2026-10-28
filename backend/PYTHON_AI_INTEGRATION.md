# Python AI Service Integration Guide

## 📋 Overview

This guide explains how the NestJS backend integrates with the Python FastAPI + LangGraph AI service for conversational document generation.

---

## 🏗️ Architecture

### Components

**NestJS Backend** (Port 3001)
- Business logic and state management
- PostgreSQL database for conversations, answers, and documents
- Field validation and navigation
- Markdown generation

**Python FastAPI Service** (Port 8000)
- LangGraph-powered conversation management
- AI response generation using Qwen3:8b (local LLM)
- Conversation memory and context optimization
- Checkpoint-based state recovery

### Integration Flow

```
User submits answer → NestJS Backend
                       ↓
                 Validate & Store in PostgreSQL
                       ↓
                 Determine next field
                       ↓
         Call Python AI Service (POST /api/conversation/interact)
                       ↓
         Python: Generate contextual question using LangGraph + Qwen3:8b
                       ↓
         NestJS: Receive AI response
                       ↓
         Store AI message in PostgreSQL
                       ↓
         Return to Frontend
```

---

## 🚀 Setup Instructions

### 1. Environment Configuration

Update your `.env` file in the `backend/` directory:

```bash
# Python AI Service (FastAPI + LangGraph)
PYTHON_AI_SERVICE_URL="http://localhost:8000"
```

### 2. Start Python AI Service

Make sure your Python FastAPI service is running on port 8000:

```bash
# In your Python service directory
uvicorn main:app --host 0.0.0.0 --port 8000
```

Verify it's running:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ai-generation-langgraph",
  "langgraph_version": "0.0.1"
}
```

### 3. Start NestJS Backend

```bash
cd backend
npm install  # If not already done
npm run start:dev
```

The NestJS backend will automatically attempt to connect to the Python service on startup.

---

## 📡 API Integration Details

### AIClientService

Located at: `backend/src/template-generation/ai-client.service.ts`

**Key Methods:**

#### `generateFieldQuestion()`
Generates contextual AI question for the next field.

**Calls:** `POST /api/conversation/interact`

**Request:**
```typescript
{
  conversationId: string,
  action: "answer_submitted",
  requestType: "field_question",
  userMessage: {
    content: string,
    fieldId: string,
    sectionId: string
  },
  syncData: {
    currentSection: {...},
    nextField: {...},
    sectionAnswers: {...},
    completedSections: [...],
    context: {...}
  }
}
```

**Response:**
```typescript
{
  success: true,
  message: string,  // AI-generated question
  metadata: {
    mode: string,
    message_count: number,
    checkpoint_id: string
  }
}
```

#### `generateSectionIntro()`
Generates section introduction message.

#### `generateTransition()`
Generates transition message between sections.

#### `generateCompletion()`
Generates document completion message.

#### `checkHealth()`
Checks if Python service is healthy.

---

## 🔄 Conversation Flow

### 1. Start Conversation
```
POST /api/template-generation/conversations/start
```

NestJS creates conversation record, generates welcome message.

### 2. Submit Answer
```
POST /api/template-generation/conversations/:id/submit-answer
{
  "fieldId": "vendor_name",
  "value": "Acme Corp"
}
```

**Backend Flow:**
1. Validate answer
2. Store in PostgreSQL
3. Determine next field (skip conditional fields if needed)
4. **Call Python AI Service** via `AIClientService.generateFieldQuestion()`
5. Store AI response
6. Return to frontend

### 3. Section Completion

When user completes last field in section:
1. Generate markdown for section
2. **Call Python AI Service** via `AIClientService.generateTransition()`
3. Move to next section
4. Return section update + next question

### 4. Document Completion

When all sections complete:
1. Mark conversation as completed
2. **Call Python AI Service** via `AIClientService.generateCompletion()`
3. Return completion message

---

## 🛡️ Error Handling & Fallbacks

### Fallback Behavior

If Python service is unavailable, `AIClientService` automatically falls back to simple questions:

```typescript
// Python service down? Use simple fallback
{
  content: field.aiQuestion || field.label || "Please provide your answer.",
  metadata: { fallback: true, error: error.message }
}
```

### Health Check

The service checks Python API health on startup:

```typescript
await this.aiClientService.checkHealth();
// Logs warning if unreachable, but continues
```

### Retry Logic

Current: No automatic retries (single attempt)

To add retries, modify `ai-client.service.ts`:
```typescript
// Add axios-retry or implement manual retry logic
```

---

## 🧪 Testing the Integration

### Manual Testing

**1. Check Health:**
```bash
curl http://localhost:8000/health
```

**2. Test Direct Python API:**
```bash
curl -X POST http://localhost:8000/api/conversation/interact \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-001",
    "action": "answer_submitted",
    "requestType": "field_question",
    "syncData": {
      "currentSection": {
        "sectionId": "section-1",
        "sectionNumber": 1,
        "title": "Test Section"
      },
      "nextField": {
        "fieldId": "test_field",
        "label": "Test Field",
        "type": "text",
        "required": true,
        "aiQuestion": "What is the test value?"
      },
      "sectionAnswers": {},
      "completedSections": [],
      "context": {
        "orgName": "Test Org"
      }
    }
  }'
```

**3. Test via NestJS:**
```bash
# Start a conversation
curl -X POST http://localhost:3001/api/template-generation/conversations/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "YOUR_DOCUMENT_ID",
    "templateId": "vendor-risk-assessment"
  }'

# Submit an answer
curl -X POST http://localhost:3001/api/template-generation/conversations/CONVERSATION_ID/submit-answer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldId": "vendor_name",
    "value": "Acme Corp"
  }'
```

### Automated Testing

**Unit Tests** (To be added):
```typescript
// Test AIClientService
describe('AIClientService', () => {
  it('should generate field question', async () => {
    const result = await aiClientService.generateFieldQuestion(...);
    expect(result.content).toBeDefined();
  });
  
  it('should fallback when service unavailable', async () => {
    // Mock service down
    const result = await aiClientService.generateFieldQuestion(...);
    expect(result.metadata.fallback).toBe(true);
  });
});
```

---

## 📊 Monitoring & Debugging

### Logs

**NestJS Logs:**
```bash
# In terminal running npm run start:dev
[AIClientService] AI Client Service initialized with Python API at http://localhost:8000
[AIClientService] Python AI Service health: healthy
[AIClientService] Calling Python AI API: field_question for conversation conv-123
[AIClientService] Python AI response received: What is the vendor's name? Please...
```

**Python Service Logs:**
```bash
# In terminal running Python service
INFO:     127.0.0.1:54321 - "POST /api/conversation/interact HTTP/1.1" 200 OK
INFO:     Conversation conv-123: Generated question for field vendor_name
```

### Common Issues

**Issue 1: Python service not reachable**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution:** 
- Check Python service is running: `curl http://localhost:8000/health`
- Verify `PYTHON_AI_SERVICE_URL` in `.env`
- Check firewall/network settings

**Issue 2: Timeout**
```
Error: timeout of 30000ms exceeded
```
**Solution:**
- Increase timeout in `ai-client.service.ts`:
  ```typescript
  private readonly timeout: number = 60000; // 60 seconds
  ```
- Check Python service performance (Qwen3:8b inference time)

**Issue 3: Invalid JSON response**
```
Error: Unexpected token < in JSON at position 0
```
**Solution:**
- Python service returned HTML (error page) instead of JSON
- Check Python logs for errors
- Verify endpoint path is correct

---

## 🔧 Configuration Options

### Timeout Configuration

Default: 30 seconds

To change:
```typescript
// In ai-client.service.ts
private readonly timeout: number = 45000; // 45 seconds
```

### Connection Pool (Future Enhancement)

For production, consider using connection pooling:
```typescript
this.client = axios.create({
  baseURL: this.pythonApiUrl,
  timeout: this.timeout,
  maxRedirects: 0,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});
```

---

## 🚀 Production Deployment

### Environment Variables

**Production .env:**
```bash
# Point to deployed Python service
PYTHON_AI_SERVICE_URL="https://ai-service.yourdomain.com"

# Or internal URL if on same network
PYTHON_AI_SERVICE_URL="http://ai-service:8000"
```

### Docker Setup

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  nestjs-backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PYTHON_AI_SERVICE_URL=http://python-ai:8000
    depends_on:
      - python-ai
  
  python-ai:
    build: ./python-service
    ports:
      - "8000:8000"
    volumes:
      - ./python-service:/app
```

### Health Checks

Add to Docker Compose:
```yaml
python-ai:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## 📚 Additional Resources

- **Python AI Service Spec:** `guidelines/PYTHON_AI_SERVICE_API_SPECIFICATION.md`
- **Phase 3 Implementation:** `guidelines/AI_ASSISTED_DOCUMENT_BUILDER_IMPLEMENTATION.md`
- **LangGraph Documentation:** https://langchain-ai.github.io/langgraph/

---

## 🤝 Contributing

When modifying the integration:

1. **Update TypeScript Types:** Keep `ai-client.service.ts` interfaces in sync with Python API
2. **Handle New Request Types:** Add methods to `AIClientService` for new endpoints
3. **Update Tests:** Add unit tests for new functionality
4. **Document Changes:** Update this README

---

## ✅ Integration Checklist

- [ ] Python service running on port 8000
- [ ] `.env` file updated with `PYTHON_AI_SERVICE_URL`
- [ ] Health check passes: `curl http://localhost:8000/health`
- [ ] NestJS backend runs without errors
- [ ] Started conversation successfully
- [ ] Submitted answer and received AI-generated question
- [ ] Completed section and received transition message
- [ ] Verified fallback behavior (stop Python service and test)
- [ ] Checked logs for errors

---

**Last Updated:** March 2, 2026  
**Integration Version:** 1.0.0
