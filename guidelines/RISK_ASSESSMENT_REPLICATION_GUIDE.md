# Risk Assessment Replication Guide

**Goal**: Replicate all Risk Assessment features into the main project while maintaining the Color Theme Guidelines

**Status**: Complete Mapping Document  
**Date**: February 14, 2026

---

## 📋 Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Color Theme Mapping](#color-theme-mapping)
3. [Feature Breakdown](#feature-breakdown)
4. [Implementation Checklist](#implementation-checklist)
5. [File Structure to Create](#file-structure-to-create)
6. [Data Models & Types](#data-models--types)
7. [Component Implementation Guide](#component-implementation-guide)
8. [API Endpoints to Create](#api-endpoints-to-create)
9. [Database Schema](#database-schema)
10. [Risk Calculation Algorithm](#risk-calculation-algorithm)

---

## Overview & Architecture

### Current State
- **Main Project**: Vite + React with Tailwind CSS
- **Risk Assessment Project**: Next.js 16 with SQLite + Prisma
- **Goal**: Integrate Risk Assessment into main project using Vite

### Key Difference
- Main project: Client-side React app (Vite)
- Risk Assessment: Full-stack Next.js app (Node.js backend + SQLite)

### Integration Strategy
We need to:
1. Convert Next.js components to React components
2. Replace server-side logic with client-side (localStorage or lightweight backend)
3. Adapt styling to follow our Color Theme Guidelines
4. Maintain all business logic (risk calculation, data models)

---

## Color Theme Mapping

### Risk Assessment Current Colors → Our Theme System

#### Risk Tier Color Mapping
| Risk Tier | Current Color | Our Theme Color | CSS Variable |
|-----------|---------------|-----------------|--------------|
| BASIC | Green (#10b981) | Primary (#030213) with lighter accent | `--primary` |
| MODERATE | Amber (#f59e0b) | Secondary (`oklch(0.95 0.0058 264.53)`) | `--secondary` |
| HIGH | Red (#ef4444) | Destructive (#d4183d) | `--destructive` |

#### Component Color Mapping
| Element | Current | Our System | CSS Variable |
|---------|---------|-----------|--------------|
| Buttons | Blue (#3b82f6) | Primary (#030213) | `--primary` |
| Borders | Gray (#e5e7eb) | Border (`rgba(0,0,0,0.1)`) | `--border` |
| Background | White (#ffffff) | Background (#ffffff) | `--background` |
| Text | Gray (#111827) | Foreground (`oklch(0.145 0 0)`) | `--foreground` |
| Card Background | White | Card (#ffffff) | `--card` |
| Hover State | Gray-50 | Accent (#e9ebef) | `--accent` |
| Input Background | Gray-50 | Input BG (#f3f3f5) | `--input-background` |

#### Icon Implementation
- Replace hardcoded colors with CSS variables
- Use Lucide React icons (already available)
- Apply hover states using `--accent` color

**Implementation Reference**: See [guidelines/COLOR_THEME_GUIDELINES.md](../guidelines/COLOR_THEME_GUIDELINES.md)

---

## Feature Breakdown

### Feature 1: Landing Page

**Source File**: `Risk-assesment/src/app/page.tsx`

**What to Replicate**:
1. Hero section with main headline
2. Risk tier cards (3 cards: BASIC, MODERATE, HIGH)
3. Features showcase (4 features with icons)
4. Call-to-action buttons

**Modifications for Main Project**:
- Use your existing `src/app/App.tsx` as base (already has hero + features)
- Enhance it to include full landing page experience
- Apply theme colors from `COLOR_THEME_GUIDELINES.md`
- Keep motion animations from Framer Motion

**Files to Create**:
- None (use existing App.tsx, enhance it)

**Reference Components**:
- Risk Tier Cards → Use `ModuleCard.tsx` pattern (already exists)
- Features Section → Enhance existing features display
- CTAs → Apply primary color styling

---

### Feature 2: Risk Assessment Questionnaire

**Source File**: `Risk-assesment/src/app/assessment/page.tsx`

**What to Replicate**:
1. 6-step multi-step questionnaire
2. 10 questions across all steps
3. Progress bar tracking
4. Form validation
5. Auto-save to localStorage
6. Organization name/email input
7. Navigation (Previous/Next/Submit)

**Questions Breakdown** (All 10 Questions):

```
STEP 1: Organization Profile
├── Q1: Organization Profile (radio)
│   Options: Startup/Tech, E-commerce, Fintech, Healthcare, EdTech, SaaS, Other
└── Q2: Geographic Presence (radio)
    Options: Single city, Single state, Multiple states, Pan-India, International

STEP 2: Data Principals
├── Q3: Data Principals (checkbox - multiple select)
│   Options: Customers, Employees, Vendors, Children, Others
└── Q4: Large Scale Processing (radio)
    Options: Yes, No, Unsure

STEP 3: Nature of Data
└── Q5: Data Types (checkbox - multiple select)
    Options: Basic, Demographic, Financial, Health, Biometric, Genetic, Religious, Caste, Behavioral

STEP 4: Purpose & Automation
├── Q6: Processing Purposes (checkbox - multiple select)
│   Options: Service delivery, Customer support, Marketing, Analytics, Profiling, Automated decision, Research
└── Q7: AI/ML Usage (radio)
    Options: Yes extensively, Yes limited, No

STEP 5: Data Sharing
├── Q8: Vendors (radio)
│   Options: No, 1-5 vendors, 6+ vendors
└── Q9: Cross-border Transfer (radio)
    Options: Yes, No

STEP 6: Scale & Volume
└── Q10: Data Volume (radio)
    Options: <10K, 10K-100K, 100K-1M, >1M
```

**Files to Create**:
```
src/
├── assessment/
│   ├── AssessmentPage.tsx          # Main assessment page
│   ├── AssessmentStep.tsx          # Step component
│   ├── QuestionInput.tsx           # Question input wrapper
│   ├── ProgressBar.tsx             # Progress tracking
│   └── NavigationButtons.tsx        # Prev/Next/Submit buttons
├── lib/
│   ├── questionnaire-config.ts     # 10 questions configuration
│   ├── risk-calculator.ts          # Risk scoring algorithm
│   └── storage.ts                  # localStorage utilities
└── types/
    └── assessment.ts               # TypeScript types
```

**Key Implementations**:

**1. Question Configuration** (`src/lib/questionnaire-config.ts`)
```typescript
export const QUESTIONNAIRE_STEPS = [
  {
    step: 1,
    title: "Organization Profile",
    subtitle: "Tell us about your organization",
    questions: [
      {
        id: "q1_orgProfile",
        text: "What best describes your organization?",
        type: "radio",
        options: [...]
      },
      // ... more questions
    ]
  },
  // ... 5 more steps
]
```

**2. Assessment Component** (`src/assessment/AssessmentPage.tsx`)
```tsx
- State: currentStep, answers, orgName, email
- Effects: Load/save from localStorage
- Handlers: handleAnswerChange, handleNext, handlePrevious, handleSubmit
- Validation: canProceed() checks all required fields
- Style: Use --primary, --foreground from theme
```

**3. Risk Calculator** (`src/lib/risk-calculator.ts`)
```typescript
calculateRiskTier(answers) → {
  riskTier: "BASIC" | "MODERATE" | "HIGH",
  focusAreas: string[],
  sdfFlag: boolean,
  riskDrivers: string[]
}
```

---

### Feature 3: Results Page

**Source File**: `Risk-assesment/src/app/results/[id]/page.tsx`

**What to Replicate**:
1. Risk tier badge (with color coding)
2. SDF flag indicator
3. Risk drivers list
4. Focus areas grid (6-8 areas)
5. Template recommendations
6. Next steps checklist
7. Export to PDF button
8. Share buttons

**Files to Create**:
```
src/
├── results/
│   ├── ResultsPage.tsx             # Main results page
│   ├── RiskTierBadge.tsx           # Risk tier display (BASIC/MODERATE/HIGH)
│   ├── SDFFlagIndicator.tsx        # SDF flag display
│   ├── FocusAreasGrid.tsx          # Focus areas showcase
│   ├── RiskDriversList.tsx         # Key risk factors
│   ├── TemplateRecommendations.tsx # Template suggestions
│   ├── NextStepsChecklist.tsx      # Action items
│   └── ExportButton.tsx            # PDF export
└── types/
    └── results.ts                  # Results types
```

**Color Mapping for Results**:
- BASIC Risk Tier → Use `--primary` with green accent tone
- MODERATE Risk Tier → Use `--secondary` (light purple)
- HIGH Risk Tier → Use `--destructive` (red)
- SDF Flag → Purple accent or special icon treatment

---

### Feature 4: Resources/Templates Library

**Source File**: `Risk-assesment/src/app/resources/page.tsx`

**What to Replicate**:
1. 15+ templates catalog
2. Category filters (13 categories)
3. Risk tier filters
4. Search functionality
5. Template cards with download
6. DPDPA sections reference

**Template Categories** (13):
1. Consent Management
2. Grievance Redressal
3. Data Retention
4. Privacy Policy
5. Cookies Policy
6. Data Processing Agreement
7. Notice Templates
8. Subject Rights Requests
9. Breach Notification
10. Data Protection Impact Assessment
11. Employee Privacy Policy
12. Children Data Protection
13. Consent Withdrawal Forms

**Files to Create**:
```
src/
├── resources/
│   ├── ResourcesPage.tsx           # Main resources page
│   ├── TemplateCard.tsx            # Template display card
│   ├── TemplateFilters.tsx         # Category/risk tier filters
│   ├── TemplateGrid.tsx            # Templates grid layout
│   └── SearchBar.tsx               # Search functionality
├── lib/
│   └── templates-data.ts           # Template database
└── types/
    └── templates.ts                # Template types
```

---

### Feature 5: FAQ Section

**Source File**: `Risk-assesment/src/app/faq/page.tsx`

**What to Replicate**:
1. Accordion FAQ sections
2. Search functionality
3. Category grouping
4. Clear formatting

**Files to Create**:
```
src/
├── faq/
│   ├── FAQPage.tsx                 # Main FAQ page
│   ├── FAQAccordion.tsx            # Accordion component
│   └── FAQSearch.tsx               # Search functionality
├── lib/
│   └── faq-data.ts                 # FAQ content
└── types/
    └── faq.ts                      # FAQ types
```

---

## Implementation Checklist

### Phase 1: Setup & Types
- [ ] Create `src/types/assessment.ts` with all TypeScript interfaces
- [ ] Create `src/types/results.ts` with result types
- [ ] Create `src/types/templates.ts` with template types
- [ ] Create `src/types/index.ts` to export all types

### Phase 2: Configuration & Utilities
- [ ] Create `src/lib/questionnaire-config.ts` with all 10 questions
- [ ] Create `src/lib/risk-calculator.ts` with scoring algorithm
- [ ] Create `src/lib/storage.ts` for localStorage management
- [ ] Create `src/lib/templates-data.ts` with 15+ templates
- [ ] Create `src/lib/faq-data.ts` with FAQ content

### Phase 3: Assessment Feature
- [ ] Create `src/assessment/AssessmentPage.tsx`
- [ ] Create `src/assessment/AssessmentStep.tsx`
- [ ] Create `src/assessment/QuestionInput.tsx`
- [ ] Create `src/assessment/ProgressBar.tsx`
- [ ] Create `src/assessment/NavigationButtons.tsx`
- [ ] Add routes and navigation to App.tsx

### Phase 4: Results Feature
- [ ] Create `src/results/ResultsPage.tsx`
- [ ] Create `src/results/RiskTierBadge.tsx`
- [ ] Create `src/results/FocusAreasGrid.tsx`
- [ ] Create `src/results/RiskDriversList.tsx`
- [ ] Create `src/results/TemplateRecommendations.tsx`
- [ ] Create `src/results/ExportButton.tsx`

### Phase 5: Resources Feature
- [ ] Create `src/resources/ResourcesPage.tsx`
- [ ] Create `src/resources/TemplateCard.tsx`
- [ ] Create `src/resources/TemplateFilters.tsx`
- [ ] Create `src/resources/TemplateGrid.tsx`
- [ ] Create `src/resources/SearchBar.tsx`

### Phase 6: FAQ Feature
- [ ] Create `src/faq/FAQPage.tsx`
- [ ] Create `src/faq/FAQAccordion.tsx`
- [ ] Add FAQ route to navigation

### Phase 7: Styling & Theme
- [ ] Apply theme colors from `COLOR_THEME_GUIDELINES.md`
- [ ] Update all components to use CSS variables
- [ ] Implement dark mode support (if needed)
- [ ] Test color contrast compliance

### Phase 8: Integration & Testing
- [ ] Update `src/app/App.tsx` routing
- [ ] Add navigation between all pages
- [ ] Test assessment workflow
- [ ] Test results calculation
- [ ] Test localStorage persistence
- [ ] Test responsive design (mobile/tablet/desktop)

---

## File Structure to Create

```
src/
├── app/
│   ├── App.tsx                     # (MODIFY) Add new routes
│   └── components/
│       └── (existing components)
│
├── assessment/
│   ├── AssessmentPage.tsx          # Main assessment container
│   ├── AssessmentStep.tsx          # Step renderer
│   ├── QuestionInput.tsx           # Radio/Checkbox/Select input
│   ├── ProgressBar.tsx             # Progress tracker
│   └── NavigationButtons.tsx        # Navigation controls
│
├── results/
│   ├── ResultsPage.tsx             # Main results container
│   ├── RiskTierBadge.tsx           # Risk tier badge
│   ├── SDFFlagIndicator.tsx        # SDF indicator
│   ├── FocusAreasGrid.tsx          # Focus areas showcase
│   ├── RiskDriversList.tsx         # Risk factors list
│   ├── TemplateRecommendations.tsx # Template suggestions
│   ├── NextStepsChecklist.tsx      # Action checklist
│   └── ExportButton.tsx            # PDF export
│
├── resources/
│   ├── ResourcesPage.tsx           # Templates library
│   ├── TemplateCard.tsx            # Template card
│   ├── TemplateFilters.tsx         # Filter controls
│   ├── TemplateGrid.tsx            # Grid layout
│   ├── SearchBar.tsx               # Search box
│   └── CategoryBadges.tsx          # Category badges
│
├── faq/
│   ├── FAQPage.tsx                 # Main FAQ page
│   ├── FAQAccordion.tsx            # Accordion component
│   ├── FAQSection.tsx              # FAQ section
│   └── FAQSearch.tsx               # Search functionality
│
├── lib/
│   ├── questionnaire-config.ts     # 10 questions definition
│   ├── risk-calculator.ts          # Risk scoring algorithm
│   ├── storage.ts                  # localStorage utilities
│   ├── templates-data.ts           # Template database
│   ├── faq-data.ts                 # FAQ content
│   └── pdf-export.ts               # PDF generation utilities
│
└── types/
    ├── assessment.ts               # Assessment types
    ├── results.ts                  # Results types
    ├── templates.ts                # Template types
    ├── faq.ts                      # FAQ types
    └── index.ts                    # Export all types
```

---

## Data Models & Types

### TypeScript Types to Create

**File**: `src/types/assessment.ts`

```typescript
// Risk Tiers
export type RiskTier = 'BASIC' | 'MODERATE' | 'HIGH';

// Question Response
export interface QuestionnaireAnswers {
  q1_orgProfile: string;
  q2_geography: string;
  q3_dataPrincipals: string;
  q4_largeScale: string;
  q5_dataTypes: string;
  q6_purposes: string;
  q7_aiUse: string;
  q8_vendors: string;
  q9_crossBorder: string;
  q10_volume: string;
}

// User Information
export interface User {
  orgName: string;
  email?: string;
}

// Assessment Result
export interface Assessment extends QuestionnaireAnswers {
  id: string;
  userId?: string;
  riskTier: RiskTier;
  focusAreas: string[];
  sdfFlag: boolean;
  riskDrivers: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Risk Calculation Result
export interface RiskCalculationResult {
  riskTier: RiskTier;
  focusAreas: string[];
  sdfFlag: boolean;
  riskDrivers: string[];
}

// Question Configuration
export interface QuestionOption {
  value: string;
  label: string;
  riskWeight?: number;
}

export interface Question {
  id: string;
  text: string;
  helpText?: string;
  options: QuestionOption[];
  type: 'radio' | 'checkbox' | 'select';
}

export interface QuestionnaireStep {
  step: number;
  title: string;
  subtitle: string;
  questions: Question[];
}
```

---

## Component Implementation Guide

### 1. AssessmentPage Component

**Source Reference**: [Risk-assesment/src/app/assessment/page.tsx](../Risk-assesment/src/app/assessment/page.tsx)

**Key Implementation Details**:
```tsx
// File: src/assessment/AssessmentPage.tsx

export default function AssessmentPage() {
  // State Management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [orgName, setOrgName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Lifecycle: Load saved data
  useEffect(() => {
    const saved = loadFromStorage('assessment');
    if (saved) {
      setAnswers(saved.answers);
      setOrgName(saved.orgName);
      setEmail(saved.email);
      setCurrentStep(saved.currentStep);
    }
  }, []);
  
  // Lifecycle: Save on changes
  useEffect(() => {
    saveToStorage('assessment', { answers, orgName, email, currentStep });
  }, [answers, orgName, email, currentStep]);
  
  // Methods
  const handleAnswerChange = (questionId: string, value: string) => { ... }
  const handleCheckboxChange = (questionId: string, value: string) => { ... }
  const canProceed = (): boolean => { ... }
  const handleNext = () => { ... }
  const handlePrevious = () => { ... }
  const handleSubmit = async () => { 
    // Calculate risk tier
    const result = calculateRiskTier(answers);
    // Save assessment to storage/state
    // Navigate to results page
  }
  
  // Render
  return (
    <div className="min-h-screen bg-background">
      <ProgressBar current={currentStep} total={6} />
      <AssessmentStep step={currentStepData} />
      <NavigationButtons 
        canProceed={canProceed()}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Styling Notes**:
- Use `bg-background` (CSS variable)
- Use `text-foreground` for text
- Use `bg-primary` for submit button
- Use `border-border` for input borders
- Use `--input-background` for input fields

---

### 2. RiskCalculator

**Source Reference**: [Risk-assesment/src/lib/risk-calculator.ts](../Risk-assesment/src/lib/risk-calculator.ts)

**Algorithm**:
```typescript
export function calculateRiskTier(answers: QuestionnaireAnswers): RiskCalculationResult {
  let riskScore = 0;
  const focusAreas: string[] = [];
  const riskDrivers: string[] = [];
  let sdfFlag = false;

  // Q1: Sector Risk
  // - Fintech/Healthcare/EdTech: +2
  // - E-commerce/SaaS: +1
  
  // Q2: Geography Risk
  // - Multi-state/Pan-India: +1
  
  // Q3: Data Principals
  // - Children: +3 (focus: Parental Consent)
  // - Others: track for focus areas
  
  // Q4: Large Scale: +2, set SDF flag
  
  // Q5: Sensitive Data: +3 (focus: Sensitive Data Protection)
  
  // Q6: Purposes
  // - Profiling/Automated: +2 (focus: Automated Decision-Making)
  
  // Q7: AI/ML: +2 (focus: AI Governance)
  
  // Q8: Vendors: Multiple = +1 (focus: DPAs)
  
  // Q9: Cross-border: +2 (focus: Cross-Border Compliance)
  
  // Q10: Volume
  // - >1M: +2, set SDF flag
  // - 100K-1M: +1
  
  // Risk Tier Mapping
  const riskTier = riskScore <= 5 ? 'BASIC' : riskScore <= 10 ? 'MODERATE' : 'HIGH';
  
  return { riskTier, focusAreas, sdfFlag, riskDrivers };
}
```

---

### 3. ResultsPage Component

**Key Sections**:
```tsx
<div className="results-container">
  {/* Risk Tier Badge */}
  <RiskTierBadge 
    tier={assessment.riskTier}
    colors={{
      BASIC: 'bg-green-100 text-green-800',
      MODERATE: 'bg-amber-100 text-amber-800',
      HIGH: 'bg-red-100 text-red-800'
    }}
  />
  
  {/* SDF Indicator */}
  {assessment.sdfFlag && <SDFFlagIndicator />}
  
  {/* Risk Drivers */}
  <RiskDriversList drivers={assessment.riskDrivers} />
  
  {/* Focus Areas */}
  <FocusAreasGrid areas={assessment.focusAreas} />
  
  {/* Template Recommendations */}
  <TemplateRecommendations 
    riskTier={assessment.riskTier}
    focusAreas={assessment.focusAreas}
  />
  
  {/* Action Buttons */}
  <button onClick={exportToPDF}>Export to PDF</button>
  <button onClick={buildComplianceKit}>Build Compliance Kit</button>
</div>
```

---

## API Endpoints to Create

### Assessment API (Client-side storage)

Since this is a Vite app (client-side only), we'll use localStorage:

```typescript
// src/lib/storage.ts

export function saveAssessment(assessment: Assessment) {
  localStorage.setItem('dpdpa_assessment', JSON.stringify(assessment));
}

export function getAssessment(id: string) {
  const data = localStorage.getItem('dpdpa_assessment');
  return data ? JSON.parse(data) : null;
}

export function getAllAssessments() {
  return JSON.parse(localStorage.getItem('dpdpa_assessments') || '[]');
}

export function deleteAssessment(id: string) {
  // Remove from assessments list
}
```

### Optional: Add Backend (Node.js/Express)

If backend is needed later:
```
POST /api/assessment/submit
GET /api/assessment/:id
GET /api/assessments
DELETE /api/assessment/:id
POST /api/assessment/export
GET /api/templates?riskTier=BASIC
```

---

## Database Schema

### For Client-Side Storage (localStorage + IndexedDB)

```typescript
// Assessment Schema
{
  id: string (UUID),
  userId: string (optional),
  q1_orgProfile: string,
  q2_geography: string,
  q3_dataPrincipals: string,
  q4_largeScale: string,
  q5_dataTypes: string,
  q6_purposes: string,
  q7_aiUse: string,
  q8_vendors: string,
  q9_crossBorder: string,
  q10_volume: string,
  riskTier: 'BASIC' | 'MODERATE' | 'HIGH',
  focusAreas: string[],
  sdfFlag: boolean,
  riskDrivers: string[],
  user: {
    orgName: string,
    email?: string
  },
  createdAt: ISO 8601 date string,
  updatedAt: ISO 8601 date string
}

// Template Schema
{
  id: string (UUID),
  name: string,
  description: string,
  category: string,
  riskTier: 'BASIC' | 'MODERATE' | 'HIGH' | 'ALL',
  focusArea: string,
  content: string (markdown/html),
  downloadUrl: string,
  version: string,
  createdAt: date,
  updatedAt: date
}
```

---

## Risk Calculation Algorithm

**Location to Reference**: [Risk-assesment/src/lib/risk-calculator.ts](../Risk-assesment/src/lib/risk-calculator.ts)

### Complete Scoring Breakdown

```
RISK SCORE CALCULATION:

Question 1 - Organization Profile:
  - Fintech, Healthcare, EdTech → +2 points
  - E-commerce, SaaS → +1 point
  - Other → 0 points

Question 2 - Geographic Presence:
  - Multi-states or Pan-India → +1 point
  - International → +2 points
  - Single location → 0 points

Question 3 - Data Principals:
  - Children → +3 points (Focus: Parental Consent)
  - Customers → +1 point (Focus: Consent Management)
  - Employees → 0 points (Focus: Employee Data Governance)

Question 4 - Large Scale Processing:
  - Yes → +2 points, SDF Flag = true
  - No → 0 points

Question 5 - Data Types (Sensitive):
  - Sensitive (health, financial, biometric, genetic, religious, caste) → +3 points
    (Focus: Sensitive Data Protection)
  - Children → +2 points
  - Other data → 0 points

Question 6 - Processing Purposes:
  - Profiling/Automated decision-making → +2 points
    (Focus: Automated Decision-Making Transparency)
  - Marketing → 0 points (Focus: Marketing Consent)
  - Other purposes → 0 points

Question 7 - AI/ML Usage:
  - Yes (extensively or limited) → +2 points
    (Focus: AI Governance & Algorithmic Transparency)
  - No → 0 points

Question 8 - Vendors/Data Sharing:
  - Multiple vendors (6+) → +1 point (Focus: DPAs)
  - Few vendors (1-5) → 0 points
  - No sharing → 0 points

Question 9 - Cross-border Transfer:
  - Yes → +2 points (Focus: Cross-Border Transfer Compliance)
  - No → 0 points

Question 10 - Data Volume:
  - >1 million → +2 points, SDF Flag = true
  - 100K-1M → +1 point
  - <100K → 0 points

─────────────────────────────────────────

FINAL RISK TIER MAPPING:
  Score 0-5    → BASIC (Green)
  Score 6-10   → MODERATE (Amber)
  Score 11+    → HIGH (Red)

SDF FLAG SET IF:
  - Question 4 = Yes (Large Scale Processing), OR
  - Question 10 = >1 million records
```

---

## Focus Areas Definition

Based on questionnaire responses, the following focus areas should be populated:

```
Focus Areas:
1. Consent Management (Q3: Customers)
2. Multi-jurisdictional Compliance (Q2: Multi-state/Pan-India)
3. Employee Data Governance (Q3: Employees)
4. Sensitive Data Protection (Q5: Sensitive data)
5. Parental Consent & Children Safeguards (Q3: Children OR Q5: Children)
6. Automated Decision-Making Transparency (Q6: Profiling/Automated decisions)
7. Marketing Consent (Q6: Marketing)
8. Data Processing Agreements (Q8: Multiple vendors)
9. Cross-Border Transfer Compliance (Q9: Cross-border = Yes)
10. AI Governance & Algorithmic Transparency (Q7: AI/ML = Yes)
11. SDF Compliance & DPIA (Q4: Large scale = Yes OR Q10: >1M)
```

---

## Integration Points

### 1. Update Main App Router

**File**: `src/app/App.tsx`

Add routes for:
- `/` - Landing page (existing + enhance)
- `/assessment` - Risk assessment questionnaire
- `/results/:id` - Assessment results
- `/resources` - Templates library
- `/faq` - FAQ section

```tsx
// Add routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AssessmentPage from './assessment/AssessmentPage';
import ResultsPage from './results/ResultsPage';
import ResourcesPage from './resources/ResourcesPage';
import FAQPage from './faq/FAQPage';

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/assessment" element={<AssessmentPage />} />
  <Route path="/results/:id" element={<ResultsPage />} />
  <Route path="/resources" element={<ResourcesPage />} />
  <Route path="/faq" element={<FAQPage />} />
</Routes>
```

### 2. Navigation Updates

Add menu items:
- Assessment
- Resources
- FAQ
- Results (after completing assessment)

---

## Implementation Priority

### HIGH PRIORITY (Must Have)
1. ✅ Color Theme Guidelines (DONE)
2. ✅ Detailed Analysis Doc (DONE)
3. Risk Assessment Questionnaire (10 questions, 6 steps)
4. Risk Calculation Algorithm
5. Results Display

### MEDIUM PRIORITY (Should Have)
1. Resources/Templates Library
2. PDF Export
3. localStorage persistence
4. Navigation between pages

### LOW PRIORITY (Nice to Have)
1. FAQ section
2. Advanced analytics
3. Backend integration
4. Email export
5. User authentication

---

## File Reference Guide for Implementation

Use this as a reference during actual implementation:

| Feature | Reference File | Key Content |
|---------|-----------------|-------------|
| Questions Configuration | [Risk-assesment/src/lib/questionnaire-config.ts](../Risk-assesment/src/lib/questionnaire-config.ts) | All 10 questions, options, risk weights |
| Risk Algorithm | [Risk-assesment/src/lib/risk-calculator.ts](../Risk-assesment/src/lib/risk-calculator.ts) | Scoring logic, focus area mapping |
| Assessment Page | [Risk-assesment/src/app/assessment/page.tsx](../Risk-assesment/src/app/assessment/page.tsx) | Form state, validation, navigation |
| Results Page | [Risk-assesment/src/app/results/[id]/page.tsx](../Risk-assesment/src/app/results/[id]/page.tsx) | Result display, recommendations |
| Resources Page | [Risk-assesment/src/app/resources/page.tsx](../Risk-assesment/src/app/resources/page.tsx) | Templates library, filtering |
| FAQ Page | [Risk-assesment/src/app/faq/page.tsx](../Risk-assesment/src/app/faq/page.tsx) | FAQ structure, content |
| Type Definitions | [Risk-assesment/src/types/index.ts](../Risk-assesment/src/types/index.ts) | All TypeScript interfaces |
| Landing Page | [Risk-assesment/src/app/page.tsx](../Risk-assesment/src/app/page.tsx) | Hero, features, CTAs |
| Color Scheme | [guidelines/COLOR_THEME_GUIDELINES.md](../guidelines/COLOR_THEME_GUIDELINES.md) | Theme colors, CSS variables |

---

## Data Requirements Summary

### To Collect During Implementation

#### Template Database (15+ templates)
- [ ] Privacy Policy template
- [ ] Data Processing Agreement
- [ ] Consent Form
- [ ] Grievance Redressal Policy
- [ ] Breach Notification Template
- [ ] DPIA Template
- [ ] Employee Privacy Notice
- [ ] Cookie Policy
- [ ] Data Retention Policy
- [ ] Subject Rights Response
- [ ] Children Protection Policy
- [ ] Consent Withdrawal Form
- [ ] Marketing Consent
- [ ] Vendor Assessment Checklist
- [ ] Incident Response Plan

#### FAQ Content
- 20+ common DPDPA questions
- Organized by category
- Clear, concise answers
- Links to relevant resources

#### Focus Areas Descriptions
- 11 focus areas with descriptions
- Obligations for each
- Recommended templates per area

---

## Testing Checklist

Before considering implementation complete:

### Functional Testing
- [ ] All 10 questions load correctly
- [ ] Form validation works
- [ ] localStorage auto-save works
- [ ] Risk calculation is accurate
- [ ] Results display correctly
- [ ] Templates filter by risk tier
- [ ] Search functionality works
- [ ] PDF export works
- [ ] Navigation between pages works

### Styling Testing
- [ ] Colors follow theme guidelines
- [ ] Text contrast meets WCAG standards
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode (if applicable)
- [ ] Loading states visible
- [ ] Error messages clear

### User Experience Testing
- [ ] Questionnaire is clear and understandable
- [ ] Progress bar provides good feedback
- [ ] Results are actionable
- [ ] Next steps are clear
- [ ] Templates are easy to find
- [ ] No confusion between pages

---

## Next Steps After Implementation

1. **User Feedback**: Collect feedback on questionnaire clarity
2. **Data Validation**: Validate risk calculation with domain experts
3. **Performance**: Optimize for slow networks
4. **Accessibility**: Full accessibility audit (WCAG 2.1 AA)
5. **Analytics**: Add event tracking
6. **Backend**: Consider adding backend for data persistence
7. **Mobile App**: Consider native mobile version

---

**Document Version**: 1.0  
**Last Updated**: February 14, 2026  
**Status**: Ready for Implementation
