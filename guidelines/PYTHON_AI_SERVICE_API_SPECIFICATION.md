# Python AI Service - API Specification (LangGraph Edition)

**Version**: 2.0  
**Date**: March 1, 2026  
**Purpose**: FastAPI + LangGraph service for AI-powered conversational document generation

---

## 📋 Overview

This document specifies the API contract between the **NestJS Backend** and the **Python FastAPI + LangGraph AI Service**. This uses a **hybrid state management approach** for optimal context management and conversation quality.

### Architecture Decision: Hybrid State Management

**Why LangGraph?** 🎯

You're absolutely right to be concerned about context management! A purely stateless Python service has limitations:

❌ **Problems with Stateless Approach**:
- Poor conversation memory (must send full history each time)
- No semantic memory optimization
- Cannot handle complex conversation flows (clarifications, follow-ups)
- Inefficient token usage
- No conversation checkpointing
- Limited by request size limits

✅ **Benefits of LangGraph State Management**:
- **Superior Context Management**: Built-in memory and state persistence
- **Conversation Checkpoints**: Save/restore conversation state
- **Memory Optimization**: Semantic memory compression and relevance filtering
- **Complex Flows**: Handle clarifications, corrections, branching conversations
- **Tool Integration**: RAG, function calling, multi-agent patterns
- **Token Efficiency**: Smart context windowing

### Hybrid Architecture (RECOMMENDED)

**Division of Responsibilities**:

| Aspect | NestJS Backend | Python + LangGraph |
|--------|---------------|-------------------|
| **Business Logic State** | ✅ Owns | ❌ Receives sync |
| **Conversation Memory** | ❌ Stores messages | ✅ Owns & optimizes |
| **Answers Storage** | ✅ PostgreSQL | ❌ Reads only |
| **Section Navigation** | ✅ All logic | ❌ None |
| **Field Validation** | ✅ All validation | ❌ None |
| **AI Generation** | ❌ None | ✅ Primary role |
| **Context Awareness** | ✅ Provides data | ✅ Manages memory |
| **Conversation Flow** | ❌ Linear only | ✅ Complex flows |

**Key Insight**: 
- **NestJS** = Source of truth for business data (answers, sections, validation)
- **LangGraph** = Source of truth for conversation memory and AI context
- **Sync**: After each interaction, both systems update their respective states

---

## 🏗️ Hybrid Architecture with LangGraph

```
┌────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                            │
│  - Displays chat interface                                         │
│  - Sends user answers to NestJS backend                            │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         │ HTTP: POST /submit-answer
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│              NestJS Backend (Business Logic Owner)                 │
│                                                                     │
│  STATE MANAGEMENT:                                                 │
│  ✅ Current section/field position (PostgreSQL)                    │
│  ✅ All user answers (PostgreSQL)                                  │
│  ✅ Completed sections list                                        │
│  ✅ Field validation                                               │
│  ✅ Conditional field logic                                        │
│  ✅ Section completion detection                                   │
│  ✅ Markdown generation                                            │
│  ✅ Pause/resume/abandon                                           │
│                                                                     │
│  FLOW:                                                             │
│  1. Validate answer                                                │
│  2. Store in PostgreSQL                                            │
│  3. Determine next field                                           │
│  4. Call Python API with context                                   │
│  5. Store AI response                                              │
│  6. Return to frontend                                             │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         │ HTTP: POST /api/conversation/interact
                         │ Payload: {conversationId, userMessage, context}
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│         Python FastAPI + LangGraph (Conversation Owner)            │
│                                                                     │
│  LANGGRAPH STATE (In-memory/Redis/PostgreSQL):                    │
│  ✅ Conversation memory (optimized)                                │
│  ✅ Semantic context (compressed)                                  │
│  ✅ User intent history                                            │
│  ✅ Clarification chains                                           │
│  ✅ Conversation checkpoints                                       │
│  ✅ Message relevance scores                                       │
│                                                                     │
│  GRAPH NODES:                                                      │
│  - Conversation Router (route to appropriate handler)             │
│  - Question Generator (generate contextual questions)              │
│  - Context Manager (maintain relevant memory)                     │
│  - Clarification Handler (handle user questions/corrections)      │
│  - Transition Generator (section intro/completion messages)       │
│  - Memory Optimizer (compress/summarize long contexts)            │
│                                                                     │
│  FLOW:                                                             │
│  1. Load conversation state from LangGraph store                   │
│  2. Update memory with latest context from NestJS                  │
│  3. Generate AI response using graph                               │
│  4. Save updated conversation state                                │
│  5. Return AI message                                              │
└────────────────────────────────────────────────────────────────────┘
         │
         │ Persistent Storage
         ▼
┌────────────────────────────────────────────────────────────────────┐
│               LangGraph State Store (Redis/PostgreSQL)             │
│  - conversation_states table                                       │
│  - Stores: memory, checkpoints, compressed context                 │
└────────────────────────────────────────────────────────────────────┘
```

### State Synchronization Strategy

```
User submits answer
        │
        ▼
┌──────────────────┐
│  NestJS Backend  │
├──────────────────┤
│ 1. Validate      │
│ 2. Store answer  │──────► PostgreSQL (answers table)
│ 3. Next field?   │
└────────┬─────────┘
         │
         │ Call Python API with:
         │ - conversationId
         │ - Latest answer
         │ - Current field info
         │ - Section context
         ▼
┌──────────────────┐
│ Python LangGraph │
├──────────────────┤
│ 1. Load state    │◄────── Redis/PG (conversation memory)
│ 2. Update memory │
│ 3. Generate AI   │
│ 4. Save state    │──────► Redis/PG (updated memory)
└────────┬─────────┘
         │
         │ Return: AI message
         ▼
┌──────────────────┐
│  NestJS Backend  │
├──────────────────┤
│ Store AI message │──────► PostgreSQL (messages)
└────────┬─────────┘
         │
         ▼
      Frontend
```

