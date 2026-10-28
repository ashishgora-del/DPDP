# Resources Hub Implementation Plan

## Overview
The Resources Hub is a template library page that provides downloadable DPDPA-compliant templates, guides, and documentation organized by category and risk tier. Users can filter templates based on their needs and download relevant compliance materials.

## Data Structure

### Template Interface
```typescript
interface Template {
  id: string;
  name: string;
  category: string;
  riskTier: string;  // 'ALL', 'BASIC', 'MODERATE', 'HIGH'
  description: string;
  fileUrl: string;
}
```

### Templates Collection (15 Total)

#### Basic/All Tiers (5 templates)
1. **Privacy Notice Template** - Privacy Documentation
   - Standard privacy notice compliant with DPDPA Section 5
   
2. **Consent Form Template** - Consent Management
   - Basic consent collection form with granular purpose options
   
3. **Data Retention Policy** - Data Governance
   - Policy template for data retention and deletion procedures
   
4. **Security Incident Response Plan** - Security
   - Framework for responding to data security incidents
   
5. **Data Breach Notification Template** - Compliance
   - Template for notifying authorities and users of data breaches

#### Moderate Risk (4 templates)
6. **Granular Consent Management Framework** - Consent Management
   - Advanced consent management with purpose-based controls
   
7. **Data Processing Agreement (DPA)** - Vendor Management
   - Template DPA for third-party data processors
   
8. **Vendor Risk Assessment Framework** - Vendor Management
   - Framework for assessing third-party vendor risks (Excel)
   
9. **User Rights Request Procedures** - Data Subject Rights
   - Procedures for handling data access, correction, and deletion requests

#### High Risk (6 templates)
10. **Data Protection Impact Assessment (DPIA)** - Risk Assessment
    - Comprehensive DPIA template for high-risk processing
    
11. **DPO Charter & Role Description** - Governance
    - Charter and job description for Data Protection Officer
    
12. **Cross-Border Transfer Documentation** - Data Transfer
    - Documentation for cross-border data transfers
    
13. **AI/ML Governance Framework** - AI Governance
    - Framework for governing AI/ML data processing activities
    
14. **Children Data Protection Policy** - Special Categories
    - Policy for processing children's personal data
    
15. **Sensitive Data Handling Procedures** - Security
    - Procedures for handling sensitive personal data

### Categories (13 total)
- All Categories (filter option)
- Privacy Documentation
- Consent Management
- Data Governance
- Security
- Compliance
- Vendor Management
- Data Subject Rights
- Risk Assessment
- Governance
- Data Transfer
- AI Governance
- Special Categories

### Risk Tiers (4 options)
- All Tiers
- BASIC
- MODERATE
- HIGH

## UI Components Breakdown

### 1. Header Navigation
- Logo + "DPDPA Portal" title
- Navigation links: Home, Resources (active), FAQ
- White background with shadow

### 2. Hero Section
- Gradient background (blue-700 to blue-900)
- Book icon + "Resource Hub" heading
- Description: "Download DPDPA-compliant templates, guides, and documentation to kickstart your compliance journey"

### 3. Quick Actions Grid (3 cards)
- **Take Assessment** - Blue border
  - Links to /risk-assessment/start
  - Icon: CheckCircle
  - Description about 10-question assessment
  
- **FAQ** - Green border
  - Links to /risk-assessment/faq
  - Icon: HelpCircle
  - Description about DPDPA compliance questions
  
- **Templates Available** - Purple border
  - Shows count: "15 Templates Available"
  - Icon: FileText
  - Static display (no link)

### 4. Filter Section (White card)
- Two dropdown filters:
  - **Category**: Select from 13 categories
  - **Risk Tier**: Select from 4 risk tiers
- Shows result count: "Showing X of 15 templates"

### 5. Template Library Grid
- 3-column grid (responsive: 2-col on medium, 1-col on mobile)
- Each template card:
  - FileText icon (blue-700)
  - Risk tier badge (color-coded: gray=ALL, green=BASIC, amber=MODERATE, red=HIGH)
  - Template name (heading)
  - Category (gray text)
  - Description (gray text)
  - Download button (blue, with Download icon)
- Empty state when no templates match filters

### 6. DPDPA Sections Reference
- White card with 6 key DPDPA sections
- 2-column grid
- Each section has:
  - Colored left border (blue, green, amber, red, purple, indigo)
  - Section number and title
  - Brief description
- Sections:
  - Section 5: Notice
  - Section 6: Consent
  - Section 8: Data Security
  - Section 10: SDF Obligations
  - Section 11-14: Data Principal Rights
  - Section 16: Children's Data

### 7. Footer
- Dark gray background (gray-900)
- Copyright text: "© 2026 DPDPA Risk Scoping Portal. Templates provided for guidance only."
- Disclaimer: "Customize templates according to your specific organizational requirements."

## Functionality

### Filter Logic
1. **Category Filter**:
   - "All Categories" shows all templates
   - Specific category shows only matching templates

2. **Risk Tier Filter**:
   - "All Tiers" shows all templates
   - Specific tier shows templates with that tier OR "ALL" tier
   - Examples:
     - Select "BASIC" → shows BASIC templates + ALL templates
     - Select "MODERATE" → shows MODERATE templates + ALL templates
     - Select "HIGH" → shows HIGH templates + ALL templates

