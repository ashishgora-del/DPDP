# Implementation Plan Reisk Assesment Series 1

## 1. Context And Focus

Current platform modules:
- Risk Assesment
- Template Generation
- Complience
- Elearing

Series 1 focus:
- Primary: Risk Assesment
- Secondary dependency: Prepare output contract so Template Generation can render parent-to-child mapping clearly.

This plan intentionally avoids implementation changes in Complience and Elearing during Series 1.

## 2. Problem Statement

Today, risk assessment and template recommendation logic exist, but the next-state requirement is:
- Parent category driven mapping (about 16 parent categories)
- Child template expansion (about 70 templates)
- Tier-aware filtering (low, medium, high)
- Scenario-aware inclusion for special templates
- Consistent output that Template Generation can visually show as parent -> child relationships

## 3. Series 1 Objectives

### 3.1 Functional objectives
- Make Risk Assesment the single source of truth for risk tier and mapping context.
- Add deterministic resolver output for:
  - selected parent categories
  - selected child templates
  - mandatory/recommended status
  - selection reason metadata
- Keep current user assessment flow stable while introducing new mapping model.

### 3.2 Non-functional objectives
- No breaking API changes for existing consumers unless versioned.
- Full traceability from risk answer -> tier -> parent -> child.
- Testable, deterministic, and auditable mapping behavior.

## 4. Scope

### In scope (Series 1)
- Risk Assesment scoring normalization and threshold alignment validation.
- Parent-child mapping schema (JSON-first runtime).
- Risk-to-parent decision rules.
- Parent-to-child expansion and tier filtering.
- API response enhancement to include grouped mapping output.
- UI update in Risk Assesment results to show parent-child visual grouping.

### Out of scope (Series 1)
- Database-first dynamic admin console for mapping edits.
- Full Complience checklist rewrite.
- Elearing integration changes.
- Advanced workflow automation in Template Generation editor.

## 5. Baseline Assumptions

- Tier thresholds to use:
  - low: score <= 35
  - medium: 36-65
  - high: >= 66
- SDF signal threshold: >= 66
- Workbook-derived mapping currently identifies:
  - baseline templates for all tiers
  - medium+high additions
  - high-only additions
  - scenario-only templates (not tied directly to low/medium/high)

## 6. Target Architecture For Series 1

## 6.1 Core pipeline
1. User submits questionnaire answers.
2. Risk engine computes normalized score.
3. Tier resolver selects low/medium/high.
4. Parent category resolver selects applicable parents.
5. Child resolver expands selected parents to child templates.
6. Tier and scenario filters mark each child template as mandatory/recommended/not-applicable.
7. API returns grouped response for UI rendering.

## 6.2 Source of truth strategy
- Runtime source in Series 1: JSON mapping snapshot.
- Excel used as import/reference source only.
- Existing fallback behavior retained for reliability.

## 7. Data Model Design (JSON-first)

## 7.1 Parent category model
- parentId
- parentName
- description
- activationRules
- displayOrder

## 7.2 Child template model
- templateId
- templateName
- parentId
- legalReferences
- obligationType
- frequencyTrigger
- displayOrder

## 7.3 Rule model
- tierFlags:
  - lowMandatory
  - mediumMandatory
  - highMandatory
- scenarioFlags:
  - consentManager
  - stateInstrumentality
  - governmentRequest
  - researchExemption
  - childrenData
  - crossBorder
  - processorEngagement
- recommendationLevel:
  - mandatory
  - recommended
- reasonCode list (for audit and UI explanation)

## 8. API Contract Plan

## 8.1 Existing response compatibility
- Keep existing risk assessment fields intact.
- Add new mapping block without removing old fields.

## 8.2 New response block (proposed)
- mappingVersion
- selectedParents[]
  - parentId
  - parentName
  - selectionReason
  - children[]
    - templateId
    - templateName
    - applicability (mandatory/recommended)
    - reasonCodes[]