---

## 🎯 Responsibilities (Updated for LangGraph)

### NestJS Backend (Business Logic & Data Owner)
- ✅ **Answer Storage**: All user answers in PostgreSQL
- ✅ **Position Tracking**: Current section/field in PostgreSQL
- ✅ **Validation**: All field validation before AI call
- ✅ **Navigation Logic**: Next field determination (conditional fields)
- ✅ **Section Management**: Completion detection, markdown generation
- ✅ **Security**: Authentication, authorization, user ownership
- ✅ **Pause/Resume**: Conversation lifecycle management
- ✅ **Sync to Python**: Send context updates to LangGraph

### Python FastAPI + LangGraph (Conversation & Memory Owner)
- ✅ **Conversation Memory**: Semantic memory of chat history
- ✅ **Context Optimization**: Compress and filter relevant context
- ✅ **AI Generation**: Generate natural, contextual responses
- ✅ **Clarifications**: Handle user questions, corrections, "wait, let me change that"
- ✅ **Conversation Flow**: Branch to clarifications, return to main flow
- ✅ **Checkpointing**: Save conversation states for recovery
- ✅ **Memory Tools**: RAG, semantic search over conversation history
- ❌ **NO Navigation**: Never decides next field/section
- ❌ **NO Validation**: Trusts NestJS has validated data
- ❌ **NO Answer Storage**: Only stores conversation memory

---

## 🧠 LangGraph State Structure

### Conversation State Schema

```python
from typing import TypedDict, List, Optional
from langchain_core.messages import BaseMessage

class ConversationState(TypedDict):
    """LangGraph state for document generation conversations"""
    
    # Core Identifiers
    conversation_id: str
    user_id: str
    document_id: str
    template_id: str
    
    # Conversation Memory
    messages: List[BaseMessage]  # Full chat history (all messages)
    compressed_memory: str  # Summarized conversation for context window
    
    # Current Context (synced from NestJS)
    current_section: dict  # Section info from NestJS
    current_field: dict  # Field info from NestJS
    latest_answer: Optional[dict]  # Most recent user answer
    
    # Business Data (read-only, synced from NestJS)
    section_answers: dict  # Answers in current section
    completed_sections: List[str]  # List of completed section IDs
    context: dict  # org_name, assessment_tier, etc.
    
    # Conversation Flow State
    mode: str  # "question" | "clarification" | "correction" | "transition"
    pending_clarification: Optional[str]  # If user asked a question
    
    # Memory Management
    memory_tokens: int  # Current memory token count
    relevance_threshold: float  # For filtering old messages
    
    # Metadata
    last_updated: str
    checkpoint_id: Optional[str]
```

### State Persistence

```python
# LangGraph stores state in PostgreSQL or Redis

# PostgreSQL table:
CREATE TABLE langgraph_conversation_states (
    conversation_id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    checkpoint_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

# Or Redis:
redis_key = f"conversation:{conversation_id}"
redis.set(redis_key, json.dumps(state), ex=86400)  # 24hr TTL
```

---

## 🔄 State Synchronization Protocol

### When User Submits Answer

**NestJS → Python API Call**:
```json
POST /api/conversation/interact
{
  "conversationId": "uuid",
  "action": "answer_submitted",
  
  // Latest user input
  "userMessage": {
    "content": "Zendesk Inc.",
    "fieldId": "vendor_name",
    "sectionId": "section-1-overview"
  },
  
  // Sync data from NestJS database
  "syncData": {
    "currentSection": {
      "sectionId": "section-1-overview",
      "sectionNumber": 1,
      "title": "Assessment Overview",
      "completedFields": ["assessment_name"]
    },
    "nextField": {
      "fieldId": "assessment_date",
      "label": "Assessment Date",
      "type": "date",
      "required": true,
      "aiQuestion": "What's the assessment date?"
    },
    "sectionAnswers": {
      "assessment_name": "CRM Vendor Review",
      "vendor_name": "Zendesk Inc."
    },
    "completedSections": [],
    "context": {
      "orgName": "Acme Corp",
      "assessmentTier": "MODERATE"
    }
  },
  
  // Request type
  "requestType": "field_question"
}
```

**Python LangGraph Processing**:
```python
# 1. Load state
state = load_conversation_state(conversation_id)

# 2. Update state with sync data from NestJS
state["current_section"] = sync_data["currentSection"]
state["current_field"] = sync_data["nextField"]
state["latest_answer"] = user_message
state["section_answers"] = sync_data["sectionAnswers"]
state["completed_sections"] = sync_data["completedSections"]
state["context"] = sync_data["context"]

# 3. Add user message to memory
state["messages"].append(HumanMessage(content=user_message["content"]))

# 4. Compress memory if needed
if len(state["messages"]) > 20:
    state["compressed_memory"] = compress_memory(state["messages"])

# 5. Generate AI response using graph
ai_message = await graph.invoke(state)

# 6. Add AI message to memory
state["messages"].append(AIMessage(content=ai_message))

# 7. Save updated state
save_conversation_state(conversation_id, state)

# 8. Return AI message to NestJS
return {"message": ai_message}
```

**NestJS Receives Response**:
```typescript
// Store AI message in PostgreSQL
conversation.messages.push({
  id: randomUUID(),
  role: 'ai',
  content: aiResponse.message,
  timestamp: new Date().toISOString()
});

await this.updateConversation(conversationId, {
  messages: conversation.messages
});
```

