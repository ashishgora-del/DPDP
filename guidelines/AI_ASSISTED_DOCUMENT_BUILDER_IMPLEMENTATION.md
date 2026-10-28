# AI-Assisted Document Builder Implementation Guide

## Overview
This document outlines the implementation of an AI-assisted document builder that allows users to fill documents through a conversational interface. The system uses a Python AI service to generate content, while the Node.js backend orchestrates the conversation flow.

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend  │ ←──→ │  Node.js Backend │ ←──→ │  Python AI      │
│   (React)   │      │   (NestJS)       │      │  Service (HTTP) │
└─────────────┘      └──────────────────┘      └─────────────────┘
     │                        │                          │
     │                        ↓                          │
     │                 ┌─────────────┐                  │
     │                 │  PostgreSQL │                  │
     │                 │  Database   │                  │
     │                 └─────────────┘                  │
     │                        │                          │
     └────────────────────────┴──────────────────────────┘
     Stores: Documents, Conversations, Template Structures
```

---

## Data Structures

### 1. Template Structure (Stored in Database)

Template structure defines all sections, fields, and how they map to the final document.

```typescript
interface TemplateStructure {
  id: string; // "vendor-risk-assessment"
  name: string; // "Vendor Risk Assessment Framework"
  version: string; // "1.0"
  
  sections: TemplateSection[];
}

interface TemplateSection {
  sectionId: string; // "section-1-overview"
  sectionNumber: number; // 1
  title: string; // "Assessment Overview"
  emoji: string; // "1️⃣"
  description: string; // "Basic information about this vendor assessment"
  
  // Fields to collect from user
  fields: Field[];
  
  // How to generate markdown for this section
  outputTemplate: string; // Handlebars/mustache template
  
  // AI instructions (sent to Python service)
  aiInstructions: {
    systemPrompt: string;
    contextToInclude: string[]; // ["orgName", "assessmentTier", "previousSections"]
    tone: string; // "professional", "simple", "technical"
  };
}

interface Field {
  fieldId: string; // "assessment_name"
  label: string; // "Assessment Name"
  type: FieldType; // "text" | "textarea" | "select" | "multiselect" | "date" | "radio"
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiselect/radio
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // regex
    customRule?: string;
  };
  
  // What AI should ask
  aiQuestion: string; // "What would you like to name this assessment?"
  
  // Dependencies (skip field if condition not met)
  dependsOn?: {
    fieldId: string;
    condition: "equals" | "notEquals" | "includes";
    value: any;
  };
}

type FieldType = 
  | "text" 
  | "textarea" 
  | "select" 
  | "multiselect" 
  | "date" 
  | "radio" 
  | "number" 
  | "email" 
  | "url";
```

**Example Section Definition:**

```json
{
  "sectionId": "section-1-overview",
  "sectionNumber": 1,
  "title": "Assessment Overview",
  "emoji": "1️⃣",
  "description": "Basic information about this vendor assessment",
  "fields": [
    {
      "fieldId": "assessment_name",
      "label": "Assessment Name",
      "type": "text",
      "required": true,
      "placeholder": "e.g., CRM Vendor Review",
      "aiQuestion": "What would you like to name this assessment?",
      "validation": {
        "minLength": 3,
        "maxLength": 100
      }
    },
    {
      "fieldId": "assessment_date",
      "label": "Assessment Date",
      "type": "date",
      "required": true,
      "aiQuestion": "What's the assessment date? (You can press Enter to use today's date)",
      "defaultValue": "today"
    }
  ],
  "outputTemplate": "## 1️⃣ Assessment Overview\n\n**Purpose:** Evaluate whether a vendor processing personal data meets security and privacy requirements under DPDP Act 2023.\n\n| Field | Value |\n|-------|-------|\n| Assessment Name | {{assessment_name}} |\n| Assessment Date | {{assessment_date}} |\n| Business Unit | {{business_unit}} |\n| Vendor Name | {{vendor_name}} |\n| Service Description | {{vendor_service_description}} |\n\n",
  "aiInstructions": {
    "systemPrompt": "You are helping a user complete a Vendor Risk Assessment under India's DPDP Act 2023. Ask questions conversationally, one at a time. Be professional but friendly.",
    "contextToInclude": ["orgName", "assessmentTier"],
    "tone": "professional"
  }
}
```

---

## Conversation Flow & Section Updates

### Key Concept: Section Identifier in AI Response

**The AI service MUST return which section it's working on**, so we know where to update the document.

### Request to Python AI Service

When the frontend submits an answer, Node.js backend calls Python AI service:

```json
POST http://python-ai-service:5000/api/ai/conversation/step

