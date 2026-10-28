# Compliance Tracking Module - Implementation Plan

**Version**: 1.0  
**Date**: March 1, 2026  
**Status**: Ready for Implementation  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase-Wise Implementation](#phase-wise-implementation)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Navigation Flows](#navigation-flows)
7. [Error Handling](#error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose
Create a dedicated **Compliance Tracking Module** that provides users with a centralized location to manage their DPDPA compliance checklist, track progress, and attach evidence documents. This module completes the user journey: Risk Assessment → Template Generation → Compliance Tracking.

### Key Features
- ✅ Project-based compliance tracking
- ✅ Reusable checklist from existing implementation
- ✅ Visual progress indicators
- ✅ Document attachment capability
- ✅ Auto-save functionality
- ✅ Smart navigation (home vs template generation)

### Requirements
1. **Access Control**: Only accessible after template generation is complete
2. **Project Linkage**: Tied to specific projects via `project_id`
3. **Generic Content**: Checklist items are universal but marking is project-specific
4. **Data Persistence**: Uses existing `project_checklist_items` table
5. **Scalability**: Built for future AI guidance and audit features

---

## Architecture

### Module Structure

```
src/modules/compliance-tracking/
├── pages/
│   ├── ComplianceProjectSelector.tsx    # Select project from home page
│   └── ComplianceDetailPage.tsx         # Main compliance tracking page
├── components/
│   ├── ProjectProgressHeader.tsx        # Journey visualization
│   ├── ChecklistSection.tsx             # Reusable checklist UI
│   ├── ComplianceStats.tsx              # Progress metrics
│   └── EmptyState.tsx                   # No eligible projects state
├── hooks/
│   └── useCompliance.ts                 # Data fetching & state management
└── api.ts                                # API client functions
```

### Shared Resources

```
src/shared/lib/
└── checklistData.ts                     # Moved from risk-assessment module
                                        # Both modules use this reference data
```

### URL Structure

```
/compliance-tracking                     # Project selector (from home)
/compliance-tracking/:projectId          # Main compliance page
/projects/:projectId/checklist           # Existing quick-access (keep as-is)
```

**Rationale**: Top-level `/compliance-tracking` matches other modules (risk-assessment, template-generation), making it scalable for future features like reports, audits, and admin controls.

---

## Phase-Wise Implementation

---

### **PHASE 0: Architecture & Setup**
**Duration**: 2-3 hours  
**Goal**: Create foundation and routing

#### Tasks
1. **Create Directory Structure**
   ```bash
   mkdir -p src/modules/compliance-tracking/{pages,components,hooks}
   touch src/modules/compliance-tracking/api.ts
   ```

2. **Create Placeholder Components**
   - `ComplianceProjectSelector.tsx` - Empty component with routing
   - `ComplianceDetailPage.tsx` - Empty component with routing

3. **Update App.tsx Routing**
   ```tsx
   import ComplianceProjectSelector from '../modules/compliance-tracking/pages/ComplianceProjectSelector';
   import ComplianceDetailPage from '../modules/compliance-tracking/pages/ComplianceDetailPage';
   
   // Add routes:
   <Route path="/compliance-tracking" element={<ComplianceProjectSelector />} />
   <Route path="/compliance-tracking/:projectId" element={<ComplianceDetailPage />} />
   ```

4. **Update HomePage.tsx**
   - Wire "Compliance Tracker" card to navigate to `/compliance-tracking`
   - Test: Click should route to placeholder page

#### Validation
- ✅ Routes work without errors
- ✅ Navigation from home page functions
- ✅ Page components render (even if empty)

---

### **PHASE 1: Project Selection & Context**
**Duration**: 3-4 hours  
**Goal**: Smart navigation and project filtering

#### Tasks

##### 1.1 Create Project Selector UI
**File**: `ComplianceProjectSelector.tsx`

**Features**:
- Fetch all user projects via existing `getProjects()` API
- Filter: `project.templatesGenerated > 0` (only eligible projects)
- Display:
  - Project cards (similar to ProjectsDashboard styling)
  - Organization name, risk tier badge, template count
  - "Continue to Compliance →" button per project
- Empty state: "Complete Template Generation first" with CTA to projects page

**Code Pattern**:
```tsx
const { projects, loading, error } = useProjects();

const eligibleProjects = projects.filter(p => p.templatesGenerated > 0);

{eligibleProjects.length === 0 ? (
  <EmptyState 
    title="No Projects Ready"
    message="Complete template generation for a project first"
    actionLabel="Go to Projects"
    onAction={() => navigate('/projects')}
  />
) : (
  <ProjectGrid projects={eligibleProjects} />
)}
```

##### 1.2 Context Detection & Auto-Navigation
**Logic**:
```tsx
// In ComplianceProjectSelector.tsx
useEffect(() => {
  // Check if coming from template generation with project context
  const params = new URLSearchParams(location.search);
  const projectId = params.get('projectId');
  
  if (projectId) {
    // Auto-navigate to compliance for that project
    navigate(`/compliance-tracking/${projectId}`, { replace: true });
  }
}, [location]);
```

**Update WorkbenchPage.tsx**:
```tsx
// Add "Continue to Compliance" button after generation completes
<button onClick={() => navigate(`/compliance-tracking?projectId=${assessmentId}`)}>
  Continue to Compliance Tracking →
</button>
```

##### 1.3 Backend Validation Endpoint
**New Backend Route**: `GET /projects/:id/compliance-eligibility`

**File**: `backend/src/projects/projects.controller.ts`
```typescript
@Get(':id/compliance-eligibility')
@ApiOperation({ summary: 'Check if project is eligible for compliance tracking' })
async checkComplianceEligibility(
  @CurrentUser() user: any,
  @Param('id') id: string,
) {
  return this.service.checkComplianceEligibility(id, user.sub);
}
```

**File**: `backend/src/projects/projects.service.ts`
```typescript
async checkComplianceEligibility(projectId: string, userId: string) {
  const project = await this.getProject(projectId, userId); // ownership check
  
  // Check if templates exist
  const docCount = await this.databaseService.query(
    `SELECT COUNT(*) as count FROM generated_documents 
     WHERE assessment_id IN (
       SELECT id FROM risk_assessments WHERE project_id = $1
     )`,
    [projectId]
  );
  
  const hasTemplates = parseInt(docCount.rows[0].count) > 0;
  
  return {
    eligible: hasTemplates,
    reason: hasTemplates ? null : 'Complete template generation first',
    requirements: {
      hasProject: true,
      hasAssessment: !!project,
      hasTemplates,
    }
  };
}
```

**Frontend API Call**:
```typescript
// src/modules/compliance-tracking/api.ts
export const checkComplianceEligibility = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}/compliance-eligibility`);
  return response.data;
};
```

#### Validation
- ✅ Project selector shows only eligible projects
- ✅ Empty state appears when no templates exist
- ✅ Auto-navigation from template generation works
- ✅ Manual selection from home page works
- ✅ Backend validates eligibility

---

### **PHASE 1.5: Backend Validation & Error Handling**
**Duration**: 2 hours  
**Goal**: Robust error handling and validation

#### Tasks

##### 1.5.1 Error Boundary Component
**File**: `src/modules/compliance-tracking/components/ErrorBoundary.tsx`
```tsx
export class ComplianceErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