---

## 📡 API Endpoint

### Base URL
```
http://localhost:8000  # Development
```

### Endpoint
```
POST /api/generate-response
```

---

## 📥 Request Format

### Headers
```http
Content-Type: application/json
```

### Request Body

```typescript
{
  // Current conversation state
  "conversationId": "uuid",
  "userId": "uuid",
  "documentId": "uuid",
  
  // Template information
  "templateId": "vendor-risk-assessment",
  "templateName": "Vendor Risk Assessment Framework",
  
  // Current position in conversation
  "currentSection": {
    "sectionId": "section-3-service-description",
    "sectionNumber": 3,
    "title": "Service Description",
    "emoji": "3️⃣",
    "description": "Purpose and nature of the vendor relationship",
    "aiInstructions": {
      "systemPrompt": "You are helping a user complete a Vendor Risk Assessment...",
      "contextToInclude": ["orgName", "assessmentTier"],
      "tone": "professional"
    }
  },
  
  // Current field to ask about
  "currentField": {
    "fieldId": "service_provided",
    "label": "What service does the vendor provide?",
    "type": "textarea",
    "required": true,
    "placeholder": "e.g., Cloud hosting services",
    "aiQuestion": "Please describe in detail what service does the vendor provide to your organization?",
    "helpText": "Include specific details about the service"
  },
  
  // Context for personalization
  "context": {
    "orgName": "Acme Corp",
    "assessmentId": "uuid",
    "assessmentTier": "MODERATE",
    "geography": "India",
    "documentId": "uuid",
    "templateId": "vendor-risk-assessment"
  },
  
  // Conversation history (last 10-20 messages for context)
  "conversationHistory": [
    {
      "id": "msg-1",
      "role": "ai",
      "content": "Hi! I'll help you complete the Vendor Risk Assessment...",
      "timestamp": "2026-03-01T10:00:00Z",
      "type": "intro"
    },
    {
      "id": "msg-2",
      "role": "user",
      "content": "CRM Vendor Review",
      "timestamp": "2026-03-01T10:00:30Z",
      "type": "answer",
      "metadata": {
        "sectionId": "section-1-overview",
        "fieldId": "assessment_name"
      }
    },
    {
      "id": "msg-3",
      "role": "ai",
      "content": "Great! What's the vendor's name?",
      "timestamp": "2026-03-01T10:00:31Z",
      "type": "question",
      "metadata": {
        "sectionId": "section-1-overview",
        "fieldId": "vendor_name"
      }
    }
    // ... more messages
  ],
  
  // Previous answers in this section (for context)
  "sectionAnswers": {
    "business_unit": "Customer Support",
    "vendor_name": "Zendesk Inc."
  },
  
  // All completed sections (for reference)
  "completedSections": [
    "section-1-overview",
    "section-2-basic-info"
  ],
  
  // Request type (what kind of response to generate)
  "requestType": "field_question" | "section_intro" | "transition" | "completion"
}
```

---

## 📤 Response Format

### Success Response (200 OK)

```typescript
{
  "success": true,
  
  // AI-generated message
  "message": {
    "content": "Please describe in detail what service does the vendor provide to your organization? For example, is it a CRM platform, cloud hosting, email services, or something else?",
    "tone": "professional",
    "personalizations": {
      "usedOrgName": true,
      "referencedPreviousAnswer": true,
      "context": ["vendor_name", "business_unit"]
    }
  },
  
  // Optional: Suggested follow-up based on common patterns
  "suggestions": [
    "Customer support ticketing",
    "CRM and sales automation",
    "Cloud infrastructure"
  ],
  
  // Metadata for logging/debugging
  "metadata": {
    "modelUsed": "gpt-4",
    "tokensUsed": 150,
    "generationTime": 1.2,
    "temperature": 0.7
  }
}
```

### Error Response (400/500)

```typescript
{
  "success": false,
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Failed to generate AI response",
    "details": "Context length exceeded"
  }
}
```

---

## 🔄 Request Types Explained

### 1. `field_question` (Most Common)
**When**: User has submitted an answer, and we need to ask about the next field

**Example Input**:
```json
{
  "requestType": "field_question",
  "currentField": {
    "fieldId": "contact_email",
    "label": "Contact Email",
    "type": "email",
    "required": true,
    "aiQuestion": "What's their email address?"
  },
  "sectionAnswers": {
    "primary_contact_name": "John Smith"
  }
}
```

**Expected Output**:
```json
{
  "message": {
    "content": "What's John Smith's email address?"
  }
}
```

**Purpose**: Generate a natural, conversational question for the next field, optionally referencing previous answers.

---

### 2. `section_intro`
**When**: Starting a new section

**Example Input**:
```json
{
  "requestType": "section_intro",
  "currentSection": {
    "sectionNumber": 3,
    "title": "Service Description",
    "description": "Purpose and nature of the vendor relationship",
    "estimatedTime": "2 min"
  }
}
```

**Expected Output**:
```json
{
  "message": {
    "content": "Great! Now let's talk about the service itself. This section should take about 2 minutes."
  }
}
```

---

### 3. `transition`
**When**: Moving from one section to another

**Example Input**:
```json
{
  "requestType": "transition",
  "currentSection": {
    "sectionNumber": 2,
    "title": "Vendor Basic Information"
  },
  "completedSections": ["section-1-overview"]
}
```

**Expected Output**:
```json
{
  "message": {
    "content": "Perfect! Section 1 is complete. Let's move on to Vendor Basic Information."
  }
}
```

---

### 4. `completion`
**When**: All sections are complete