{
  "conversationId": "uuid-123",
  "action": "submit_answer",
  
  // Current context
  "currentSection": {
    "sectionId": "section-1-overview",
    "sectionNumber": 1,
    "title": "Assessment Overview",
    "fields": [...] // All fields in this section
  },
  
  // What user just answered
  "answer": {
    "fieldId": "assessment_name",
    "value": "CRM Vendor Review"
  },
  
  // All previous answers in this section
  "sectionAnswers": {
    "assessment_name": "CRM Vendor Review"
  },
  
  // Global context
  "context": {
    "orgName": "test",
    "assessmentId": "13dbf1bb-e11f-4ce0-8e99-ab5ec4044bbc",
    "assessmentTier": "MODERATE",
    "templateId": "vendor-risk-assessment",
    "documentId": "468ad61f-c4d2-470f-8360-aac21dfa1c31"
  },
  
  // Previously completed sections (for context)
  "completedSections": [
    // Empty if this is first section
  ],
  
  // AI instructions from template
  "aiInstructions": {
    "systemPrompt": "You are helping...",
    "tone": "professional"
  }
}
```

### Response from Python AI Service

The Python service analyzes the answer and determines next action:

```typescript
// Case 1: Need more fields in current section
{
  "status": "continue_section",
  "sectionId": "section-1-overview", // ← CRITICAL: Which section we're updating
  "sectionComplete": false,
  
  "aiResponse": {
    "message": "Great! What's the assessment date? You can press Enter to use today's date (01 March 2026).",
    "messageType": "question",
    "timestamp": "2026-03-01T10:15:30Z"
  },
  
  "nextField": {
    "fieldId": "assessment_date",
    "label": "Assessment Date",
    "type": "date",
    "required": true,
    "defaultValue": "2026-03-01"
  },
  
  // Progress within section
  "progress": {
    "currentFieldIndex": 1,
    "totalFields": 5,
    "fieldsCompleted": 1
  }
}

// Case 2: Section complete, generate markdown
{
  "status": "section_complete",
  "sectionId": "section-1-overview", // ← Which section just finished
  "sectionComplete": true,
  
  "aiResponse": {
    "message": "Perfect! I have all the information for the Assessment Overview. Let me generate that section for you...",
    "messageType": "transition",
    "timestamp": "2026-03-01T10:20:00Z"
  },
  
  "generatedMarkdown": "## 1️⃣ Assessment Overview\n\n**Purpose:** Evaluate whether a vendor processing personal data meets security and privacy requirements under DPDP Act 2023.\n\n| Field | Value |\n|-------|-------|\n| Assessment Name | CRM Vendor Review |\n| Assessment Date | 01 March 2026 |\n| Business Unit | Customer Support |\n| Vendor Name | XYZ Technologies Pvt Ltd |\n| Service Description | Customer support ticketing platform |\n\n---\n",
  
  // What to do next
  "nextAction": "start_next_section",
  "nextSectionId": "section-2-basic-info"
}

// Case 3: Move to next section
{
  "status": "start_section",
  "sectionId": "section-2-basic-info", // ← Now working on this section
  "sectionComplete": false,
  
  "aiResponse": {
    "message": "Excellent! Now let's move to Section 2: Vendor Basic Information.\n\nThis section will collect the vendor's legal details. Ready to continue?",
    "messageType": "transition",
    "timestamp": "2026-03-01T10:20:05Z"
  },
  
  "nextField": {
    "fieldId": "vendor_legal_name",
    "label": "Vendor Legal Name",
    "type": "text",
    "required": true
  }
}