##### 1.5.2 Error Scenarios
1. **Project Not Found**: Redirect to project selector
2. **Templates Deleted**: Show warning, allow read-only access
3. **Network Failure**: Retry button + cached state
4. **Unauthorized**: Redirect to login

##### 1.5.3 Route Guards
**File**: `ComplianceDetailPage.tsx`
```tsx
useEffect(() => {
  if (!projectId) {
    navigate('/compliance-tracking', { replace: true });
    return;
  }
  
  checkComplianceEligibility(projectId)
    .then(result => {
      if (!result.eligible) {
        setError(result.reason);
        // Show warning but allow viewing
      }
    })
    .catch(() => navigate('/compliance-tracking', { replace: true }));
}, [projectId]);
```

#### Validation
- ✅ Invalid project ID redirects safely
- ✅ Deleted projects show error state
- ✅ Network errors display retry option
- ✅ Error boundary catches crashes

---

### **PHASE 2: Progress Header & Context Display**
**Duration**: 4-5 hours  
**Goal**: Show user journey and project context

#### Tasks

##### 2.1 Create ProjectProgressHeader Component
**File**: `src/modules/compliance-tracking/components/ProjectProgressHeader.tsx`

**Visual Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Organization: Acme Corp                 BASIC Risk     │
│  Geography: India (single-city)                         │
│                                                         │
│  [✓ Risk Assessment] → [✓ Templates (5)] → [→ Compliance] │
└─────────────────────────────────────────────────────────┘
```

**Props**:
```tsx
interface ProjectProgressHeaderProps {
  project: ProjectWithProgress;
  assessment: RiskAssessment;
  templateCount: number;
}
```

**Data Fetching**:
```tsx
// In ComplianceDetailPage.tsx
const [project, setProject] = useState<ProjectWithProgress | null>(null);
const [assessment, setAssessment] = useState<RiskAssessment | null>(null);

useEffect(() => {
  Promise.all([
    getProject(projectId),
    // Get assessment via project
    getProjects().then(projects => 
      projects.find(p => p.id === projectId)?.latestAssessmentId
    ).then(assessmentId => assessmentId ? getAssessment(assessmentId) : null)
  ]).then(([proj, assess]) => {
    setProject(proj);
    setAssessment(assess);
  });
}, [projectId]);
```

##### 2.2 Progress Stepper UI
**Implementation**:
```tsx
const steps = [
  { label: 'Risk Assessment', completed: true, icon: Shield },
  { label: `Templates (${templateCount})`, completed: true, icon: FileText },
  { label: 'Compliance Tracking', completed: false, active: true, icon: ListChecks },
];

{steps.map((step, idx) => (
  <div key={idx} className="flex items-center">
    <StepIndicator {...step} />
    {idx < steps.length - 1 && <Arrow />}
  </div>
))}
```

##### 2.3 Loading States
**Skeleton Loader**:
```tsx
{loading ? (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
    <div className="h-6 bg-gray-200 rounded w-1/2" />
  </div>
) : (
  <ProjectProgressHeader ... />
)}
```

#### Validation
- ✅ Header displays project context correctly
- ✅ Progress stepper shows completion status
- ✅ Risk tier badge has correct color
- ✅ Template count matches database
- ✅ Loading skeleton appears during fetch

---

### **PHASE 3: Reuse Checklist UI**
**Duration**: 3-4 hours  
**Goal**: Integrate existing checklist functionality

#### Tasks

##### 3.1 Move Shared Checklist Data
**Action**: Move `checklistData.ts` to shared location
```bash
mv src/modules/risk-assessment/lib/checklistData.ts src/shared/lib/checklistData.ts
```

**Update Imports**: 
- In `ComplianceChecklistPage.tsx`: Change import path
- In new `ComplianceDetailPage.tsx`: Import from shared location

##### 3.2 Extract ChecklistSection Component
**File**: `src/modules/compliance-tracking/components/ChecklistSection.tsx`

**Props**:
```tsx
interface ChecklistSectionProps {
  projectId: string;
  checkedItems: Set<string>;
  onToggleItem: (itemId: string) => void;
  onToggleCategory: (category: string) => void;
  expanded: Set<string>;
  onToggleExpand: (category: string) => void;
  saving: boolean;
  lastSaved: Date | null;
}
```

**Features**:
- Collapsible categories
- Priority badges (Required/Recommended/SDF-Only)
- Item descriptions
- Checkboxes with auto-save
- Category-level "Toggle All" button
- Save indicator ("Saving..." / "Saved at HH:MM")

##### 3.3 Integrate into ComplianceDetailPage
**File**: `ComplianceDetailPage.tsx`

**State Management**:
```tsx
const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [expanded, setExpanded] = useState<Set<string>>(
  new Set(CHECKLIST_CATEGORIES)
);

// Load saved checklist state
useEffect(() => {
  if (!projectId) return;
  getProjectChecklist(projectId)
    .then(items => {
      const checked = items.filter(i => i.checked).map(i => i.itemId);
      setCheckedItems(new Set(checked));
    })
    .finally(() => setLoading(false));
}, [projectId]);