**Example Input**:
```json
{
  "requestType": "completion",
  "templateName": "Vendor Risk Assessment Framework",
  "completedSections": ["section-1-overview", "section-2-basic-info", "..."]
}
```

**Expected Output**:
```json
{
  "message": {
    "content": "Excellent work! Your Vendor Risk Assessment is now complete. The document has been generated with all 15 sections."
  }
}
```

---

## 🧠 How Navigation Works

### The Backend Handles Everything

```typescript
// Backend flow after user submits an answer:

1. Validate answer (NestJS)
2. Store answer in database (NestJS)
3. Find next field (NestJS handles conditional logic)
   - Skip fields with unmet dependencies
   - Detect section completion
   - Move to next section if needed
4. Call Python AI Service with context
5. Store AI response in database
6. Return to frontend
```

### Example: Conditional Field Handling

**Scenario**: Field `subprocessor_details` only appears if `uses_subprocessors` is "Yes"

**NestJS Backend Logic**:
```typescript
// After user answers: uses_subprocessors = "No"

// Backend checks:
const nextField = currentSection.fields[currentFieldIndex + 1]; // subprocessor_details
if (this.shouldSkipField(nextField, sectionAnswers)) {
  // Skip this field, find next valid field
  // Continue searching...
}

// Backend automatically skips subprocessor_details
// Finds next valid field
// Calls Python AI with that field
```

**Python AI Service**: Just generates question for whatever field backend sends. No logic needed.

---

## 📝 Context Maintenance

### Conversation History

The NestJS backend maintains **full conversation history** in PostgreSQL:

```sql
CREATE TABLE document_conversations (
  id TEXT PRIMARY KEY,
  messages JSONB,  -- Full chat history
  answers JSONB,   -- All answers by section
  current_section_id TEXT,
  current_field_id TEXT,
  completed_sections TEXT[],
  status TEXT,     -- 'active' | 'paused' | 'completed'
  context JSONB    -- orgName, assessmentTier, etc.
);
```

### What Python Receives

For each AI generation request, Python receives:
- ✅ Last 10-20 messages (recent context)
- ✅ All answers from current section
- ✅ Current field to ask about
- ✅ Organization context (name, tier, geography)
- ✅ Template instructions (tone, system prompt)

### What Python Does NOT Need

- ❌ Full answer history from all sections
- ❌ Database access
- ❌ Session management
- ❌ Field progression logic

---

## 🔙 Handling Edits & Redo

### User Says: "I want to change my answer for vendor name"

**Backend Flow**:

```typescript
// 1. User sends edit request via frontend
POST /api/conversations/:id/edit-field
{
  "sectionId": "section-1-overview",
  "fieldId": "vendor_name",
  "newValue": "Updated Vendor Inc."
}

// 2. Backend:
- Validates user has permission
- Updates answer in database
- Regenerates section markdown
- Optionally asks Python AI to generate a confirmation message

// 3. Python AI receives:
{
  "requestType": "field_edit_confirmation",
  "editedField": {
    "fieldId": "vendor_name",
    "oldValue": "Old Vendor",
    "newValue": "Updated Vendor Inc."
  }
}

// 4. Python AI responds:
{
  "message": {
    "content": "Got it! I've updated the vendor name to Updated Vendor Inc."
  }
}
```

### User Says: "Let me redo the security section"

**Backend Flow**:

```typescript
// 1. User sends redo request
POST /api/conversations/:id/redo-section
{
  "sectionId": "section-7-security"
}

// 2. Backend:
- Clears all answers for that section
- Removes completed section marker
- Sets current position to first field of that section
- Generates markdown without that section

// 3. Calls Python AI:
{
  "requestType": "section_restart",
  "currentSection": {
    "sectionId": "section-7-security",
    "title": "Security Safeguards"
  }
}

// 4. Python AI:
{
  "message": {
    "content": "No problem! Let's go through the Security Safeguards section again."
  }
}
```

---

## 🛡️ Validation & Error Handling

### Backend Validates ALL Inputs

```typescript
// NestJS backend validates BEFORE calling Python AI:
- Required fields
- Email format
- URL format
- String length constraints
- Number ranges
- Array selections

// If validation fails:
- Returns error to user immediately
- Does NOT call Python AI
- User fixes input and resubmits
```

### Python AI Focuses on Generation

```python
# Python just generates friendly responses
# No validation logic needed

def generate_response(request):
    # Trust that backend has validated everything
    # Focus on generating natural, conversational text
    return {
        "message": {
            "content": generate_ai_response(request)
        }
    }
```

---

## 🎨 Response Generation Guidelines

### Tone & Style

**Professional but Friendly**:
```
✅ "Great! What's the vendor's legal name?"
✅ "Perfect! Now, what's their website? (Optional)"
✅ "Thanks! Does the vendor use encryption at rest? (Yes/No)"

❌ "Please input VENDOR_LEGAL_NAME"
❌ "Provide URL or leave blank"
❌ "Select option from list"
```

### Context Awareness

**Use previous answers**:
```json
// If user answered: vendor_name = "Zendesk"
{
  "content": "Great! Does Zendesk process personal data on behalf of your organization? (Yes/No)"
}

// Instead of:
{
  "content": "Does the vendor process personal data? (Yes/No)"
}
```

### Field Type Adaptation

```typescript
// For text/textarea fields:
"What's the vendor's name?"

// For radio/select fields:
"Does the vendor use encryption at rest? (Yes/No)"

// For multiselect:
"Which categories of personal data will the vendor process? (You can select multiple)"

// For date fields:
"What's the assessment date? (Press Enter to use today's date)"

// For optional fields:
"What's the vendor's website? (Optional)"
```

---

## 🚀 LangGraph Implementation Example