- summaryCounts
  - parentCount
  - childCount
  - mandatoryCount
  - recommendedCount

## 9. UI Plan (Risk Assesment Results)

## 9.1 Parent-child visual representation
- Show accordion/card list by parent category.
- Each parent header shows count badges:
  - mandatory children
  - recommended children
- Child list under parent with status chips and reason tooltip.

## 9.2 User actions
- Expand/collapse parent categories.
- Quick filters:
  - show only mandatory
  - show only recommended
- Continue to Template Generation with selected child templates payload.

## 9.3 UX goals
- Make legal complexity readable.
- Preserve traceability for compliance audit.
- Avoid overwhelming user with flat 70-template lists.

## 10. Implementation Work Breakdown

## Phase 1: Rule freeze and modeling
- Finalize parent category master list.
- Finalize child template master list.
- Finalize tier/scenario decision matrix.
- Define mapping JSON schema and validation rules.

Deliverables:
- mapping schema document
- validated JSON snapshot v1
- rule decision table

## Phase 2: Risk engine and resolver integration
- Align backend scoring thresholds with agreed model.
- Implement parent resolver.
- Implement child expansion + filter resolver.
- Add deterministic unit tests for all branches.

Deliverables:
- resolver service module
- test suite for tier + scenario combinations
- API payload with grouped parent-child output

## Phase 3: Results UI integration
- Build grouped parent-child view in results page.
- Add counts, status chips, and reason labels.
- Add handoff payload for Template Generation.

Deliverables:
- updated results UI
- QA scenarios for visual correctness
- handoff integration contract to Template Generation

## Phase 4: Stability and release hardening
- Regression tests on existing risk assessment flows.
- Validate fallback behavior when mapping source unavailable.
- Performance check for rendering grouped data.
- Release checklist and rollback plan.

Deliverables:
- release readiness checklist
- rollback instructions
- known limitations log

## 11. Testing Strategy

## 11.1 Functional tests
- Score boundary tests: 35, 36, 65, 66.
- Tier correctness for representative answer sets.
- Parent selection correctness per tier.
- Child expansion correctness per parent.
- Scenario-only template inclusion/exclusion.

## 11.2 Contract tests
- API schema validation for mapping block.
- Backward compatibility tests for legacy clients.

## 11.3 UI tests
- Parent grouping accuracy.
- Child status chip correctness.
- Count badges match backend payload.

## 12. Risks And Mitigation

- Risk: mismatch between workbook and JSON snapshot.
  - Mitigation: versioned snapshot generation and checksum validation.

- Risk: scoring mismatch between frontend and backend.
  - Mitigation: single backend score source, frontend reads computed output.

- Risk: over-selection of templates causing user overload.
  - Mitigation: mandatory vs recommended separation and parent grouping.

- Risk: uncertain scenario triggers.
  - Mitigation: explicit scenario flag definitions and test fixtures.

## 13. Database Decision For Series 1

Recommendation:
- Series 1 should be JSON-first for speed and stability while rules are evolving.

Rationale:
- Faster iteration and review.
- Avoid early schema churn.
- Easier rollback and diff of mapping versions.

Database move should start in Series 2 after:
- Rule stability confirmed.
- Stakeholder sign-off on parent-child model.
- Two full QA cycles pass.

## 14. Estimated Change Size

Overall change size for Series 1: Medium to Large

Why:
- Core resolver and contract changes are significant.
- UI representation changes are moderate.
- Controlled scope keeps risk manageable.

## 15. Series 1 Exit Criteria

Series 1 is complete when:
- Risk assessment returns stable grouped parent-child mapping output.
- Results page shows correct parent-child visual mapping.
- Mandatory/recommended markers are accurate for low/medium/high.
- Scenario-only templates are conditionally handled.
- Existing risk assessment flow passes regression.

## 16. Series 2 Preview (Not in current scope)

- Move mapping from JSON to database tables.
- Add admin workflow for mapping management.
- Add mapping version activation/deactivation UI.
- Add audit trail for mapping edits.
