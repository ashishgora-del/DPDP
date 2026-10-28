# Python AI Service — Fix Brief

> **Endpoint:** `POST /api/conversation/interact`

The NestJS backend currently **rejects your responses** and falls back to its own logic if your message matches any of these patterns:

```
/ready to continue|what would you like|how can I help|please provide information about/i
```

You need to handle **2 new `requestType` values** correctly, and fix **1 existing one**. Everything else can stay as-is.

---

## 1. `requestType: "grouped_question"`

**When it arrives:** NestJS wants a conversational question that covers 1–3 fields at once.

### Request shape

```json
{
  "conversationId": "uuid",
  "action": "section_transition",
  "requestType": "grouped_question",
  "syncData": {
    "currentSection": {
      "sectionId": "vendor_basic_info",
      "sectionNumber": 2,
      "title": "Vendor Basic Information",
      "description": "Legal and contact details of the vendor",
      "completedFields": ["already_answered_field"]
    },
    "remainingFields": [
      {
        "fieldId": "vendor_name",
        "label": "Vendor Name",
        "type": "text",
        "required": true,
        "aiQuestion": "What is the legal name of the vendor?"
      },
      {
        "fieldId": "registered_address",
        "label": "Registered Address",
        "type": "text",
        "required": true,
        "aiQuestion": "What is their registered business address?"
      },
      {
        "fieldId": "country",
        "label": "Country",
        "type": "text",
        "required": true,
        "aiQuestion": "Which country do they primarily operate in?"
      }
    ],
    "sectionAnswers": { "already_answered_field": "some value" },
    "completedSections": ["assessment_overview"],
    "context": {
      "orgName": "Acme Corp",
      "assessmentTier": "HIGH"
    }
  }
}
```

### Required response

```json
{
  "success": true,
  "message": "Let's gather the vendor's basic details. What's their legal name, registered address, and which country do they operate in?",
  "targetFieldIds": ["vendor_name", "registered_address", "country"]
}
```

### Rules

- `message` must be a **natural, friendly question** — not a list of field labels
- `targetFieldIds` must be a **subset** of `syncData.remainingFields[*].fieldId` — only the fields your question is actually asking about (you decide how many to bundle, max 3)
- Use the `aiQuestion` values from `remainingFields` to understand the intent of each field
- Use `context.orgName` and `currentSection.description` to make it contextual
- **Do NOT return** generic phrases like "I'm ready to continue" or "What would you like to do?" — NestJS will discard the response and use its own fallback

---

## 2. `requestType: "extract_values"`

**When it arrives:** The user sent a free-text reply. NestJS wants you to parse field values out of it.

### Request shape

```json
{
  "conversationId": "uuid",
  "action": "extract_request",
  "requestType": "extract_values",
  "userMessage": {
    "content": "legal name is Acme Corp, address is 123 Park Ave, country India, website acme.com",
    "sectionId": "vendor_basic_info"
  },
  "syncData": {
    "currentSection": {
      "sectionId": "vendor_basic_info",
      "title": "Vendor Basic Information"
    },
    "remainingFields": [
      { "fieldId": "vendor_name",         "label": "Vendor Name",         "type": "text" },
      { "fieldId": "registered_address",  "label": "Registered Address",  "type": "text" },
      { "fieldId": "country",             "label": "Country",             "type": "text" },
      { "fieldId": "website",             "label": "Website",             "type": "url"  }
    ],
    "sectionAnswers": {}
  }
}
```

### Required response

```json
{
  "success": true,
  "message": "Got it!",
  "fieldValues": {
    "vendor_name": "Acme Corp",
    "registered_address": "123 Park Ave",
    "country": "India",
    "website": "acme.com"
  }
}
```

### Rules

- `fieldValues` keys must match `fieldId` values from `syncData.remainingFields`
- If you **cannot extract** a field's value from the message, **omit it** from `fieldValues` entirely (do not include `null` or `""`) — NestJS will ask for it again in the next turn
- If the user says "skip" or "that's all", omit all optional fields from `fieldValues`
- For `select` / `radio` fields, map the user's natural-language answer to one of the valid `options` values listed in `remainingFields`
- For date fields, normalize to `YYYY-MM-DD` where possible; otherwise pass the raw string

---

## 3. `requestType: "transition"` — fix the existing response

You are currently returning:

```
"I'm ready to continue. What would you like to do?"
```

NestJS now detects and discards this. Return a contextual transition instead:

```json
{
  "success": true,
  "message": "Great work completing **Assessment Overview**! Now let's move to **Section 2: Vendor Basic Information** — this covers legal and contact details of the vendor."
}
```

`syncData.currentSection.title` and `syncData.nextSection.title` / `syncData.nextSection.description` are always included in the payload — use them.

If `syncData.nextSection` is **absent** (null), all sections are complete — return a completion message:

```json
{
  "success": true,
  "message": "Excellent work! You've completed all sections of the Vendor Risk Assessment Framework. Your document is ready. 🎉"
}
```

---

## Summary

| `requestType`      | Key input                                              | Must return                     | Common mistake to avoid                          |
|--------------------|--------------------------------------------------------|---------------------------------|--------------------------------------------------|
| `grouped_question` | `syncData.remainingFields`                             | `message` + `targetFieldIds`    | Generic "please provide info about X, Y"         |
| `extract_values`   | `userMessage.content` + `syncData.remainingFields`     | `fieldValues` map               | Including `""` or `null` for unextracted fields  |
| `transition`       | `syncData.currentSection` + `syncData.nextSection`     | Contextual transition sentence  | Returning "I'm ready to continue"                |

---

## NestJS fallback behaviour (for reference)

If your response is rejected or the service is unreachable, NestJS falls back to:

- **`grouped_question`** → builds a bulleted list using each field's `aiQuestion` value
- **`extract_values`** → if only 1 field targeted, assigns the whole message to it; if multiple, returns empty and re-asks
- **`transition`** → generates `✅ Great work — **{section}** is complete! Next up: **Section N: {title}** — {description}.`

These are safety nets only — your contextual responses will always be preferred.