### Complete FastAPI + LangGraph Service

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal, TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import os

app = FastAPI(title="AI Document Generation Service")

# ============================================================================
# State Definition
# ============================================================================

class ConversationState(TypedDict):
    """LangGraph conversation state"""
    conversation_id: str
    user_id: str
    document_id: str
    template_id: str
    
    # Conversation memory
    messages: Annotated[List, "Full conversation history"]
    compressed_memory: Optional[str]
    
    # Current context (synced from NestJS)
    current_section: Dict
    current_field: Optional[Dict]
    latest_answer: Optional[Dict]
    
    # Business data (read-only)
    section_answers: Dict
    completed_sections: List[str]
    context: Dict  # orgName, assessmentTier, etc.
    
    # Flow control
    mode: str  # "question" | "clarification" | "correction" | "transition"
    pending_clarification: Optional[str]
    
    # Generated output
    ai_response: Optional[str]

# ============================================================================
# Pydantic Models for API
# ============================================================================

class UserMessage(BaseModel):
    content: str
    fieldId: Optional[str] = None
    sectionId: Optional[str] = None

class SyncData(BaseModel):
    currentSection: Dict
    nextField: Optional[Dict] = None
    sectionAnswers: Dict
    completedSections: List[str]
    context: Dict

class InteractRequest(BaseModel):
    conversationId: str
    action: Literal["answer_submitted", "clarification_request", "section_transition"]
    userMessage: Optional[UserMessage] = None
    syncData: SyncData
    requestType: Literal["field_question", "section_intro", "transition", "completion"]

class InteractResponse(BaseModel):
    success: bool
    message: str
    metadata: Optional[Dict] = None

# ============================================================================
# LangGraph Setup
# ============================================================================

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize checkpoint saver (for state persistence)
# Option 1: PostgreSQL
from langgraph.checkpoint.postgres import PostgresSaver
import psycopg
checkpoint_conn = psycopg.connect(os.getenv("LANGGRAPH_DB_URL"))
checkpointer = PostgresSaver(checkpoint_conn)

# Option 2: Redis (alternative)
# from langgraph.checkpoint.redis import RedisSaver
# import redis
# redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))
# checkpointer = RedisSaver(redis_client)

# ============================================================================
# Graph Nodes
# ============================================================================

def route_conversation(state: ConversationState) -> str:
    """Determine which node to route to based on conversation mode"""
    if state.get("pending_clarification"):
        return "clarification"
    elif state.get("mode") == "correction":
        return "correction"
    elif state.get("mode") == "transition":
        return "transition"
    else:
        return "question_generation"

def compress_memory_node(state: ConversationState) -> ConversationState:
    """Compress conversation memory to fit context window"""
    messages = state.get("messages", [])
    
    # If messages exceed threshold, compress
    if len(messages) > 20:
        # Keep system message, first message, and last 10 messages
        system_msg = messages[0] if messages[0].type == "system" else None
        recent_messages = messages[-10:]
        
        # Summarize the middle section
        middle_messages = messages[1:-10] if len(messages) > 11 else []
        if middle_messages:
            summary_prompt = f"Summarize this conversation history in 2-3 sentences:\n\n"
            for msg in middle_messages:
                summary_prompt += f"{msg.type}: {msg.content}\n"
            
            summary = llm.invoke([HumanMessage(content=summary_prompt)])
            state["compressed_memory"] = summary.content
        
        # Update messages list
        compressed = [system_msg] if system_msg else []
        compressed.extend(recent_messages)
        state["messages"] = compressed
    
    return state

def generate_question(state: ConversationState) -> ConversationState:
    """Generate contextual question for the current field"""
    
    # Build system prompt
    context = state.get("context", {})
    org_name = context.get("orgName", "the organization")
    section = state.get("current_section", {})
    field = state.get("current_field", {})
    
    system_prompt = f"""You are an AI assistant helping {org_name} complete a {state.get("template_id", "document")}.

Current context:
- Section {section.get("sectionNumber")}: {section.get("title")}
- Organization: {org_name}
- Risk Tier: {context.get("assessmentTier", "not specified")}

Your role:
- Ask questions conversationally and naturally
- Be professional but friendly
- Reference previous answers when relevant
- Keep questions concise
- For optional fields, say "(Optional)"
- For radio/select, show options like "(Yes/No)"

Current field to ask about:
- Field: {field.get("label")}
- Type: {field.get("type")}
- Required: {field.get("required")}
- Suggested question: {field.get("aiQuestion", "")}
"""
    
    # Add conversation history
    messages = [SystemMessage(content=system_prompt)]
    messages.extend(state.get("messages", [])[-10:])  # Last 10 messages
    
    # Add compressed memory if exists
    if state.get("compressed_memory"):
        messages.append(SystemMessage(content=f"Earlier conversation summary: {state['compressed_memory']}"))
    
    # Add context from section answers
    section_answers = state.get("section_answers", {})
    if section_answers:
        context_info = "Previous answers in this section:\n"
        for field_id, value in section_answers.items():
            context_info += f"- {field_id}: {value}\n"
        messages.append(SystemMessage(content=context_info))
    
    # Generate question
    prompt = f"Generate a natural, conversational question for the field: {field.get('label')}."
    if field.get("options"):
        prompt += f" Options are: {', '.join(field['options'])}"
    
    messages.append(HumanMessage(content=prompt))
    
    ai_response = llm.invoke(messages)
    state["ai_response"] = ai_response.content
    state["messages"].append(ai_response)
    
    return state

