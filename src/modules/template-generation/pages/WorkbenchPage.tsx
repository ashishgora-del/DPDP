import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext';
import { useArtifacts } from '../hooks/useTemplates';
import { useAssessment } from '../../risk-assessment/hooks/useAssessment';
import { getProjectSelections, saveProjectSelections } from '../../risk-assessment/api';
import { LoadingState } from '../../../shared/components/LoadingState';
import * as api from '../api';
import type { Artifact } from '../api';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  Users,
  Building2,
  Globe,
  Database,
  ExternalLink,
  ListChecks,
  CheckSquare,
  Home,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type GenStatus = 'pending' | 'generating' | 'done' | 'error';

interface ArtifactRow extends Artifact {
  included: boolean;
  genStatus: GenStatus;
  generatedDocId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkbenchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId');
  const mode = searchParams.get('mode') || 'manual';
  const handoffTemplateIds = (location.state as { selectedTemplateIds?: string[] } | null)?.selectedTemplateIds;

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // All state must be declared before any conditional returns
  const [rows, setRows] = useState<ArtifactRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingDocMap, setExistingDocMap] = useState<Record<string, string>>({}); // artifactId → docId
  const [existingArtifacts, setExistingArtifacts] = useState<Set<string>>(new Set()); // Track which artifacts have any documents
  const autoTriggered = useRef(false);
  // Phase 2: saved selections from the backend
  const [savedSelections, setSavedSelections] = useState<Record<string, boolean> | null>(null);
  const selectionsLoaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data hooks
  const { assessment, loading: assessmentLoading } = useAssessment(assessmentId);
  const { data: artifacts, loading: artifactsLoading } = useArtifacts(
    undefined,
    assessment?.riskTier,
    // Don't fetch until assessment is resolved — prevents the brief flash of all 12 templates
    !assessmentId || (!assessmentLoading && !!assessment),
  );

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/learning-platform/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  // ── Picker guard: no assessmentId → send back to project picker ─────────────
  useEffect(() => {
    if (!authLoading && isAuthenticated && !assessmentId) {
      navigate('/template-generation', { replace: true });
    }
  }, [authLoading, isAuthenticated, assessmentId, navigate]);

  // ── Load pre-existing generated documents for this assessment ────────────────
  const loadExistingDocuments = useCallback(() => {
    if (!assessmentId) return Promise.resolve();
    return api.getDocumentsByAssessment(assessmentId)
      .then((docs) => {
        const map: Record<string, string> = {};
        const artifactSet = new Set<string>();
        docs.forEach((doc) => {
          if (doc.artifact_id) {
            // Store first document ID we encounter (in case of duplicates)
            if (!map[doc.artifact_id]) {
              map[doc.artifact_id] = doc.id;
            }
            // Track that this artifact has at least one document
            artifactSet.add(doc.artifact_id);
          }
        });
        setExistingDocMap(map);
        setExistingArtifacts(artifactSet);
      })
      .catch(() => {});
  }, [assessmentId]);

  useEffect(() => {
    loadExistingDocuments();
  }, [loadExistingDocuments]);

  // ── Auto-refetch documents when window gains focus (useful after database changes) ──
  useEffect(() => {
    const handleFocus = () => {
      loadExistingDocuments();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadExistingDocuments]);

  // ── Load saved artifact selections for this project ───────────────────────────────
  useEffect(() => {
    if (!assessment?.projectId || selectionsLoaded.current) return;
    selectionsLoaded.current = true;
    getProjectSelections(assessment.projectId)
      .then((sels) => {
        const map: Record<string, boolean> = {};
        sels.forEach((s) => { map[s.artifactId] = s.selected; });
        setSavedSelections(map);
      })
      .catch(() => { setSavedSelections({}); }); // on error, treat as empty (all selected)
  }, [assessment?.projectId]);
  // ── Map loaded artifacts to rows (overlay saved selections if available) ───────────────────
  useEffect(() => {
    if (artifacts.length > 0) {
      setRows(artifacts.map((a) => {
        const existingDocId = existingDocMap[a.id];
        const hasDocument = existingArtifacts.has(a.id);
        // If we have saved selections, apply them; otherwise default all to true
        const included = Array.isArray(handoffTemplateIds)
          ? handoffTemplateIds.includes(a.id)
          : savedSelections
            ? (savedSelections[a.id] ?? true)
            : true;
        return {
          ...a,
          included,
          genStatus: hasDocument ? 'done' : 'pending',
          generatedDocId: existingDocId,
        };
      }));
    }
  }, [artifacts, existingDocMap, existingArtifacts, savedSelections, handoffTemplateIds]);

  // ── Auto mode: trigger generation once data is ready ───────────────────────
  useEffect(() => {
    if (
      mode === 'auto' &&
      !autoTriggered.current &&
      rows.length > 0 &&
      assessment &&
      !isGenerating
    ) {
      autoTriggered.current = true;
      void handleGenerate(rows.filter((r) => r.included));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, rows.length, assessment]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Debounced save of selections to the backend
  const scheduleSave = useCallback((updatedRows: ArtifactRow[]) => {
    if (!assessment?.projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const sels = updatedRows.map((r) => ({ artifactId: r.id, selected: r.included }));
      saveProjectSelections(assessment.projectId!, sels).catch(() => {});
    }, 600);
  }, [assessment?.projectId]);

  const toggleRow = (id: string) =>
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, included: !r.included } : r));
      scheduleSave(next);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r, included: checked }));
      scheduleSave(next);
      return next;
    });

  const handleGenerate = async (toGen?: ArtifactRow[]) => {
    // Only generate rows that are checked AND don't already have a document
    const candidates = toGen ?? rows.filter((r) => r.included);
    const selected = candidates.filter((r) => !existingArtifacts.has(r.id));
    if (!assessment || selected.length === 0) return;

    setIsGenerating(true);
    let firstDocId: string | null = null;

    for (const row of selected) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, genStatus: 'generating' } : r)),
      );
      try {
        const doc = await api.generateFromTemplate({
          artifactId: row.id,
          assessmentId: assessment.id,
          orgName: assessment.orgName,
        });
        if (!firstDocId) firstDocId = doc.id;
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, genStatus: 'done', generatedDocId: doc.id } : r,
          ),
        );
        // Update tracking sets
        setExistingArtifacts(prev => new Set(prev).add(row.id));
        setExistingDocMap(prev => ({ ...prev, [row.id]: doc.id }));
      } catch {
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, genStatus: 'error' } : r)),
        );
      }
    }

    setIsGenerating(false);
    if (firstDocId) {
      navigate(`/template-generation/editor/${firstDocId}?assessmentId=${assessmentId}`);
    }
  };

  // ── Open a single artifact in the editor (generate if not yet done) ──────────
  const handleOpenArtifact = async (row: ArtifactRow) => {
    if (!assessment) return;

    // Already generated — open immediately
    if (row.generatedDocId) {
      navigate(`/template-generation/editor/${row.generatedDocId}?assessmentId=${assessmentId}`);
      return;
    }

    // Generate this single artifact then open
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, genStatus: 'generating' } : r)),
    );
    try {
      const doc = await api.generateFromTemplate({
        artifactId: row.id,
        assessmentId: assessment.id,
        orgName: assessment.orgName,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, genStatus: 'done', generatedDocId: doc.id } : r,
        ),
      );
      navigate(`/template-generation/editor/${doc.id}?assessmentId=${assessmentId}`);
    } catch {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, genStatus: 'error' } : r)),
      );
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const selectedCount = rows.filter((r) => r.included).length;
  const pendingCount = rows.filter((r) => r.included && !r.generatedDocId).length;
  const allSelected = rows.length > 0 && rows.every((r) => r.included);
  const someSelected = selectedCount > 0 && !allSelected;

  // ── Guard: still loading auth ────────────────────────────────────────────────
  if (authLoading) return <LoadingState fullScreen message="Loading..." />;
  if (!isAuthenticated) return null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* Top header bar */}
      <header className="backdrop-blur-md bg-white/60 border-b border-white/60 px-5 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => navigate(`/risk-assessment/results/${assessmentId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </button>
        <span className="text-gray-300">|</span>
        {assessment?.projectName && (
          <>
            <span
              className="text-sm text-gray-500 hover:text-blue-700 cursor-pointer transition-colors"
              onClick={() => navigate('/projects')}
            >
              {assessment.projectName}
            </span>
            <span className="text-gray-300">/</span>
          </>
        )}
        <h1 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
          Policy Workbench
        </h1>
        {assessment && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600">{assessment.orgName}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                TIER_BADGE[assessment.riskTier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {assessment.riskTier} Risk
            </span>
          </>
        )}
        {assessment?.projectId && (
          <>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate(`/compliance-tracking/${assessment.projectId}`)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 transition-colors"
              title="View compliance checklist"
            >
              <CheckSquare className="h-4 w-4" />
              Checklist
            </button>
          </>
        )}
        {mode === 'auto' && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" />
            Auto mode
          </span>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Assessment context panel */}
        <aside className="w-72 backdrop-blur-md bg-white/60 border-r border-white/60 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-white/40">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Assessment Context
            </p>
          </div>

          {assessmentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : assessment ? (
            <div className="p-4 space-y-4 text-sm">
              <ContextRow icon={<Building2 className="h-4 w-4 text-blue-500" />} label="Organization">
                <span className="font-medium text-gray-900">{assessment.orgName}</span>
                {assessment.q1_orgProfile && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {assessment.q1_orgProfile}
                  </p>
                )}
              </ContextRow>

              {assessment.q2_geography && (
                <ContextRow icon={<Globe className="h-4 w-4 text-green-500" />} label="Geography">
                  <span className="text-gray-700 line-clamp-2">{assessment.q2_geography}</span>
                </ContextRow>
              )}

              {assessment.q3_dataPrincipals && (
                <ContextRow icon={<Users className="h-4 w-4 text-purple-500" />} label="Data Principals">
                  <span className="text-gray-700 line-clamp-2">{assessment.q3_dataPrincipals}</span>
                </ContextRow>
              )}

              {assessment.q5_dataTypes && (
                <ContextRow icon={<Database className="h-4 w-4 text-orange-500" />} label="Data Types">
                  <span className="text-gray-700 line-clamp-2">{assessment.q5_dataTypes}</span>
                </ContextRow>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Risk Tier</p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    TIER_BADGE[assessment.riskTier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {assessment.riskTier}
                </span>
              </div>

              {assessment.sdfFlag && (
                <div className="flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-800 font-medium leading-snug">
                    Sensitive Data Processing detected
                  </p>
                </div>
              )}

              {assessment.focusAreas && assessment.focusAreas.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Focus Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {assessment.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"
                      >
                        {area.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8 px-4">
              No assessment context loaded.
            </p>
          )}
        </aside>

        {/* Right: Table + footer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table sub-header */}
          <div className="px-5 py-3 flex items-center justify-between backdrop-blur-sm bg-white/40 border-b border-white/40 flex-shrink-0">
            <div>
              <span className="text-sm font-semibold text-gray-800">Available Artifacts</span>
              {rows.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">({rows.length} total)</span>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                Select the documents you want to prepare
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {artifactsLoading || (assessmentLoading && rows.length === 0) ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-500">Loading artifacts…</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-gray-500">
                  No artifacts available for this risk tier.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 backdrop-blur-sm bg-white/70 z-10">
                  <tr className="border-b border-white/60">
                    <th className="pl-5 pr-3 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Artifact
                    </th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tags / Risk Tier
                    </th>
                    <th className="py-3 pr-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => void handleOpenArtifact(row)}
                        className={`border-b border-white/40 cursor-pointer transition-colors select-none ${
                        row.genStatus === 'done'
                          ? 'bg-green-100/60 hover:bg-green-100'
                          : row.genStatus === 'generating'
                          ? 'bg-blue-100/60 opacity-70'
                          : row.included
                          ? 'bg-blue-100/60 hover:bg-blue-100'
                          : 'bg-white/40 hover:bg-white/70'
                      }`}
                    >
                      <td className="pl-5 pr-3 py-3">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() => toggleRow(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900 leading-snug">{row.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                          {row.description}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {row.applicable_risk_tiers?.map((tier) => (
                            <span
                              key={tier}
                              className={`text-xs font-medium px-1.5 py-0.5 rounded border ${
                                TIER_BADGE[tier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {tier}
                            </span>
                          ))}
                          {row.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-5">
                        {row.genStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Circle className="h-4 w-4 text-gray-300" />
                            Click to open
                          </span>
                        )}
                        {row.genStatus === 'generating' && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparing…
                          </span>
                        )}
                        {row.genStatus === 'done' && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Open
                            <ExternalLink className="h-3 w-3 text-blue-500" />
                          </span>
                        )}
                        {row.genStatus === 'error' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Retry
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-white/60 backdrop-blur-md bg-white/60 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => navigate(`/risk-assessment/results/${assessmentId}`)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </button>

            <div className="flex items-center gap-3">
              {/* Show Compliance Tracking button when templates are generated */}
              {pendingCount === 0 && selectedCount > 0 && assessment?.projectId && (
                <button
                  onClick={() => navigate(`/compliance-tracking/${assessment.projectId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
                >
                  <ListChecks className="h-4 w-4" />
                  Continue to Compliance →
                </button>
              )}
              
              <button
                onClick={() => void handleGenerate()}
                disabled={pendingCount === 0 || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : pendingCount === 0 && selectedCount > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    All Selected Already Generated
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate{pendingCount > 0 ? ` ${pendingCount}` : ''} Artifact
                    {pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Small helper sub-component
function ContextRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