// Case 4: All sections complete
{
  "status": "document_complete",
  "sectionId": null, // No active section
  
  "aiResponse": {
    "message": "🎉 Congratulations! You've completed all 15 sections of the Vendor Risk Assessment.\n\nYour final document is ready. You can now review it, make edits, or export it.",
    "messageType": "completion",
    "timestamp": "2026-03-01T11:00:00Z"
  },
  
  "documentSummary": {
    "totalSections": 15,
    "completedSections": 15,
    "vendorName": "XYZ Technologies Pvt Ltd",
    "riskScore": 11,
    "riskTier": "MODERATE"
  },
  
  "finalMarkdown": "# Vendor Risk Assessment Framework\n\n*Assessment for: XYZ Technologies Pvt Ltd*\n*Organization: test*\n*Risk Tier: MODERATE*\n*Generated: 01 March 2026*\n\n---\n\n## 1️⃣ Assessment Overview\n...\n\n## 2️⃣ Vendor Basic Information\n...\n\n... [all 15 sections]"
}

// Case 5: Error or validation failure
{
  "status": "validation_error",
  "sectionId": "section-4-data-processing", // Which section had the error
  
  "aiResponse": {
    "message": "Hmm, that email doesn't look quite right. Could you please provide a valid email address?",
    "messageType": "error",
    "timestamp": "2026-03-01T10:30:00Z"
  },
  
  "retryField": {
    "fieldId": "contact_email",
    "label": "Contact Email",
    "type": "email",
    "errorReason": "Invalid email format"
  }
}
```

---

## How Section Updates Work

### Step-by-Step Flow

1. **User types answer in chat** → "CRM Vendor Review"

2. **Frontend sends to Node.js backend:**
   ```typescript
   POST /api/template-generation/conversations/:conversationId/answer
   {
     fieldId: "assessment_name",
     value: "CRM Vendor Review"
   }
   ```

3. **Node.js backend:**
   - Fetches conversation state from database
   - Identifies current section: `section-1-overview`
   - Validates answer against field rules
   - Stores answer in conversation state
   - Calls Python AI service with full context

4. **Python AI service returns:**
   ```json
   {
     "status": "continue_section",
     "sectionId": "section-1-overview", // ← THIS IS THE KEY
     "aiResponse": { "message": "What's the date?" },
     "nextField": { "fieldId": "assessment_date", ... }
   }
   ```

5. **Node.js backend:**
   - Updates conversation state:
     ```json
     {
       "currentSectionId": "section-1-overview", // ← Updated
       "currentFieldId": "assessment_date",
       "sections": {
         "section-1-overview": {
           "status": "in_progress",
           "answers": {
             "assessment_name": "CRM Vendor Review",
             "assessment_date": null // Not yet filled
           }
         }
       }
     }
     ```
   - Saves to database
   - Returns response to frontend

6. **Frontend receives:**
   ```json
   {
     "conversationId": "uuid-123",
     "currentSection": {
       "sectionId": "section-1-overview",
       "sectionNumber": 1,
       "title": "Assessment Overview",
       "status": "in_progress"
     },
     "aiMessage": "What's the assessment date?",
     "nextField": { ... },
     "progress": { "fieldsCompleted": 1, "totalFields": 5 }
   }
   ```

7. **Frontend updates UI:**
   - Adds AI message to chat
   - Shows date picker input
   - **DOES NOT** update center panel markdown yet (section incomplete)

8. **When section completes:**
   
   Python AI returns:
   ```json
   {
     "status": "section_complete",
     "sectionId": "section-1-overview", // ← Which section to update
     "generatedMarkdown": "## 1️⃣ Assessment Overview\n..."
   }
   ```

9. **Node.js backend:**
   - Updates document content:
     ```typescript
     // Merge new section into document
     const updatedContent = mergeSection(
       currentDocument.content,
       "section-1-overview", // From AI response
       generatedMarkdown
     );
     
     // Save to database
     await updateDocument(documentId, {
       content: updatedContent
     });
     ```

10. **Frontend receives:**
    ```json
    {
      "sectionUpdate": {
        "sectionId": "section-1-overview", // ← Which section was updated
        "markdown": "## 1️⃣ Assessment Overview\n...",
        "action": "insert" // or "replace" or "append"
      }
    }
    ```

11. **Frontend updates center panel:**
    ```typescript
    // In LiveDocumentPreview component
    useEffect(() => {
      if (response.sectionUpdate) {
        const { sectionId, markdown, action } = response.sectionUpdate;
        
        // Update document content
        updateDocumentSection(sectionId, markdown, action);
        
        // Scroll to newly updated section
        scrollToSection(sectionId);
        
        // Highlight for 2 seconds
        highlightSection(sectionId, 2000);
      }
    }, [response]);
    ```

---

## Document Merging Strategy

### Section Markers in Markdown

Each section has a unique marker for identification:

```markdown
<!-- SECTION:section-1-overview:START -->
## 1️⃣ Assessment Overview