def handle_clarification(state: ConversationState) -> ConversationState:
    """Handle user clarification requests or questions"""
    
    clarification = state.get("pending_clarification")
    
    system_prompt = """You are helping a user complete a document. They have a question or need clarification.
    
Provide a clear, helpful answer to their question, then guide them back to the current field."""
    
    messages = [SystemMessage(content=system_prompt)]
    messages.extend(state.get("messages", [])[-10:])
    messages.append(HumanMessage(content=f"User question: {clarification}"))
    
    ai_response = llm.invoke(messages)
    state["ai_response"] = ai_response.content
    state["messages"].append(ai_response)
    state["pending_clarification"] = None
    state["mode"] = "question"
    
    return state

def generate_transition(state: ConversationState) -> ConversationState:
    """Generate transition message between sections"""
    
    section = state.get("current_section", {})
    completed = state.get("completed_sections", [])
    
    prompt = f"""Generate a brief, encouraging transition message.
    
Context:
- Just completed section: {completed[-1] if completed else 'unknown'}
- Starting section {section.get('sectionNumber')}: {section.get('title')}
- Description: {section.get('description', '')}

Keep it short (1-2 sentences) and positive."""
    
    messages = [HumanMessage(content=prompt)]
    ai_response = llm.invoke(messages)
    state["ai_response"] = ai_response.content
    state["messages"].append(ai_response)
    
    return state

# ============================================================================
# Build LangGraph
# ============================================================================

# Create graph
workflow = StateGraph(ConversationState)

# Add nodes
workflow.add_node("router", route_conversation)
workflow.add_node("memory_compress", compress_memory_node)
workflow.add_node("question_generation", generate_question)
workflow.add_node("clarification", handle_clarification)
workflow.add_node("transition", generate_transition)

# Define edges
workflow.set_entry_point("memory_compress")
workflow.add_edge("memory_compress", "router")

# Conditional edges from router
workflow.add_conditional_edges(
    "router",
    lambda x: route_conversation(x),
    {
        "question_generation": "question_generation",
        "clarification": "clarification",
        "transition": "transition"
    }
)

# All paths lead to END
workflow.add_edge("question_generation", END)
workflow.add_edge("clarification", END)
workflow.add_edge("transition", END)

# Compile graph with checkpointer
graph = workflow.compile(checkpointer=checkpointer)

# ============================================================================
# API Endpoints
# ============================================================================

