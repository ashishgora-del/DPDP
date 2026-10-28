# Logic Change Guide (Risk Scoring + Template Identification)

This document explains the implementation changes made to:
1. Risk scoring logic.
2. Template/document pack identification logic.

It is written as a merge support guide for reviewers and implementers.

## 1) Why These Changes Were Made

### Risk scoring
- Earlier scoring behavior did not fully support branch-aware denominator handling and configurable thresholds/weights through a versioned config.
- The updated logic makes scoring reproducible, configurable, and easier to audit.

### Template identification
- Earlier UI and PDF flows depended on hardcoded package document lists.
- The updated logic reads package-document requirements from a source mapping (JSON/Excel fallback), so package output reflects your maintained mapping file.

## 2) High-Level Behavior After Changes

### End-to-end flow
1. User submits assessment responses.
2. Server computes normalized risk score (0 to 100).
3. Tier is selected using configured thresholds.
4. Template pack id is derived from tier (`low`, `medium`, `high`).
5. Results page resolves package documents using mapping utility.
6. PDF export resolves package documents using the same mapping utility.

Result: UI and PDF are now consistent and mapping-driven.

## 3) Risk Scoring Logic Changes

## 3.1 Core principles
- Score is normalized to 0-100.
- Only answered and applicable questions contribute to denominator.
- Thresholds are configuration-driven.
- Scoring config is versioned and persisted when available.

## 3.2 Calculation model
- Let each applicable question have a weight `w_i` and selected option score `s_i`.
- Weighted score sum: `sum(w_i * s_i)`.
- Maximum weighted score: `sum(w_i * maxScore_i)` over applicable answered questions.
- Normalized risk score:

	score = (weighted_sum / weighted_max) * 100

- If no applicable answered question exists, score safely falls back to 0.

## 3.3 Tier decision
- Tier is derived from configurable bounds:
	- `low` if score <= `basicMax`
	- `medium` if `basicMax` < score <= `moderateMax`
	- `high` if score >= `highMin`
- Default threshold set currently used by fallback config:
	- `basicMax`: 35
	- `moderateMax`: 65
	- `highMin`: 66

## 3.4 SDF requirement decision
- SDF requirement is threshold-based from config (`sdfThreshold`, default 66).
- If score >= threshold, SDF recommendation/flag is enabled.

## 3.5 Main files involved
- `src/lib/risk-calculator.ts`
- `src/lib/risk-scoring-config.ts`
- `src/app/api/assessment/submit/route.ts`
- `src/app/api/assessment/details/route.ts`
- `src/app/api/assessment/export/route.ts`

## 4) Template Identification Logic Changes

## 4.1 Core principles
- Package-to-document mapping is no longer hardcoded in display layer.
- Resolution order is resilient and environment-safe:
	1. JSON snapshot file
	2. Excel workbook files
	3. Hardcoded fallback packs
- Header and field normalization handle inconsistent spreadsheet formatting.

## 4.2 Source resolution order
The mapping loader attempts in this order:
1. `data/DPDP_Documents.json`
2. Spreadsheet candidates (for example `data/DPDP_Documents.xlsx`)
3. Fallback in-code packs

This ensures runtime reliability even if workbook parsing fails or path handling differs by environment.

## 4.3 Spreadsheet parsing and normalization
- Header names are normalized (trimmed, case-insensitive handling).
- Mandatory flags are parsed robustly from typical values (`yes`, `true`, `1`, etc.).
- Row-level mapping is transformed into canonical pack output grouped by tier.

## 4.4 Tier-to-pack linkage
- Existing risk tier output (`low`, `medium`, `high`) is passed to mapping resolver.
- Resolver returns:
	- Pack name
	- Document list
	- Mandatory marker per document

## 4.5 UI and PDF consistency
- Results UI and export route both consume the same resolved mapping output.
- This removes drift between what users see on screen and what they get in generated PDF.

## 4.6 Main files involved
- `src/lib/document-pack-mapping.ts`
- `src/app/results/[id]/page.tsx`
- `src/app/results/[id]/ResultsDisplay.tsx`
- `src/app/api/assessment/export/route.ts`
- `data/DPDP_Documents.json`

## 5) Data Contract (Practical)

The mapping layer expects enough information to determine:
1. Tier/package (`low`, `medium`, `high` family).
2. Document name/title.
3. Whether document is mandatory.

If spreadsheet headers vary, normalization aliases in mapping utility absorb common differences.

## 6) Merge Notes for Reviewers

## 6.1 Functional checks to run
1. Submit an assessment that lands in `low`; confirm low package docs in result and PDF.
2. Submit an assessment that lands in `medium`; confirm medium package docs in result and PDF.
3. Submit an assessment that lands in `high`; confirm high package docs in result and PDF.
4. Verify mandatory document markers are preserved from mapping source.
5. Temporarily move workbook file; verify JSON snapshot path still resolves output.

## 6.2 Non-functional checks
1. Confirm no direct hardcoded package-doc list remains in UI rendering path.
2. Confirm tier threshold values are coming from active config or fallback defaults.
3. Confirm export route and results page resolve through shared mapping utility.

## 6.3 Backward compatibility
- If mapping files are missing/unreadable, fallback packs prevent runtime breakage.
- Existing assessment result shape remains compatible with tier-driven downstream logic.

## 7) Commit References

Primary commits associated with this work:
- `d39e693` - Assessment and scoring logic separation/commit.
- `14de64f` - Spreadsheet/JSON-driven template mapping integration.

## 8) Known Scope Boundaries

- This change set focuses on assessment scoring and package-document resolution.
- Unrelated DSRM route typing/build issues are outside this merge scope.

## 9) Summary for Stakeholders

- Risk scoring is now normalized, configurable, and version-aware.
- Package/template identification is now data-driven from your mapping source.
- Results screen and PDF export now use one shared mapping path, reducing inconsistency risk.
