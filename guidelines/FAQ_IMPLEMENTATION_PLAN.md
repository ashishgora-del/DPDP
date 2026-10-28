# FAQ Section Implementation Plan

## Overview
Implement a comprehensive FAQ (Frequently Asked Questions) section for the Risk Assessment module based on the original Risk-assesment project.

## Current State Analysis

### Source File
- **Location**: `Risk-assesment\src\app\faq\page.tsx`
- **Type**: Next.js page component
- **Features**:
  - 26 FAQ items across 10 categories
  - Collapsible accordion UI
  - Category filtering dropdown
  - Responsive design
  - CTA section linking back to assessment

### FAQ Structure
**10 Categories:**
1. General DPDPA (3 questions)
2. Risk Assessment (3 questions)
3. Significant Data Fiduciary (3 questions)
4. Consent (3 questions)
5. Children Data (2 questions)
6. Data Security (2 questions)
7. Cross-Border Transfer (1 question)
8. Data Rights (2 questions)
9. Implementation (3 questions)

**Total**: 26 questions with detailed answers

## Implementation Plan

### Step 1: Create FAQ Page Component
**File**: `src/modules/risk-assessment/pages/FAQPage.tsx`

**Requirements**:
- Port all 26 FAQ items with categories
- Convert from Next.js to React Router
- Replace `Link` from `next/link` with react-router-dom
- Match project theme colors (blue gradients, vibrant UI)
- Use smaller font sizes (text-sm, text-base, text-lg)
- Implement accordion with ChevronUp/ChevronDown icons

**Key Features**:
- Category filter dropdown (10 categories + "All Categories")
- Collapsible accordion for Q&A
- Show question count
- CTA section: "Still Have Questions?" → Link to `/risk-assessment/start`
- Legal disclaimer box (amber background)
- Footer

### Step 2: Update Routing
**File**: `src/app/App.tsx`

**Changes**:
- Add route: `/risk-assessment/faq` → FAQPage component

### Step 3: Add Navigation Links
**Update locations**:
1. **IntroPage** (`src/modules/risk-assessment/pages/IntroPage.tsx`)
   - Add "FAQ" link in header navigation
   
2. **AssessmentPage** (optional - if we want FAQ access during assessment)
   - Could add help link to FAQ

3. **ResultsPage** (optional - could add FAQ link in footer/help)

### Step 4: Styling Adaptations
**Color Theme Adjustments**:
- Header: White background with border-gray-200
- Hero: `bg-gradient-to-r from-blue-600 to-blue-700` (match project theme)
- Buttons: Blue gradient buttons matching project style
- Category badge: text-blue-600
- Accordion hover: hover:bg-blue-50
- Font sizes: Reduce to match project (text-lg for questions, text-sm for category labels)

## Data Structure

```typescript
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const categories = [
  'All Categories',
  'General DPDPA',
  'Risk Assessment',
  'Significant Data Fiduciary',
  'Consent',
  'Children Data',
  'Data Security',
  'Cross-Border Transfer',
  'Data Rights',
  'Implementation',
];
```

## UI Components Breakdown

1. **Header**
   - Logo with gradient background
   - Navigation: Home | Resources | FAQ (current)
   - Back to Home button

2. **Hero Section**
   - Blue gradient background
   - Title: "Frequently Asked Questions"
   - Subtitle explaining purpose

3. **Category Filter**
   - White card with dropdown
   - Shows count of filtered questions

4. **FAQ Accordion**
   - Each item: White card with shadow
   - Question: text-lg font-semibold
   - Category badge: text-xs text-blue-600
   - Expand/collapse icons
   - Answer: Gray background when expanded

5. **CTA Section**
   - Blue gradient card
   - "Still Have Questions?"
   - Button: "Start Assessment" → `/risk-assessment/start`

6. **Disclaimer Box**
   - Amber background (amber-50)
   - Border (amber-200)
   - Legal notice text

7. **Footer**
   - Dark gray background
   - Copyright notice

## Verification Checklist

Before Implementation:
- ✓ All 26 FAQ items identified
- ✓ 10 categories mapped
- ✓ UI structure understood
- ✓ Color theme adjustments planned
- ✓ Routing strategy defined
- ✓ Navigation integration planned

After Implementation:
- [ ] FAQ page accessible at `/risk-assessment/faq`
- [ ] All 26 questions display correctly
- [ ] Category filtering works
- [ ] Accordion expand/collapse works
- [ ] CTA button navigates to assessment
- [ ] Matches project color theme
- [ ] Responsive on mobile
- [ ] Font sizes consistent with project
- [ ] Navigation links work from other pages

## Dependencies
- react-router-dom (already installed)
- lucide-react icons: Shield, ChevronDown, ChevronUp
- framer-motion (optional for animations)

## Notes
- Keep all FAQ content identical to original
- Ensure legal disclaimer is prominently displayed
- Make sure filtering resets accordion state
- Use project's gradient color scheme
- Maintain smaller font sizes for compactness