@app.post("/api/conversation/interact", response_model=InteractResponse)
async def interact(request: InteractRequest):
    """Main endpoint for conversation interaction with LangGraph state management"""
    
    try:
        # Build conversation state from request
        state: ConversationState = {
            "conversation_id": request.conversationId,
            "user_id": request.syncData.context.get("userId", "unknown"),
            "document_id": request.syncData.context.get("documentId", "unknown"),
            "template_id": request.syncData.context.get("templateId", "unknown"),
            
            # Initialize messages if this is the first interaction
            "messages": [],
            "compressed_memory": None,
            
            # Sync data from NestJS
            "current_section": request.syncData.currentSection,
            "current_field": request.syncData.nextField,
            "latest_answer": request.userMessage.dict() if request.userMessage else None,
            "section_answers": request.syncData.sectionAnswers,
            "completed_sections": request.syncData.completedSections,
            "context": request.syncData.context,
            
            # Set mode based on request type
            "mode": request.requestType,
            "pending_clarification": None,
            "ai_response": None
        }
        
        # Add user message to state if provided
        if request.userMessage:
            state["messages"].append(HumanMessage(content=request.userMessage.content))
        
        # Invoke graph with state and checkpoint
        config = {"configurable": {"thread_id": request.conversationId}}
        result = await graph.ainvoke(state, config=config)
        
        # Extract AI response
        ai_message = result.get("ai_response", "I'm ready to continue. What would you like to do?")
        
        return InteractResponse(
            success=True,
            message=ai_message,
            metadata={
                "mode": result.get("mode"),
                "message_count": len(result.get("messages", [])),
                "checkpoint_id": config["configurable"]["thread_id"]
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversation error: {str(e)}")

@app.post("/api/conversation/reset")
async def reset_conversation(conversation_id: str):
    """Reset conversation state (for testing)"""
    try:
        config = {"configurable": {"thread_id": conversation_id}}
        # Clear checkpoint
        checkpointer.delete(config)
        return {"success": True, "message": "Conversation reset"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-generation-langgraph",
        "langgraph_version": "0.0.1"
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Key Features of This Implementation

1. **State Persistence**: Uses PostgresSaver for checkpoint storage
2. **Memory Compression**: Automatically compresses long conversations
3. **Conversation Routing**: Handles questions, clarifications, transitions
4. **Context Awareness**: Uses previous answers and section context
5. **Checkpoint Recovery**: Can resume from any point
6. **Scalable**: Separate state per conversation_id

---

## 🚀 Alternative: Simpler FastAPI Implementation (Without LangGraph)

If you want to start simpler before adding LangGraph:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
import openai

app = FastAPI()

class Message(BaseModel):
    id: str
    role: Literal["ai", "user", "system"]
    content: str
    timestamp: str
    type: Optional[str] = None
    metadata: Optional[Dict] = None

class FieldInfo(BaseModel):
    fieldId: str
    label: str
    type: str
    required: bool
    placeholder: Optional[str] = None
    aiQuestion: Optional[str] = None
    options: Optional[List[str]] = None

class SectionInfo(BaseModel):
    sectionId: str
    sectionNumber: int
    title: str
    emoji: Optional[str] = None
    description: Optional[str] = None

class AIRequest(BaseModel):
    conversationId: str
    userId: str
    templateId: str
    templateName: str
    currentSection: SectionInfo
    currentField: Optional[FieldInfo] = None
    context: Dict
    conversationHistory: List[Message]
    sectionAnswers: Dict
    completedSections: List[str]
    requestType: Literal["field_question", "section_intro", "transition", "completion"]

class AIResponse(BaseModel):
    success: bool
    message: Dict
    suggestions: Optional[List[str]] = None
    metadata: Optional[Dict] = None

@app.post("/api/generate-response", response_model=AIResponse)
async def generate_response(request: AIRequest):
    try:
        # Build system prompt
        system_prompt = f"""You are an AI assistant helping users complete a {request.templateName}.
        
Your role:
- Ask questions conversationally, one at a time
- Be professional but friendly
- Reference previous answers when relevant
- Keep responses concise
- For India's DPDP Act 2023 compliance documents, mention relevant sections

Current context:
- Organization: {request.context.get('orgName', 'the organization')}
- Risk Tier: {request.context.get('assessmentTier', 'not specified')}

Guidelines:
- Use natural language
- Personalize based on previous answers
- Keep questions short and clear
- For optional fields, explicitly say "(Optional)"
- For radio/select fields, show options: "(Yes/No)"
"""

        # Build messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation history (last 10 messages)
        for msg in request.conversationHistory[-10:]:
            if msg.role in ["user", "ai"]:
                messages.append({
                    "role": "assistant" if msg.role == "ai" else "user",
                    "content": msg.content
                })
        
        # Add current prompt based on request type
        if request.requestType == "field_question" and request.currentField:
            field = request.currentField
            
            # Build prompt
            prompt = f"Ask the user about the following field:\n"
            prompt += f"Field: {field.label}\n"
            prompt += f"Type: {field.type}\n"
            prompt += f"Required: {field.required}\n"
            if field.aiQuestion:
                prompt += f"Suggested question: {field.aiQuestion}\n"
            if field.options:
                prompt += f"Options: {', '.join(field.options)}\n"
            
            # Add context from previous answers
            if request.sectionAnswers:
                prompt += f"\nPrevious answers in this section: {request.sectionAnswers}\n"
            
            prompt += "\nGenerate a natural, conversational question."
            
            messages.append({"role": "user", "content": prompt})
        
        elif request.requestType == "section_intro":
            prompt = f"Generate a brief, friendly introduction for starting section {request.currentSection.sectionNumber}: {request.currentSection.title}."
            if request.currentSection.description:
                prompt += f"\nDescription: {request.currentSection.description}"
            messages.append({"role": "user", "content": prompt})
        
        elif request.requestType == "transition":
            prompt = f"Generate a brief transition message indicating that the previous section is complete and we're moving to the next section."
            messages.append({"role": "user", "content": prompt})
        
        elif request.requestType == "completion":
            prompt = f"Generate a congratulatory message indicating that the {request.templateName} is now complete."
            messages.append({"role": "user", "content": prompt})
        
        # Call OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=150
        )
        
        ai_content = response.choices[0].message.content.strip()
        
        return AIResponse(
            success=True,
            message={
                "content": ai_content,
                "tone": "professional",
                "personalizations": {
                    "usedOrgName": request.context.get('orgName', '') in ai_content,
                    "referencedPreviousAnswer": False  # Could be enhanced
                }
            },
            metadata={
                "modelUsed": "gpt-4",
                "tokensUsed": response.usage.total_tokens,
                "temperature": 0.7
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-generation"}
```

---

## 🔌 NestJS Integration

### Calling Python Service from NestJS

```typescript
// backend/src/template-generation/ai-client.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AIClientService {
  private readonly logger = new Logger(AIClientService.name);
  private readonly pythonApiUrl: string;

  constructor() {
    this.pythonApiUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
  }

  async generateResponse(payload: any): Promise<{ content: string; metadata?: any }> {
    try {
      const response = await axios.post(
        `${this.pythonApiUrl}/api/generate-response`,
        payload,
        {
          timeout: 30000, // 30 seconds
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.data.success) {
        throw new Error(`AI generation failed: ${response.data.error?.message}`);
      }

      return {
        content: response.data.message.content,
        metadata: response.data.metadata
      };
    } catch (error) {
      this.logger.error(`AI service call failed: ${error.message}`);
      
      // Fallback to simple question if AI service unavailable
      return {
        content: payload.currentField?.aiQuestion || payload.currentField?.label || 'Please provide your answer.',
        metadata: { fallback: true }
      };
    }
  }
}
```

### Using in Conversation Service

```typescript
// In submitAnswer method:

// After validating and storing answer, call AI service
const aiPayload = {
  conversationId: conversation.id,
  userId,
  templateId: template.id,
  templateName: template.name,
  currentSection: this.serializeSection(currentSection),
  currentField: this.serializeField(nextField),
  context: conversation.context,
  conversationHistory: conversation.messages.slice(-20), // Last 20 messages
  sectionAnswers: conversation.answers[currentSection.sectionId] || {},
  completedSections: conversation.completed_sections,
  requestType: 'field_question'
};

const aiResult = await this.aiClientService.generateResponse(aiPayload);

const aiMessage: ChatMessage = {
  id: randomUUID(),
  role: 'ai',
  content: aiResult.content,
  timestamp: new Date().toISOString(),
  type: 'question',
  metadata: {
    fieldId: nextField.fieldId,
    sectionId: currentSection.sectionId,
    aiMetadata: aiResult.metadata
  }
};

conversation.messages.push(aiMessage);
```

---

## 📊 Summary: Hybrid Architecture with LangGraph

| Aspect | NestJS Backend | Python + LangGraph Service |
|--------|---------------|---------------------------|
| **Business State** | ✅ Authoritative source (PostgreSQL) | ❌ Read-only sync |
| **Conversation State** | ❌ No LLM memory | ✅ Authoritative source (Redis/PG) |
| **Navigation** | ✅ All logic | ❌ None |
| **Validation** | ✅ All validation | ❌ None |
| **Field Progression** | ✅ Conditional logic | ❌ None |
| **Section Detection** | ✅ Completion logic | ❌ None |
| **Answer Storage** | ✅ PostgreSQL | ❌ No access |
| **AI Generation** | ❌ None | ✅ Primary role |
| **Context Management** | ❌ Basic | ✅ Advanced (compression, semantic search) |
| **Conversation Memory** | ❌ None | ✅ Full history + compression |
| **Clarifications** | ❌ None | ✅ Handles complex flows |
| **Memory Optimization** | ❌ None | ✅ Compression, relevance filtering |

---

## 🎯 Key Takeaways (Updated for LangGraph)

1. **Hybrid State Management** - Two sources of truth:
   - **NestJS PostgreSQL**: Business data (answers, position, validation)
   - **LangGraph Store**: Conversation memory (chat history, compressed context)

2. **NestJS Still Manages Navigation** - Next section, next field, conditional logic

3. **State Synchronization** - After each interaction:
   - NestJS → Python: Send latest answer, next field, section context
   - Python → NestJS: Return AI message
   - Both systems update their respective stores

4. **LangGraph Benefits**:
   - ✅ Superior context management (memory compression)
   - ✅ Conversation checkpointing (resume from any point)
   - ✅ Complex conversation flows (clarifications, corrections)
   - ✅ Semantic memory optimization
   - ✅ Tool integration (RAG, function calling)

5. **Responsibility Division**:
   - **NestJS**: "What user answered" + "Where user is" + "What's next"
   - **LangGraph**: "How to generate contextual AI responses" + "Conversation optimization"

6. **Edits & Corrections** - Backend updates business state, Python handles conversation flow

7. **Validation** - All validation happens in NestJS, Python trusts data

---

## 🚀 Next Steps

### Phase 1: Setup Python Service
1. **Create Python FastAPI project** with LangGraph
2. **Set up environment**:
   ```bash
   pip install fastapi uvicorn langgraph langchain-openai psycopg redis
   ```
3. **Configure OpenAI API** key (or Azure OpenAI)
4. **Set up state persistence** (PostgreSQL or Redis for LangGraph checkpoints)

### Phase 2: Implement Core Components
1. **Define ConversationState TypedDict** (see example above)
2. **Create LangGraph nodes**:
   - Memory compression node
   - Question generation node
   - Clarification handler
   - Transition generator
3. **Build graph** with conditional routing
4. **Add checkpoint saver** for persistence

### Phase 3: Integration
1. **Create `/api/conversation/interact` endpoint**
2. **Implement state sync protocol**:
   - Receive sync data from NestJS
   - Load LangGraph state from checkpoint
   - Update state with latest info
   - Invoke graph
   - Save updated state
   - Return AI response
3. **Add health check endpoint**

### Phase 4: NestJS Integration
1. **Update NestJS conversation service** to call Python API
2. **Implement state sync logic**:
   - After user submits answer → Call Python with syncData
   - Receive AI response
   - Store in PostgreSQL messages table
   - Return to frontend
3. **Handle errors and retries**

### Phase 5: Testing & Deployment
1. **Test with mock data** (use Postman or curl)
2. **Test memory compression** (simulate long conversations)
3. **Test clarification flows**
4. **Deploy Python service** (Docker recommended)
5. **Deploy NestJS updates**
6. **Monitor conversation quality**

---

## 🛠️ Deployment Recommendations

### Python Service (FastAPI + LangGraph)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
```bash
# Python Service
OPENAI_API_KEY=sk-...
LANGGRAPH_DB_URL=postgresql://user:pass@host/db
# or
REDIS_URL=redis://host:6379

# NestJS
PYTHON_AI_SERVICE_URL=http://localhost:8000
```

### System Requirements
- **Python Service**: 
  - CPU: 2 cores minimum
  - RAM: 2GB minimum (4GB recommended)
  - Storage: 10GB for checkpoints
- **LangGraph State Store**:
  - PostgreSQL 14+ or Redis 6+
  - 1GB storage for ~10k conversations

---

## ❓ FAQ

**Q: Why use LangGraph instead of keeping Python stateless?**
A: LangGraph provides superior context management, memory compression, conversation checkpointing, and complex flow handling that stateless approaches cannot match.

**Q: Can I start with simple stateless and migrate to LangGraph later?**
A: Yes! See the "Alternative: Simpler FastAPI Implementation (Without LangGraph)" section above for a stateless starting point.

**Q: How do I handle conversation history growth?**
A: LangGraph automatically manages this through the `compress_memory_node` which summarizes old messages and keeps only recent ones.

**Q: What if Python service goes down?**
A: Conversations are checkpointed, so when service restarts, it can resume from the last checkpoint. NestJS can also implement retry logic with exponential backoff.

**Q: Can I use a different LLM (not OpenAI)?**
A: Yes! LangGraph works with any LangChain-compatible LLM (Anthropic Claude, Azure OpenAI, local models, etc.). Just swap the `ChatOpenAI` class.

**Q: How does state sync work if both systems have state?**
A: **NestJS owns business truth** (what user answered, where they are). **LangGraph owns conversation truth** (optimized chat memory). After each interaction, both update their respective stores.

---

**Questions? Issues?**

This specification provides everything needed to build a production-ready Python FastAPI + LangGraph service with hybrid state management. The key insight: **Use the right tool for the right job** - NestJS for business logic, LangGraph for conversation intelligence!