// Auto-save with debounce
const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleSave = useCallback((nextChecked: Set<string>) => {
  if (saveTimer.current) clearTimeout(saveTimer.current);
  
  saveTimer.current = setTimeout(async () => {
    setSaving(true);
    try {
      await saveProjectChecklist(
        projectId,
        CHECKLIST_ITEMS.map(item => ({
          itemId: item.id,
          checked: nextChecked.has(item.id),
        }))
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save checklist:', error);
    } finally {
      setSaving(false);
    }
  }, 600);
}, [projectId]);

const handleToggleItem = (itemId: string) => {
  setCheckedItems(prev => {
    const next = new Set(prev);
    next.has(itemId) ? next.delete(itemId) : next.add(itemId);
    scheduleSave(next);
    return next;
  });
};
```

**Reuse Existing APIs**:
```typescript
// src/modules/compliance-tracking/api.ts
export { 
  getProjectChecklist,
  saveProjectChecklist 
} from '../risk-assessment/api';
```

##### 3.4 Page Layout
```tsx
<ComplianceDetailPage>
  <ProjectProgressHeader 
    project={project}
    assessment={assessment}
    templateCount={project.templatesGenerated}
  />
  
  <ComplianceStats 
    total={CHECKLIST_ITEMS.length}
    checked={checkedItems.size}
    byCategory={categoryBreakdown}
  />
  
  <ChecklistSection
    projectId={projectId}
    checkedItems={checkedItems}
    onToggleItem={handleToggleItem}
    onToggleCategory={handleToggleCategory}
    expanded={expanded}
    onToggleExpand={toggleExpand}
    saving={saving}
    lastSaved={lastSaved}
  />
</ComplianceDetailPage>
```

#### Validation
- ✅ Checklist items load from database
- ✅ Checking items triggers auto-save
- ✅ Save indicator shows status
- ✅ Category collapse/expand works
- ✅ Toggle all in category works
- ✅ Existing projects' data loads correctly

---

### **PHASE 3.5: Empty States & Loading**
**Duration**: 1-2 hours  
**Goal**: Better UX for edge cases

#### Tasks

##### 3.5.1 EmptyState Component
**File**: `src/modules/compliance-tracking/components/EmptyState.tsx`

**Usage Scenarios**:
1. No eligible projects
2. Project has no assessment
3. Assessment has no templates
4. Checklist failed to load

**Props**:
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

##### 3.5.2 Loading Skeletons
**Header Skeleton**:
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-gray-200 rounded w-1/3" />
  <div className="flex space-x-4">
    <div className="h-6 bg-gray-200 rounded w-24" />
    <div className="h-6 bg-gray-200 rounded w-24" />
    <div className="h-6 bg-gray-200 rounded w-24" />
  </div>
</div>
```

**Checklist Skeleton**:
```tsx
<div className="space-y-2">
  {[1, 2, 3, 4, 5].map(i => (
    <div key={i} className="flex items-center space-x-3 animate-pulse">
      <div className="h-5 w-5 bg-gray-200 rounded" />
      <div className="h-5 bg-gray-200 rounded flex-1" />
    </div>
  ))}
</div>
```

##### 3.5.3 Error State UI
**Component**: Show error with retry
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div className="flex-1">
        <p className="font-medium text-red-900">{error}</p>
        <p className="text-sm text-red-700">Please try again</p>
      </div>
      <button onClick={refetch} className="btn-secondary">
        Retry
      </button>
    </div>
  </div>
)}
```

#### Validation
- ✅ Empty states display correctly
- ✅ Loading skeletons appear during fetch
- ✅ Error states have retry functionality
- ✅ User is never stuck on broken page

---

### **PHASE 4: Document Attachments**
**Duration**: 5-6 hours  
**Goal**: Evidence upload per checklist item

#### Tasks

##### 4.1 Database Schema
**File**: `backend/migration.sql`

Add at end of file:
```sql
-- =============================================================================
-- SECTION 9: Compliance Attachments (Phase 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS compliance_attachments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_data         TEXT NOT NULL,  -- base64 encoded file content
  file_size         INTEGER NOT NULL,
  file_type         TEXT NOT NULL,  -- MIME type
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_attachments_project 
  ON compliance_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_attachments_item 
  ON compliance_attachments(checklist_item_id);

COMMENT ON TABLE compliance_attachments IS 
  'Evidence documents attached to compliance checklist items';
```

##### 4.2 Backend Endpoints

**File**: `backend/src/projects/projects.controller.ts`

```typescript
@Post(':id/compliance/attachments')
@ApiOperation({ summary: 'Upload attachment for checklist item' })
async uploadAttachment(
  @CurrentUser() user: any,
  @Param('id') projectId: string,
  @Body() dto: UploadAttachmentDto,
) {
  return this.service.uploadAttachment(projectId, user.sub, dto);
}

@Get(':id/compliance/attachments/:itemId')
@ApiOperation({ summary: 'Get attachments for a checklist item' })
async getAttachments(
  @CurrentUser() user: any,
  @Param('id') projectId: string,
  @Param('itemId') itemId: string,
) {
  return this.service.getAttachments(projectId, user.sub, itemId);
}

@Delete(':id/compliance/attachments/:attachmentId')
@ApiOperation({ summary: 'Delete an attachment' })
async deleteAttachment(
  @CurrentUser() user: any,
  @Param('id') projectId: string,
  @Param('attachmentId') attachmentId: string,
) {
  return this.service.deleteAttachment(projectId, user.sub, attachmentId);
}
```

**File**: `backend/src/projects/dto/upload-attachment.dto.ts`

```typescript
export class UploadAttachmentDto {
  @IsString()
  checklistItemId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileData: string;  // base64

  @IsNumber()
  fileSize: number;

  @IsString()
  fileType: string;
}
```

**File**: `backend/src/projects/projects.service.ts`

```typescript
async uploadAttachment(
  projectId: string,
  userId: string,
  dto: UploadAttachmentDto,
): Promise<any> {
  // Verify ownership
  await this.getProject(projectId, userId);
  
  const id = randomUUID();
  const query = `
    INSERT INTO compliance_attachments 
      (id, project_id, checklist_item_id, file_name, file_data, file_size, file_type, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, file_name, file_size, file_type, uploaded_at
  `;
  
  const result = await this.db.query(query, [
    id,
    projectId,
    dto.checklistItemId,
    dto.fileName,
    dto.fileData,
    dto.fileSize,
    dto.fileType,
    userId,
  ]);
  
  this.logger.log(`Attachment uploaded for item ${dto.checklistItemId}`);
  return result.rows[0];
}

async getAttachments(projectId: string, userId: string, itemId: string) {
  await this.getProject(projectId, userId);
  
  const query = `
    SELECT id, file_name, file_size, file_type, uploaded_at
    FROM compliance_attachments
    WHERE project_id = $1 AND checklist_item_id = $2
    ORDER BY uploaded_at DESC
  `;
  
  const result = await this.db.query(query, [projectId, itemId]);
  return result.rows;
}

async deleteAttachment(projectId: string, userId: string, attachmentId: string) {
  await this.getProject(projectId, userId);
  
  await this.db.query(
    `DELETE FROM compliance_attachments WHERE id = $1 AND project_id = $2`,
    [attachmentId, projectId]
  );
  
  this.logger.log(`Attachment ${attachmentId} deleted`);
  return { success: true };
}
```

##### 4.3 Frontend UI

**Component**: `AttachmentButton.tsx`
```tsx
interface AttachmentButtonProps {
  projectId: string;
  checklistItemId: string;
  attachments: Attachment[];
  onAttachmentsChange: () => void;
}

export function AttachmentButton({ ... }: AttachmentButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      
      setUploading(true);
      try {
        await uploadAttachment(projectId, {
          checklistItemId,
          fileName: file.name,
          fileData: base64!,
          fileSize: file.size,
          fileType: file.type,
        });
        onAttachmentsChange();
      } catch (error) {
        alert('Upload failed');
      } finally {
        setUploading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        {uploading ? 'Uploading...' : '📎 Attach Evidence'}
      </button>
      
      {attachments.length > 0 && (
        <span className="text-sm text-gray-500">
          ({attachments.length} file{attachments.length !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}
```

**Component**: `AttachmentsList.tsx`
```tsx
export function AttachmentsList({ attachments, onDelete }: Props) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="space-y-2 mt-2">
      {attachments.map(att => (
        <div key={att.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">{att.fileName}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(att.fileSize)} • {new Date(att.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onDelete(att.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Integration**: Update ChecklistSection to include attachments
```tsx
{CHECKLIST_ITEMS.map(item => (
  <div key={item.id} className="space-y-2">
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checkedItems.has(item.id)}
        onChange={() => onToggleItem(item.id)}
      />
      <div className="flex-1">
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-gray-600">{item.description}</p>
        
        <AttachmentButton
          projectId={projectId}
          checklistItemId={item.id}
          attachments={attachmentsByItem[item.id] || []}
          onAttachmentsChange={() => refetchAttachments(item.id)}
        />
        
        <AttachmentsList
          attachments={attachmentsByItem[item.id] || []}
          onDelete={handleDeleteAttachment}
        />
      </div>
    </div>
  </div>
))}
```

##### 4.4 Frontend API
**File**: `src/modules/compliance-tracking/api.ts`

```typescript
export const uploadAttachment = async (
  projectId: string,
  data: {
    checklistItemId: string;
    fileName: string;
    fileData: string;
    fileSize: number;
    fileType: string;
  }
) => {
  const response = await apiClient.post(
    `/projects/${projectId}/compliance/attachments`,
    data
  );
  return response.data;
};

export const getAttachments = async (projectId: string, itemId: string) => {
  const response = await apiClient.get(
    `/projects/${projectId}/compliance/attachments/${itemId}`
  );
  return response.data;
};

export const deleteAttachment = async (projectId: string, attachmentId: string) => {
  await apiClient.delete(
    `/projects/${projectId}/compliance/attachments/${attachmentId}`
  );
};
```

#### Validation
- ✅ File upload works (PDF, images, documents)
- ✅ File size limit enforced (5MB)
- ✅ Attachments display per checklist item
- ✅ Delete attachment works
- ✅ Attachment count shows in UI
- ✅ Database CASCADE deletes attachments with project

---

### **PHASE 5: Stats & Analytics**
**Duration**: 3-4 hours  
**Goal**: Visual progress tracking

#### Tasks

##### 5.1 Create ComplianceStats Component
**File**: `src/modules/compliance-tracking/components/ComplianceStats.tsx`

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│  Compliance Progress                     │
│                                         │
│  12/25 Items Completed (48%)            │
│  ████████████░░░░░░░░░░░  48%          │
│                                         │
│  By Priority:                           │
│  ✓ Required: 8/10 (80%)                │
│  ○ Recommended: 3/12 (25%)             │
│  ○ SDF-Specific: 1/3 (33%)             │
│                                         │
│  By Category:                           │
│  📋 Legal Foundations: 3/4              │
│  📝 Notices & Consent: 4/4              │
│  👤 Data Principal Rights: 2/5          │
│  🔒 Security & Governance: 1/7          │
│  🌐 Cross-Border Transfers: 1/2         │
│  ⚡ SDF Requirements: 1/3               │
└─────────────────────────────────────────┘
```

**Props**:
```tsx
interface ComplianceStatsProps {
  checkedItems: Set<string>;
}
```

**Calculations**:
```typescript
const total = CHECKLIST_ITEMS.length;
const checked = checkedItems.size;
const percentage = Math.round((checked / total) * 100);

// By priority
const byPriority = {
  required: { checked: 0, total: 0 },
  recommended: { checked: 0, total: 0 },
  'sdf-only': { checked: 0, total: 0 },
};

CHECKLIST_ITEMS.forEach(item => {
  byPriority[item.priority].total++;
  if (checkedItems.has(item.id)) {
    byPriority[item.priority].checked++;
  }
});

// By category
const byCategory = CHECKLIST_CATEGORIES.map(category => {
  const items = CHECKLIST_ITEMS.filter(i => i.category === category);
  const checkedCount = items.filter(i => checkedItems.has(i.id)).length;
  return {
    category,
    checked: checkedCount,
    total: items.length,
    percentage: Math.round((checkedCount / items.length) * 100),
  };
});
```

**Component**:
```tsx
export function ComplianceStats({ checkedItems }: ComplianceStatsProps) {
  const stats = calculateStats(checkedItems);
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Overall Progress */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Compliance Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{stats.checked}/{stats.total} Items Completed</span>
            <span className="text-2xl font-bold text-blue-600">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* By Priority */}
      <div>
        <h4 className="font-medium mb-2">By Priority</h4>
        <div className="space-y-2">
          <PriorityBar label="Required" {...stats.byPriority.required} color="blue" />
          <PriorityBar label="Recommended" {...stats.byPriority.recommended} color="amber" />
          <PriorityBar label="SDF-Specific" {...stats.byPriority['sdf-only']} color="purple" />
        </div>
      </div>
      
      {/* By Category */}
      <div>
        <h4 className="font-medium mb-2">By Category</h4>
        <div className="grid grid-cols-2 gap-2">
          {stats.byCategory.map(cat => (
            <CategoryCard key={cat.category} {...cat} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

##### 5.2 Mini Components

**PriorityBar**:
```tsx
function PriorityBar({ label, checked, total, color }: Props) {
  const percentage = Math.round((checked / total) * 100);
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm px-2 py-1 rounded ${colorClasses[color]}`}>
        {label}
      </span>
      <span className="text-sm font-medium">
        {checked}/{total} ({percentage}%)
      </span>
    </div>
  );
}
```

**CategoryCard**:
```tsx
function CategoryCard({ category, checked, total, percentage }: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="text-sm font-medium text-gray-700">{category}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{checked}</span>
        <span className="text-sm text-gray-500">/ {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

##### 5.3 Integration
**Place in ComplianceDetailPage**:
```tsx
<ComplianceDetailPage>
  <ProjectProgressHeader ... />
  
  {/* Stats section */}
  <div className="my-6">
    <ComplianceStats checkedItems={checkedItems} />
  </div>
  
  <ChecklistSection ... />
</ComplianceDetailPage>
```

#### Validation
- ✅ Overall progress bar updates in real-time
- ✅ Priority breakdown displays correctly
- ✅ Category breakdown matches checklist
- ✅ Percentages calculate accurately
- ✅ Visual feedback on progress

---

### **PHASE 6: Integration & Polish**
**Duration**: 2-3 hours  
**Goal**: Complete the user journey

#### Tasks

##### 6.1 Navigation Links

**WorkbenchPage.tsx** - After generation:
```tsx
{generationComplete && (
  <div className="mt-4 flex gap-3">
    <button
      onClick={() => navigate(`/compliance-tracking/${assessment.projectId}`)}
      className="btn-primary"
    >
      Continue to Compliance Tracking →
    </button>
    <button
      onClick={() => navigate(`/template-generation/editor/${firstDocId}`)}
      className="btn-secondary"
    >
      View Documents
    </button>
  </div>
)}
```

**ProjectsDashboard.tsx** - Add button to project card:
```tsx
<div className="flex gap-2">
  <button
    onClick={() => navigate(`/projects/${project.id}/checklist`)}
    className="btn-secondary-sm"
  >
    <CheckSquare className="h-4 w-4" />
    Quick Checklist
  </button>
  
  {project.templatesGenerated > 0 && (
    <button
      onClick={() => navigate(`/compliance-tracking/${project.id}`)}
      className="btn-primary-sm"
    >
      <ListChecks className="h-4 w-4" />
      Compliance
    </button>
  )}
</div>
```

**ComplianceDetailPage.tsx** - Add breadcrumb navigation:
```tsx
<div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
  <button onClick={() => navigate('/')} className="hover:text-blue-600">
    Home
  </button>
  <ChevronRight className="h-4 w-4" />
  <button onClick={() => navigate('/projects')} className="hover:text-blue-600">
    Projects
  </button>
  <ChevronRight className="h-4 w-4" />
  <span className="text-gray-900 font-medium">{project?.name}</span>
  <ChevronRight className="h-4 w-4" />
  <span className="text-gray-900 font-medium">Compliance</span>
</div>

<div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">Compliance Tracking</h1>
  
  <div className="flex gap-2">
    <button
      onClick={() => navigate(`/template-generation/workbench?assessmentId=${assessment.id}`)}
      className="btn-secondary"
    >
      <FileText className="h-4 w-4" />
      Back to Templates
    </button>
    
    <button
      onClick={() => navigate('/projects')}
      className="btn-secondary"
    >
      All Projects
    </button>
  </div>
</div>
```

##### 6.2 Auto-Refresh on Focus
**Add to ComplianceDetailPage**:
```tsx
useEffect(() => {
  const handleFocus = () => {
    // Refetch project and checklist data
    refetchProject();
    refetchChecklist();
  };
  
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [refetchProject, refetchChecklist]);
```

##### 6.3 Responsive Design Check
**Test on mobile**:
- Header stacks vertically
- Stats cards in single column
- Checklist items wrap properly
- Buttons are touch-friendly (min 44px height)

##### 6.4 Performance Optimization
```tsx
// Memoize expensive calculations
const stats = useMemo(() => 
  calculateStats(checkedItems), 
  [checkedItems]
);

// Debounce auto-save
const debouncedSave = useMemo(
  () => debounce(saveChecklist, 600),
  [projectId]
);
```

##### 6.5 Accessibility
- Add ARIA labels to checkboxes
- Keyboard navigation for checklist
- Focus management on page load
- Screen reader announcements for save status

#### Validation
- ✅ All navigation links work
- ✅ Breadcrumbs display correctly
- ✅ Back buttons navigate properly
- ✅ Auto-refresh on focus works
- ✅ Mobile layout is usable
- ✅ No console errors
- ✅ Keyboard navigation works

---

## Database Schema

### Existing Tables (Reused)

```sql
-- Projects (existing)
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist Items (existing)
CREATE TABLE IF NOT EXISTS project_checklist_items (
  project_id TEXT        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id    TEXT        NOT NULL,
  checked    BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, item_id)
);
```

### New Tables (Phase 4)

```sql
-- Compliance Attachments
CREATE TABLE IF NOT EXISTS compliance_attachments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_data         TEXT NOT NULL,  -- base64 encoded
  file_size         INTEGER NOT NULL,
  file_type         TEXT NOT NULL,  -- MIME type
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_attachments_project 
  ON compliance_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_attachments_item 
  ON compliance_attachments(checklist_item_id);
```

### Foreign Key Relationships

```
users ─┐
       ├─> projects ─┐
       │             ├─> project_checklist_items
       │             └─> compliance_attachments ─┐
       │                                         │
       └─────────────────────────────────────────┘
```

**Cascade Behavior**:
- Delete user → deletes all projects → deletes checklist items + attachments
- Delete project → deletes checklist items + attachments
- Document attachments track uploader but don't delete user if attachment deleted

---

## API Endpoints

### Existing Endpoints (Reused)

```typescript
// Projects
GET    /projects                              // List user's projects
GET    /projects/:id                          // Get project details
DELETE /projects/:id                          // Delete project

// Checklist
GET    /projects/:id/checklist                // Get saved checklist state
PUT    /projects/:id/checklist                // Save checklist state
```

### New Endpoints (Phase 1+)

```typescript
// Compliance Eligibility
GET    /projects/:id/compliance-eligibility   // Check if eligible
```

**Response**:
```json
{
  "eligible": true,
  "reason": null,
  "requirements": {
    "hasProject": true,
    "hasAssessment": true,
    "hasTemplates": true
  }
}
```

### New Endpoints (Phase 4)

```typescript
// Attachments
POST   /projects/:id/compliance/attachments         // Upload file
GET    /projects/:id/compliance/attachments/:itemId // List files for item
DELETE /projects/:id/compliance/attachments/:id     // Delete file
```

**Upload Request**:
```json
{
  "checklistItemId": "legal-basis",
  "fileName": "legal_basis_document.pdf",
  "fileData": "base64EncodedString...",
  "fileSize": 102400,
  "fileType": "application/pdf"
}
```

**Upload Response**:
```json
{
  "id": "att_uuid",
  "fileName": "legal_basis_document.pdf",
  "fileSize": 102400,
  "fileType": "application/pdf",
  "uploadedAt": "2026-03-01T10:30:00Z"
}
```

**List Response**:
```json
[
  {
    "id": "att_uuid_1",
    "fileName": "legal_basis_document.pdf",
    "fileSize": 102400,
    "fileType": "application/pdf",
    "uploadedAt": "2026-03-01T10:30:00Z"
  },
  {
    "id": "att_uuid_2",
    "fileName": "consent_form.pdf",
    "fileSize": 256000,
    "fileType": "application/pdf",
    "uploadedAt": "2026-03-01T11:15:00Z"
  }
]
```

---

## Navigation Flows

### Flow 1: Home → Compliance (New User)

```
User at HomePage
  ↓ Clicks "Compliance Tracker" card
ComplianceProjectSelector
  ↓ Shows empty state: "Complete template generation first"
  ↓ User clicks "Go to Projects"
ProjectsDashboard
  ↓ User creates project → completes assessment → generates templates
  ↓ Clicks "Compliance" button on project card
ComplianceDetailPage (projectId from button)
  ✓ Full compliance tracking interface
```

### Flow 2: Template Generation → Compliance (Direct)

```
User at WorkbenchPage (just generated templates)
  ↓ Clicks "Continue to Compliance Tracking" button
ComplianceDetailPage (auto-navigated with projectId)
  ✓ Full compliance tracking interface
```

### Flow 3: Projects Dashboard → Compliance

```
User at ProjectsDashboard
  ↓ Clicks "Compliance" button on project card
ComplianceDetailPage (projectId from project)
  ✓ Full compliance tracking interface
```

### Flow 4: Quick Access via Existing Checklist

```
User at ProjectsDashboard
  ↓ Clicks "Quick Checklist" button
ComplianceChecklistPage (existing page, kept for quick access)
  ✓ Focused checklist view (no progress header)
```

---

## Error Handling

### Error Scenarios

| Scenario | Detection | Handling | User Experience |
|----------|-----------|----------|-----------------|
| **Invalid Project ID** | URL param doesn't match DB | Redirect to selector | "Project not found" → back to list |
| **No Templates** | `templatesGenerated === 0` | Show warning, allow view | "Complete templates first" banner |
| **Templates Deleted** | API returns 0 documents | Lock editing, read-only | "Templates deleted, view-only mode" |
| **Network Failure** | API call fails | Retry button + cached state | "Connection lost, retry?" |
| **Unauthorized** | 401 response | Redirect to login | "Session expired, please login" |
| **Project Deleted** | 404 on project fetch | Redirect to projects | "Project no longer exists" |
| **User Lost Access** | 403 response | Redirect to projects | "You no longer have access" |
| **Checklist Load Fail** | API error on GET | Show error + retry | "Failed to load checklist, retry?" |
| **Save Failure** | API error on PUT | Keep local state, retry | "Save failed, retrying..." |
| **Attachment Too Large** | File > 5MB | Block upload, show message | "File too large (max 5MB)" |
| **Attachment Upload Fail** | API error on POST | Retry option | "Upload failed, try again?" |

### Error Boundary Implementation

```tsx
// src/modules/compliance-tracking/components/ErrorBoundary.tsx
export class ComplianceErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Compliance module error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-4">
              We encountered an error loading the compliance tracker.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary flex-1"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/projects'}
                className="btn-secondary flex-1"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**Usage in App.tsx**:
```tsx
<Route 
  path="/compliance-tracking/*" 
  element={
    <ComplianceErrorBoundary>
      <Routes>
        <Route index element={<ComplianceProjectSelector />} />
        <Route path=":projectId" element={<ComplianceDetailPage />} />
      </Routes>
    </ComplianceErrorBoundary>
  } 
/>
```

### Graceful Degradation

```tsx
// In ComplianceDetailPage
const [viewMode, setViewMode] = useState<'normal' | 'readonly'>('normal');

useEffect(() => {
  checkComplianceEligibility(projectId)
    .then(result => {
      if (!result.eligible && result.reason) {
        // Allow viewing but lock editing
        setViewMode('readonly');
        setWarning(result.reason);
      }
    });
}, [projectId]);

// In ChecklistSection
<input
  type="checkbox"
  checked={checkedItems.has(item.id)}
  onChange={() => viewMode === 'normal' && onToggleItem(item.id)}
  disabled={viewMode === 'readonly'}
/>
```

---

## Testing Strategy

### Unit Tests

```typescript
// checklist-utils.test.ts
describe('calculateStats', () => {
  it('should calculate overall percentage correctly', () => {
    const checked = new Set(['item1', 'item2']);
    const stats = calculateStats(checked);
    expect(stats.percentage).toBe(8); // 2/25 = 8%
  });
  
  it('should group by priority correctly', () => {
    const checked = new Set(['legal-basis', 'ropa']);
    const stats = calculateStats(checked);
    expect(stats.byPriority.required.checked).toBeGreaterThan(0);
  });
});

// attachment-utils.test.ts
describe('validateFileSize', () => {
  it('should reject files over 5MB', () => {
    const tooBig = 6 * 1024 * 1024;
    expect(validateFileSize(tooBig)).toBe(false);
  });
  
  it('should accept files under 5MB', () => {
    const ok = 2 * 1024 * 1024;
    expect(validateFileSize(ok)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// compliance-flow.spec.ts
describe('Compliance Tracking Flow', () => {
  it('should navigate from home to compliance selector', () => {
    cy.visit('/');
    cy.contains('Compliance Tracker').click();
    cy.url().should('include', '/compliance-tracking');
  });
  
  it('should show empty state when no eligible projects', () => {
    cy.visit('/compliance-tracking');
    cy.contains('Complete template generation first').should('be.visible');
  });
  
  it('should navigate to compliance detail with eligible project', () => {
    // Setup: create project with templates
    cy.createProjectWithTemplates('Test Project');
    
    cy.visit('/compliance-tracking');
    cy.contains('Test Project').click();
    cy.url().should('match', /\/compliance-tracking\/[a-z0-9-]+/);
    cy.contains('Compliance Progress').should('be.visible');
  });
  
  it('should save checklist changes', () => {
    cy.visit('/compliance-tracking/test-project-id');
    
    // Check first item
    cy.get('[data-testid="checklist-item-legal-basis"]')
      .find('input[type="checkbox"]')
      .click();
    
    // Verify save indicator
    cy.contains('Saving...').should('be.visible');
    cy.contains(/Saved at \d{2}:\d{2}/).should('be.visible');
    
    // Reload and verify persistence
    cy.reload();
    cy.get('[data-testid="checklist-item-legal-basis"]')
      .find('input[type="checkbox"]')
      .should('be.checked');
  });
  
  it('should upload and delete attachment', () => {
    cy.visit('/compliance-tracking/test-project-id');
    
    // Upload file
    cy.get('[data-testid="attach-legal-basis"]').click();
    cy.get('input[type="file"]').attachFile('test-document.pdf');
    cy.contains('test-document.pdf').should('be.visible');
    
    // Delete file
    cy.get('[data-testid="delete-attachment"]').first().click();
    cy.contains('test-document.pdf').should('not.exist');
  });
});
```

### Manual Testing Checklist

- [ ] Home page card navigates correctly
- [ ] Project selector filters eligible projects
- [ ] Empty state displays when no templates
- [ ] Progress header shows correct data
- [ ] Checklist items load and display
- [ ] Checking items triggers auto-save
- [ ] Save indicator appears and updates
- [ ] Category collapse/expand works
- [ ] Toggle all in category works
- [ ] Stats component calculates correctly
- [ ] Progress bars animate smoothly
- [ ] File upload accepts valid files
- [ ] File upload rejects large files (>5MB)
- [ ] Attachments display per item
- [ ] Delete attachment works
- [ ] Back buttons navigate properly
- [ ] Breadcrumbs display correctly
- [ ] Auto-refresh on focus works
- [ ] Mobile layout is usable
- [ ] Keyboard navigation works
- [ ] Error states display properly
- [ ] Loading skeletons appear
- [ ] Network errors show retry option

---

## Future Enhancements

### Phase 7: AI-Powered Guidance (Future)

**Goal**: Provide contextual help for each checklist item

**Implementation**:
1. Add `aiGuidancePrompt` to `ChecklistItem` interface
2. Create "Get AI Help" button per item
3. Call OpenAI API with:
   - Item description
   - Organization context
   - Generated templates
4. Display guidance in modal or expandable section

**Example**:
```typescript
interface ChecklistItem {
  // ... existing fields
  aiGuidancePrompt?: string;  // Prompt for AI guidance
}

// In ChecklistSection
<button onClick={() => getAIGuidance(item)}>
  <Sparkles /> Get AI Help
</button>
```

**AI Prompt Template**:
```
You are a DPDPA compliance expert. Help the user with this compliance requirement:

Requirement: {item.title}
Description: {item.description}

Organization Context:
- Name: {orgName}
- Geography: {geography}
- Risk Tier: {riskTier}

They have already generated these templates:
{templatesList}

Provide specific, actionable guidance on how to complete this checklist item,
including what documents to prepare and key considerations.
```

---

### Phase 8: Document-Checklist Linkage (Future)

**Goal**: Link generated templates to checklist items

**Database**:
```sql
CREATE TABLE IF NOT EXISTS checklist_document_links (
  checklist_item_id TEXT NOT NULL,
  document_id       TEXT NOT NULL REFERENCES generated_documents(id) ON DELETE CASCADE,
  relevance_score   INTEGER DEFAULT 100,  -- 0-100, for ranking
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (checklist_item_id, document_id)
);
```

**UI Enhancement**:
```tsx
// Show related documents for each checklist item
<div className="related-documents mt-2">
  <p className="text-sm text-gray-600">Related Templates:</p>
  {relatedDocs.map(doc => (
    <a 
      key={doc.id}
      href={`/template-generation/editor/${doc.id}`}
      className="text-sm text-blue-600 hover:underline"
    >
      {doc.title} →
    </a>
  ))}
</div>
```

**Mapping Logic**:
```typescript
const CHECKLIST_TO_ARTIFACT_MAP = {
  'legal-basis': ['art_001', 'art_002'],
  'privacy-notice': ['art_005'],
  'consent-mechanism': ['art_001'],
  // ... etc
};
```

---

### Phase 9: Compliance Reports (Future)

**Goal**: Generate PDF reports of compliance status

**Features**:
- Overall progress summary
- Checklist completion status
- Attached evidence files
- Signature section for auditors
- Export as PDF

**Implementation**:
```typescript
// Backend endpoint
GET /projects/:id/compliance/report

// Use PDF generation library
import PDFDocument from 'pdfkit';

async generateComplianceReport(projectId: string) {
  const doc = new PDFDocument();
  
  // Header
  doc.fontSize(20).text('DPDPA Compliance Report', { align: 'center' });
  
  // Project info
  doc.fontSize(12).text(`Project: ${project.name}`);
  doc.text(`Organization: ${assessment.orgName}`);
  
  // Checklist status
  doc.text('Compliance Checklist Status:');
  // ... render checklist with checkmarks
  
  // Attached evidence
  doc.text('Evidence Documents:');
  // ... list attachment file names
  
  return doc;
}
```

---

### Phase 10: Deadline Tracking (Future)

**Goal**: Set deadlines for compliance items

**Database**:
```sql
ALTER TABLE project_checklist_items
  ADD COLUMN deadline TIMESTAMPTZ,
  ADD COLUMN assigned_to TEXT REFERENCES users(id);
```

**Features**:
- Set deadline per item
- Visual indicators (due soon, overdue)
- Email reminders
- Dashboard showing upcoming deadlines

---

### Phase 11: Audit Trail (Future)

**Goal**: Track all changes for compliance history

**Database**:
```sql
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,  -- 'checked', 'unchecked', 'attachment_added', etc.
  item_id     TEXT,
  details     JSONB,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Features**:
- Log every checklist change
- Log every attachment upload/delete
- Searchable audit history
- Export audit log to CSV

---

### Phase 12: Team Collaboration (Future)

**Goal**: Multiple users working on same project

**Features**:
- Share project with team members
- Assign checklist items to users
- Real-time collaboration (WebSocket)
- Comments on checklist items
- @mention notifications

**Database**:
```sql
CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,  -- 'owner', 'editor', 'viewer'
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS checklist_comments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,
  user_id           TEXT NOT NULL REFERENCES users(id),
  comment           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Implementation Timeline

### Week 1
- **Day 1-2**: Phase 0 + Phase 1 (Architecture & Project Selection)
- **Day 3**: Phase 1.5 (Error Handling)
- **Day 4-5**: Phase 2 (Progress Header)

### Week 2
- **Day 1-2**: Phase 3 (Checklist Reuse)
- **Day 3**: Phase 3.5 (Empty States)
- **Day 4-5**: Phase 4 (Attachments)

### Week 3
- **Day 1-2**: Phase 5 (Stats & Analytics)
- **Day 3-4**: Phase 6 (Integration & Polish)
- **Day 5**: Testing & bug fixes

**Total Estimated Time**: ~60-80 hours (3 weeks)

---

## Dependencies

### Frontend
- Existing: `react-router-dom`, `motion/react`, `lucide-react`, `axios`
- No new dependencies required

### Backend
- Existing: `@nestjs/common`, `pg` (PostgreSQL client)
- No new dependencies required

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| **Data loss during migration** | Low | High | No migration needed, existing data works as-is |
| **Performance issues with large checklists** | Low | Medium | Use React.memo, useMemo for calculations |
| **File upload failures** | Medium | Medium | Implement retry logic, chunked uploads |
| **User confusion on navigation** | Medium | Low | Clear breadcrumbs, contextual help text |
| **Scope creep (AI features)** | High | Medium | Keep AI guidance for Phase 7+, MVP without it |
| **Backend API breaking changes** | Low | High | Maintain backward compatibility, version APIs |

---

## Success Metrics

### Technical Metrics
- [ ] Page load time < 2s
- [ ] Auto-save success rate > 99%
- [ ] File upload success rate > 95%
- [ ] Zero critical bugs in production
- [ ] Mobile responsive on all screen sizes

### User Experience Metrics
- [ ] Navigation flows complete without errors
- [ ] Empty states guide users to next step
- [ ] Error states provide clear actions
- [ ] Loading states prevent confusion
- [ ] All accessibility checks pass

### Business Metrics
- [ ] >50% of users with templates use compliance module
- [ ] Average session time > 5 minutes
- [ ] >70% of checklist items get checked
- [ ] >30% of items have attachments

---

## Documentation Deliverables

1. **User Guide**: Step-by-step screenshots of compliance tracking
2. **Developer Docs**: API reference, component props, data flow diagrams
3. **Admin Guide**: Managing compliance data, reports, exports
4. **Deployment Guide**: Database migration, environment variables, rollback plan

---

## Rollback Plan

If critical issues arise in production:

1. **Immediate**: Remove routes from `App.tsx`
   ```tsx
   // Comment out compliance routes
   // <Route path="/compliance-tracking" element={<ComplianceProjectSelector />} />
   // <Route path="/compliance-tracking/:projectId" element={<ComplianceDetailPage />} />
   ```

2. **Database**: No rollback needed - new tables don't affect existing functionality

3. **User Impact**: Users lose compliance tracking, but core features (risk, templates) remain functional

4. **Recovery**: Fix issues in staging, redeploy when stable

---

## Appendix

### Checklist Items Reference

Current checklist has **25 items** across **6 categories**:

1. **Legal Foundations** (3 items)
   - Legal basis documentation
   - ROPA (Records of Processing Activities)
   - DPIA (Data Protection Impact Assessment)

2. **Notices & Consent** (4 items)
   - Privacy notice
   - Consent mechanism
   - Consent withdrawal
   - Children's consent

3. **Data Principal Rights** (5 items)
   - Access requests
   - Correction/erasure
   - Rights workflow
   - Complaints handling
   - Grievance officer

4. **Security & Governance** (7 items)
   - Security controls
   - Encryption
   - Access controls
   - Incident response
   - Data retention
   - Vendor management
   - Staff training

5. **Cross-Border Transfers** (2 items)
   - Transfer assessments
   - Safeguards

6. **SDF-Specific Requirements** (3 items)
   - Data Auditor appointment
   - Annual audit
   - Transparency reports

**Source**: `src/shared/lib/checklistData.ts`

---

## Contact & Support

**Implementation Lead**: Development Team  
**Backend Support**: Backend API team  
**Design Consultation**: UX/UI team  
**QA Testing**: QA team

---

**Document Version**: 1.0  
**Last Updated**: March 1, 2026  
**Status**: ✅ Ready for Implementation  
**Next Step**: Begin Phase 0 - Architecture & Setup