3. **Combined Filters**: Both filters work together (AND logic)

### Download Functionality
- Currently shows alert: "Template download will be implemented with actual file storage"
- In our implementation: Keep as placeholder or show message about future feature

### Risk Badge Colors
- ALL: Gray (bg-gray-100, text-gray-800)
- BASIC: Green (bg-green-100, text-green-800)
- MODERATE: Amber (bg-amber-100, text-amber-800)
- HIGH: Red (bg-red-100, text-red-800)

## Routing

### New Route Required
- Path: `/risk-assessment/resources`
- Component: `ResourcesPage.tsx`

### Navigation Updates
1. Add "Resources" link to IntroPage header navigation
2. Add route to App.tsx

## Theme Consistency

### Colors
- Header: White background, blue-700 for logo and active links
- Hero: Gradient from-blue-700 to-blue-900
- Cards: White with shadow, hover shadow-lg
- Quick action borders: Blue (assessment), Green (FAQ), Purple (count)
- Buttons: Blue-700 hover:blue-800
- Section reference borders: Various (blue, green, amber, red, purple, indigo)
- Footer: Gray-900 background

### Typography
- Hero heading: text-4xl font-bold
- Section headings: text-2xl font-bold
- Card headings: text-lg font-bold
- Body text: text-sm to text-base
- Filters: text-sm labels
- Template names: text-lg font-bold
- Categories: text-sm text-gray-500
- Descriptions: text-sm text-gray-600

### Spacing
- Max width: 7xl container
- Padding: px-4 sm:px-6 lg:px-8
- Section spacing: py-12, py-16
- Card padding: p-6, p-8
- Gaps: gap-4, gap-6

## Implementation Steps

### Step 1: Create Types
- File: `src/modules/risk-assessment/types/resources.ts`
- Define Template interface

### Step 2: Create Templates Configuration
- File: `src/modules/risk-assessment/lib/templates-config.ts`
- Export templates array (15 templates)
- Export categories array (13 categories)
- Export riskTiers array (4 tiers)

### Step 3: Create ResourcesPage Component
- File: `src/modules/risk-assessment/pages/ResourcesPage.tsx`
- Import necessary icons from lucide-react
- Implement state for filters (selectedCategory, selectedRiskTier)
- Implement filter logic
- Implement getRiskBadgeColor function
- Build UI sections:
  1. Header with navigation
  2. Hero section
  3. Quick actions grid
  4. Filter section
  5. Template library grid
  6. DPDPA sections reference
  7. Footer

### Step 4: Update Routing
- File: `src/app/App.tsx`
- Add route: `/risk-assessment/resources` → ResourcesPage

### Step 5: Update Navigation
- File: `src/modules/risk-assessment/pages/IntroPage.tsx`
- Add "Resources" link in header navigation

### Step 6: Test Filters and Navigation
- Verify category filtering works
- Verify risk tier filtering works
- Verify combined filters work
- Verify navigation links work
- Verify responsive layout

## Verification Checklist

- [ ] Template interface defined with all required fields
- [ ] 15 templates configured with correct data
- [ ] 13 categories listed
- [ ] 4 risk tiers configured
- [ ] ResourcesPage component created
- [ ] Header navigation matches project theme
- [ ] Hero section with gradient background
- [ ] 3 quick action cards with correct links
- [ ] Filter section with 2 dropdowns
- [ ] Template count display shows "Showing X of 15"
- [ ] Template library grid displays all templates
- [ ] Risk badges color-coded correctly
- [ ] Download buttons present (placeholder functionality)
- [ ] Empty state shows when no templates match
- [ ] DPDPA sections reference with 6 sections
- [ ] Footer with copyright and disclaimer
- [ ] Category filter works correctly
- [ ] Risk tier filter includes ALL tier templates
- [ ] Combined filters work together
- [ ] Route `/risk-assessment/resources` configured
- [ ] Navigation link added to IntroPage
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] All links navigate correctly
- [ ] Theme colors match project standards (vibrant blues, white cards)
- [ ] Font sizes are compact (text-sm for body, text-base for descriptions)
- [ ] Hover states work on cards and buttons

## Notes

1. **File Downloads**: Currently placeholder - shows alert. Can be enhanced later with actual file storage/download
2. **Template Files**: Real template files would be stored in `/public/templates/` directory
3. **Dynamic Content**: Could be enhanced to load templates from API/database
4. **Search Feature**: Could add text search in future enhancement
5. **Pagination**: Not needed with only 15 templates, but could add if library grows
6. **Template Preview**: Could add preview modal before download
7. **User Preferences**: Could save filter preferences to localStorage
8. **Analytics**: Could track which templates are downloaded most

## Success Criteria

✅ All 15 templates display correctly
✅ Filters work independently and together
✅ Navigation between pages works smoothly
✅ UI matches project theme (vibrant colors, compact fonts)
✅ Responsive design works on all screen sizes
✅ Quick action cards link to correct pages
✅ DPDPA sections provide educational value
✅ Empty state displays when appropriate
✅ All risk tier badges color-coded correctly