**Purpose:** Evaluate whether a vendor...

| Field | Value |
|-------|-------|
| Assessment Name | CRM Vendor Review |
...
<!-- SECTION:section-1-overview:END -->

<!-- SECTION:section-2-basic-info:START -->
## 2️⃣ Vendor Basic Information

[Content here]
<!-- SECTION:section-2-basic-info:END -->
```

### Merge Function (Node.js Backend)

```typescript
function mergeSection(
  currentContent: string,
  sectionId: string,
  newMarkdown: string
): string {
  const startMarker = `<!-- SECTION:${sectionId}:START -->`;
  const endMarker = `<!-- SECTION:${sectionId}:END -->`;
  
  const wrappedContent = `${startMarker}\n${newMarkdown}\n${endMarker}`;
  
  // Check if section already exists
  const startIndex = currentContent.indexOf(startMarker);
  
  if (startIndex === -1) {
    // Section doesn't exist, append it
    return `${currentContent}\n\n${wrappedContent}`;
  } else {
    // Section exists, replace it
    const endIndex = currentContent.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      throw new Error(`Malformed section markers for ${sectionId}`);
    }
    
    return (
      currentContent.substring(0, startIndex) +
      wrappedContent +
      currentContent.substring(endIndex + endMarker.length)
    );
  }
}
```

### Extracting Sections for Preview (Frontend)

```typescript
function parseSections(markdown: string): ParsedSection[] {
  const sectionRegex = /<!-- SECTION:([\w-]+):START -->([\s\S]*?)<!-- SECTION:\1:END -->/g;
  const sections: ParsedSection[] = [];
  
  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    sections.push({
      sectionId: match[1],
      content: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return sections;
}
```

---

## Database Schema

### 1. Templates Table

```sql
CREATE TABLE document_templates (
  id VARCHAR(100) PRIMARY KEY, -- "vendor-risk-assessment"
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  structure JSONB NOT NULL, -- Full template structure (sections, fields, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example row
INSERT INTO document_templates (id, name, structure) VALUES (
  'vendor-risk-assessment',
  'Vendor Risk Assessment Framework',
  '{ "sections": [ ... ] }'::jsonb
);
```

### 2. Conversations Table

```sql
CREATE TABLE document_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  document_id UUID NOT NULL REFERENCES generated_documents(id),
  template_id VARCHAR(100) NOT NULL REFERENCES document_templates(id),
  assessment_id UUID REFERENCES risk_assessments(id),
  
  -- Conversation state
  current_section_id VARCHAR(100), -- "section-3-service-description"
  current_section_index INT DEFAULT 0, -- 2 (0-indexed)
  current_field_id VARCHAR(100), -- "service_description"
  
  -- Collected data
  answers JSONB DEFAULT '{}', -- All answers by section
  completed_sections VARCHAR(100)[] DEFAULT '{}', -- ["section-1-overview", ...]
  
  -- Chat history
  messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp, metadata}
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active | paused | completed | abandoned
  
  -- Metadata
  context JSONB DEFAULT '{}', -- orgName, assessmentTier, etc.
  progress_percentage INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON document_conversations(user_id);
CREATE INDEX idx_conversations_document ON document_conversations(document_id);
CREATE INDEX idx_conversations_status ON document_conversations(status);
```

**Example Row:**

```json
{
  "id": "conv-uuid-123",
  "user_id": "user-uuid",
  "document_id": "468ad61f-c4d2-470f-8360-aac21dfa1c31",
  "template_id": "vendor-risk-assessment",
  "assessment_id": "13dbf1bb-e11f-4ce0-8e99-ab5ec4044bbc",
  
  "current_section_id": "section-2-basic-info",
  "current_section_index": 1,
  "current_field_id": "vendor_legal_name",
  
  "answers": {
    "section-1-overview": {
      "assessment_name": "CRM Vendor Review",
      "assessment_date": "2026-03-01",
      "business_unit": "Customer Support",
      "vendor_name": "XYZ Technologies Pvt Ltd",
      "vendor_service_description": "Customer support platform"
    },
    "section-2-basic-info": {
      "vendor_legal_name": "XYZ Technologies Private Limited"
    }
  },
  
  "completed_sections": ["section-1-overview"],
  
  "messages": [
    {
      "id": "msg-1",
      "role": "ai",
      "content": "Hi! I'll help you...",
      "timestamp": "2026-03-01T10:00:00Z",
      "metadata": { "type": "intro" }
    },
    {
      "id": "msg-2",
      "role": "ai",
      "content": "What would you like to name this assessment?",
      "timestamp": "2026-03-01T10:00:05Z",
      "metadata": { "sectionId": "section-1-overview", "fieldId": "assessment_name" }
    },
    {
      "id": "msg-3",
      "role": "user",
      "content": "CRM Vendor Review",
      "timestamp": "2026-03-01T10:00:15Z",
      "metadata": { "fieldId": "assessment_name" }
    }
  ],
  
  "status": "active",
  "context": {
    "orgName": "test",
    "assessmentTier": "MODERATE"
  },
  "progress_percentage": 7, // 1 of 15 sections complete
  
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-01T10:22:30Z"
}
```

### 3. Update Generated Documents Table

```sql
ALTER TABLE generated_documents
  ADD COLUMN conversation_id UUID REFERENCES document_conversations(id),
  ADD COLUMN creation_mode VARCHAR(50) DEFAULT 'quick', -- quick | ai_assisted | manual
  ADD COLUMN ai_assisted_metadata JSONB; -- Store AI-related metadata
```

---

## API Endpoints

### Frontend ↔ Node.js Backend

#### 1. Start AI Conversation

```typescript
POST /api/template-generation/documents/:documentId/start-ai-conversation

Request Body:
{
  templateId: "vendor-risk-assessment",
  assessmentId?: "uuid" // Optional
}

Response:
{
  conversationId: "uuid",
  welcomeMessage: {
    role: "ai",
    content: "Hi! I'll help you complete this Vendor Risk Assessment...",
    timestamp: "2026-03-01T10:00:00Z"
  },
  currentSection: {
    sectionId: "section-1-overview",
    sectionNumber: 1,
    title: "Assessment Overview",
    emoji: "1️⃣",
    totalSections: 15
  },
  firstField: {
    fieldId: "assessment_name",
    label: "Assessment Name",
    type: "text",
    required: true,
    placeholder: "e.g., CRM Vendor Review"
  }
}
```

#### 2. Submit Answer

```typescript
POST /api/template-generation/conversations/:conversationId/answer

Request Body:
{
  fieldId: "assessment_name",
  value: "CRM Vendor Review"
}

Response:
{
  success: true,
  
  // AI response
  aiMessage: {
    role: "ai",
    content: "Great! What's the assessment date?",
    timestamp: "2026-03-01T10:00:20Z"
  },
  
  // What to show next
  nextField: {
    fieldId: "assessment_date",
    label: "Assessment Date",
    type: "date",
    required: true,
    defaultValue: "2026-03-01"
  } | null, // null if section complete
  
  // Section update (if section just completed)
  sectionUpdate?: {
    sectionId: "section-1-overview",
    markdown: "## 1️⃣ Assessment Overview\n...",
    action: "replace" // replace | append
  },
  
  // Progress
  progress: {
    currentSection: 1,
    totalSections: 15,
    sectionFieldsCompleted: 1,
    sectionFieldsTotal: 5,
    overallPercentage: 1 // 1% (1 field of ~75 total)
  }
}
```

#### 3. Get Conversation State (Resume)

```typescript
GET /api/template-generation/conversations/:conversationId

Response:
{
  conversationId: "uuid",
  status: "active" | "paused" | "completed",
  
  currentSection: {
    sectionId: "section-2-basic-info",
    sectionNumber: 2,
    title: "Vendor Basic Information"
  },
  
  completedSections: ["section-1-overview"],
  
  messages: [...], // Full chat history
  
  answers: {
    "section-1-overview": { ... }
  },
  
  progress: {
    currentSection: 2,
    totalSections: 15,
    overallPercentage: 7
  }
}
```

#### 4. Pause Conversation

```typescript
POST /api/template-generation/conversations/:conversationId/pause

Response:
{
  success: true,
  message: "Conversation paused. You can resume anytime."
}
```

#### 5. Get Template Structure

```typescript
GET /api/template-generation/templates/:templateId/structure

Response:
{
  templateId: "vendor-risk-assessment",
  name: "Vendor Risk Assessment Framework",
  version: "1.0",
  
  sections: [
    {
      sectionId: "section-1-overview",
      sectionNumber: 1,
      title: "Assessment Overview",
      emoji: "1️⃣",
      description: "Basic information...",
      fields: [...]
    },
    // ... all 15 sections
  ],
  
  totalFields: 75, // Across all sections
  estimatedTime: "12-15 minutes"
}
```

---

### Node.js Backend ↔ Python AI Service

#### 1. Conversation Step

```typescript
POST http://python-ai-service:5000/api/ai/conversation/step

Request Body:
{
  "conversationId": "uuid",
  "action": "submit_answer",
  
  "currentSection": {
    "sectionId": "section-1-overview",
    "sectionNumber": 1,
    "title": "Assessment Overview",
    "fields": [...]
  },
  
  "answer": {
    "fieldId": "assessment_name",
    "value": "CRM Vendor Review"
  },
  
  "sectionAnswers": {
    "assessment_name": "CRM Vendor Review"
  },
  
  "context": {
    "orgName": "test",
    "assessmentId": "uuid",
    "assessmentTier": "MODERATE",
    "templateId": "vendor-risk-assessment"
  },
  
  "completedSections": [],
  
  "aiInstructions": {
    "systemPrompt": "You are helping...",
    "tone": "professional"
  }
}

Response: (See "Response from Python AI Service" section above)
```

#### 2. Generate Section Content

```typescript
POST http://python-ai-service:5000/api/ai/conversation/generate-section

Request Body:
{
  "conversationId": "uuid",
  "sectionId": "section-1-overview",
  "sectionTitle": "Assessment Overview",
  "answers": {
    "assessment_name": "CRM Vendor Review",
    "assessment_date": "2026-03-01",
    ...
  },
  "outputTemplate": "## 1️⃣ Assessment Overview\n...", // Handlebars template
  "context": {
    "orgName": "test",
    "assessmentTier": "MODERATE"
  }
}

Response:
{
  "sectionId": "section-1-overview",
  "markdown": "## 1️⃣ Assessment Overview\n\n**Purpose:**...",
  "generatedAt": "2026-03-01T10:05:00Z"
}
```

---

## Implementation Checklist

### Phase 1: Setup & Data Structure
- [ ] Create `document_templates` table
- [ ] Create `document_conversations` table
- [ ] Define Vendor Risk Assessment template structure (JSON)
- [ ] Seed template into database
- [ ] Create TypeScript interfaces for template structure

### Phase 2: Backend API (Node.js)
- [ ] Create `ConversationService` with state management
- [ ] Implement `startConversation` endpoint
- [ ] Implement `submitAnswer` endpoint
- [ ] Implement `getConversation` endpoint (resume)
- [ ] Implement `pauseConversation` endpoint
- [ ] Implement document merging logic (section markers)
- [ ] Add HTTP client for Python AI service

### Phase 3: Frontend Components
- [ ] Create state management (Context/Zustand) for AI mode
- [ ] Add "Fill using AI" button to DocumentEditorPage toolbar
- [ ] Create `SectionProgressSidebar` component
- [ ] Create `LiveDocumentPreview` component
- [ ] Create `ChatPanel` component
- [ ] Create `ChatMessage` component
- [ ] Create `DynamicInput` component (all field types)
- [ ] Implement layout switching (manual ↔ AI mode)

### Phase 4: Integration
- [ ] Connect frontend to backend API
- [ ] Test conversation flow end-to-end
- [ ] Test document updates in center panel
- [ ] Test section highlighting and scrolling
- [ ] Add error handling and retry logic

### Phase 5: Polish
- [ ] Add loading states and animations
- [ ] Add progress indicators
- [ ] Implement pause/resume functionality
- [ ] Add validation feedback
- [ ] Mobile responsive design
- [ ] Add keyboard shortcuts (Enter to send, etc.)

### Phase 6: Python AI Service Integration
- [ ] Define AI service contract (request/response format)
- [ ] Test with mock AI responses first
- [ ] Connect to real Python AI service
- [ ] Handle streaming responses (if applicable)
- [ ] Add timeout and error handling

---

## Testing Strategy

### Unit Tests
- Template structure validation
- Field validation logic
- Document merging function
- Section parsing

### Integration Tests
- Full conversation flow (15 sections)
- Pause and resume conversation
- Switch between manual and AI mode
- Error handling (invalid answers, AI service down)

### E2E Tests
- User completes full vendor risk assessment via AI
- User pauses, closes browser, resumes later
- User switches to manual edit mid-conversation
- Generated document matches expected structure

---

## Error Handling

### AI Service Unavailable
```typescript
if (aiServiceError) {
  return {
    fallback: true,
    aiMessage: {
      content: "I'm having trouble connecting right now. You can continue in manual mode or try again later.",
      type: "error"
    },
    actions: [
      { label: "Switch to Manual Edit", action: "manual_mode" },
      { label: "Retry", action: "retry" }
    ]
  };
}
```

### Invalid Answer
```typescript
if (validationError) {
  return {
    aiMessage: {
      content: "That doesn't look like a valid email address. Could you try again?",
      type: "validation_error"
    },
    retryField: currentField
  };
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own conversations
3. **Input Validation**: Sanitize all user inputs before storing
4. **Rate Limiting**: Limit AI service calls per user per minute
5. **Data Privacy**: Conversation data contains sensitive information - encrypt at rest

---

## Performance Optimization

1. **Caching**: Cache template structures (rarely change)
2. **Debouncing**: Debounce AI calls if user types quickly
3. **Lazy Loading**: Load only current section's fields, not all 15 upfront
4. **Streaming**: Stream AI responses for better perceived performance
5. **Optimistic Updates**: Update UI immediately, sync with backend async

---

## Future Enhancements

1. **Voice Input**: Allow users to speak answers
2. **Document Templates**: Pre-fill common vendor types (Cloud, SaaS, etc.)
3. **Multi-language Support**: Hindi, English
4. **Export Formats**: PDF, DOCX, HTML
5. **Approval Workflows**: Route completed assessments for approval
6. **Analytics**: Track which sections take longest, where users drop off

---

## Questions for Python AI Team

1. What's the base URL for the AI service? (e.g., `http://localhost:5000`)
2. Does the AI service support streaming responses? (SSE/WebSocket)
3. What's the expected response time per request? (for timeout setting)
4. Is there rate limiting on the AI service? (requests per minute)
5. Do we need API keys for authentication?
6. Can the AI service handle multiple concurrent conversations per user?

---

## Conclusion

The key to section updates is **the `sectionId` field in every AI response**. This tells our system:
- Which section the user is currently working on
- When a section is complete and needs markdown generation
- Where to insert/update content in the live document preview

The section markers (`<!-- SECTION:xxx:START/END -->`) ensure we can cleanly merge content without breaking the document structure.
