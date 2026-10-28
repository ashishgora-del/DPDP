import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDocument, useUpdateDocument } from '../hooks/useTemplates';
import { useAssessment } from '../../risk-assessment/hooks/useAssessment';
import { LoadingState } from '../../../shared/components/LoadingState';
import * as api from '../api';
import type { GeneratedDocument } from '../api';
import {
  ArrowLeft,
  Save,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Shield,
  Building2,
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Bot,
  Sparkles,
} from 'lucide-react';
import { ConversationProvider, useConversation } from '../context/ConversationContext';
import { ChatPanel } from '../components/ChatPanel';
import { LiveDocumentPreview } from '../components/LiveDocumentPreview';
import { SectionProgressSidebar } from '../components/SectionProgressSidebar';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
};

type DocStatus = 'generated' | 'draft' | 'edited' | 'exported';

const STATUS_ICON: Record<DocStatus, React.ReactNode> = {
  generated: <Clock className="h-3.5 w-3.5 text-blue-400" />,
  draft: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
  edited: <CheckCircle className="h-3.5 w-3.5 text-green-400" />,
  exported: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentEditorPage() {
  return (
    <ConversationProvider>
      <DocumentEditorPageContent />
    </ConversationProvider>
  );
}

function DocumentEditorPageContent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assessmentId = searchParams.get('assessmentId');

  // ── Current document ────────────────────────────────────────────────────────
  const { data: document, loading: docLoading, error: docError, refetch } = useDocument(id || '');
  const { update, updating } = useUpdateDocument();

  // ── Document list sidebar ───────────────────────────────────────────────────
  const [sidebarDocs, setSidebarDocs] = useState<GeneratedDocument[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  // ── Editor state ────────────────────────────────────────────────────────────
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ── AI Mode State ───────────────────────────────────────────────────────────
  const {
    isAIMode,
    toggleAIMode,
    state: conversationState,
    initializeConversation,
    addMessage,
    updateProgress,
    setNextField,
    setCurrentSection,
    setSections,
    setCompletedSections,
  } = useConversation();
  const [startingConversation, setStartingConversation] = useState(false);

  // ── Right-panel settings ────────────────────────────────────────────────────
  const [tone, setTone] = useState<string>('balanced');
  const [jurisdiction, setJurisdiction] = useState<string>('india');
  const [sector, setSector] = useState<string>('general');
  const [docStatus, setDocStatus] = useState<DocStatus>('generated');

  // ── Assessment context ──────────────────────────────────────────────────────
  // Prioritize document's own assessment_id over URL parameter
  const { assessment } = useAssessment(
    document?.assessment_id ?? assessmentId,
  );

  // ── Load current document into editor + state ───────────────────────────────
  useEffect(() => {
    if (document && editorRef.current) {
      // Convert plain text / markdown to HTML for the contentEditable div
      editorRef.current.innerHTML = markdownToHtml(document.content || '');
      setDocStatus((document.status || 'DRAFT') as DocStatus);
      setTone(document.tone || 'balanced');
      setJurisdiction(document.jurisdiction || 'india');
      setSector(document.sector || 'general');
      setHasChanges(false);
    }
  }, [document]);

  // ── Fetch sidebar document list ─────────────────────────────────────────────
  const fetchSidebarDocs = useCallback(() => {
    // Prioritize document's own assessment_id over URL parameter
    const aId = document?.assessment_id ?? assessmentId;
    if (!aId) {
      // If no assessment ID at all, fetch all user's documents
      setSidebarLoading(true);
      api.getUserDocuments(1, 100)
        .then((response) => setSidebarDocs(response.documents))
        .catch(() => {})
        .finally(() => setSidebarLoading(false));
      return;
    }
    
    setSidebarLoading(true);
    api
      .getDocumentsByAssessment(aId)
      .then((docs) => {
        // If no documents found for this assessment, fetch all user's documents as fallback
        if (docs.length === 0) {
          return api.getUserDocuments(1, 100).then((response) => response.documents);
        }
        return docs;
      })
      .then((docs) => setSidebarDocs(docs))
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, [assessmentId, document?.assessment_id]);

  useEffect(() => {
    fetchSidebarDocs();
  }, [fetchSidebarDocs]);

  // ── Auto-refetch sidebar when window gains focus (useful after database changes) ──
  useEffect(() => {
    const handleFocus = () => {
      fetchSidebarDocs();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSidebarDocs]);

  // ── Toolbar helpers ─────────────────────────────────────────────────────────
  const execCmd = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    window.document.execCommand(cmd, false, value);
    setHasChanges(true);
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!id || !editorRef.current) return;
    setSaveStatus('saving');
    try {
      const htmlContent = editorRef.current.innerHTML;
      await update(id, {
        content: htmlToMarkdown(htmlContent),
        status: docStatus === 'generated' ? 'draft' : docStatus,
        tone,
        jurisdiction,
        sector,
      });
      setDocStatus((prev) => (prev === 'generated' ? 'draft' : prev));
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ── Regenerate ──────────────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    if (!id || !document || !assessment) return;
    if (!document.artifact_id) {
      alert('This document has no linked artifact template and cannot be regenerated.');
      return;
    }
    setIsRegenerating(true);
    try {
      const newDoc = await api.generateFromTemplate({
        artifactId: document.artifact_id,
        assessmentId: document.assessment_id,
        orgName: assessment.orgName,
      });
      // Update current doc's content with newly generated content
      await update(id, { content: newDoc.content });
      // Delete the temporary new document
      await api.deleteDocument(newDoc.id);
      // Reload the current document
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Regeneration failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  // ── Start AI Conversation ───────────────────────────────────────────────────
  const handleStartAIConversation = async () => {
    if (!id || startingConversation) return;
    
    setStartingConversation(true);
    try {
      // Start conversation with backend
      const response = await api.startConversation(id, {
        templateId: 'vendor-risk-assessment',
        assessmentId: document?.assessment_id ?? assessmentId ?? undefined,
      });

      // Initialize conversation state
      initializeConversation(response.conversationId, {
        orgName: assessment?.orgName || 'Unknown',
        assessmentId: document?.assessment_id ?? assessmentId ?? undefined,
        assessmentTier: assessment?.riskTier,
        templateId: 'vendor-risk-assessment',
        documentId: id,
      });

      // Add all initial messages (welcome + first grouped question) from the backend
      for (const msg of response.messages) {
        addMessage({
          id: msg.id || `msg-init-${Date.now()}-${Math.random()}`,
          role: msg.role as 'ai' | 'user' | 'system',
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: { type: (msg.type as any) || 'intro' },
        });
      }

      // Set current section
      setCurrentSection({
        sectionId: response.currentSection.sectionId,
        sectionNumber: response.currentSection.sectionNumber,
        title: response.currentSection.title,
        emoji: response.currentSection.emoji,
        status: 'in-progress',
      });

      // Populate the full sections list and restore completed sections (for resume)
      setSections(response.sections);
      setCompletedSections(response.completedSections);

      // Update progress
      updateProgress({
        currentSection: response.currentSection.sectionNumber,
        totalSections: response.currentSection.totalSections,
        sectionFieldsCompleted: 0,
        sectionFieldsTotal: 1,
        overallPercentage: 0,
      });

      // Switch to AI mode
      toggleAIMode();
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      alert(err.response?.data?.message || 'Failed to start AI conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  // ── Handle Section Updates from Chat ─────────────────────────────────────────
  const handleSectionUpdate = useCallback(async (sectionId: string, markdown: string) => {
    if (!id) return;
    
    try {
      // The backend already merged the section, so we just need to reload the document
      await refetch();
    } catch (err) {
      console.error('Failed to update section:', err);
    }
  }, [id, refetch]);

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!document || !editorRef.current) return;
    const content = htmlToMarkdown(editorRef.current.innerHTML);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${(document.title || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Mark as exported
    if (id) void update(id, { status: 'exported' });
    setDocStatus('exported');
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (docLoading) return <LoadingState fullScreen message="Loading document..." />;

  if (docError || !document) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm text-center border border-red-100">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Document not found</h3>
          <p className="text-sm text-gray-500 mb-4">{docError || 'This document does not exist.'}</p>
          <button
            onClick={() => navigate('/template-generation')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  // Prioritize document's own assessment_id over URL parameter for navigation
  const effectiveAssessmentId = document?.assessment_id ?? assessmentId;

  // ── Render ───────────────────────────────────────────────────────────────────
  // Render AI Mode
  if (isAIMode) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/60 border-b border-white/60 px-4 py-2.5 flex items-center gap-3 shadow-sm flex-shrink-0">
          <button
            onClick={() =>
              navigate(
                effectiveAssessmentId
                  ? `/template-generation/workbench?assessmentId=${effectiveAssessmentId}`
                  : '/template-generation',
              )
            }
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Workbench
          </button>
          <span className="text-gray-200">|</span>
          {assessment?.projectName && (
            <>
              <span
                className="text-sm text-gray-400 hover:text-blue-700 cursor-pointer transition-colors truncate max-w-[120px]"
                title={assessment.projectName}
                onClick={() => navigate('/projects')}
              >
                {assessment.projectName}
              </span>
              <span className="text-gray-200">/</span>
            </>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{document.title}</p>
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI-Assisted Mode
            </p>
          </div>

          {/* Switch back to manual mode */}
          <button
            onClick={toggleAIMode}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Switch to Manual
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </header>

        {/* Main 3-panel layout for AI mode */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Section Progress */}
          <div className="w-80 flex-shrink-0">
            <SectionProgressSidebar templateId="vendor-risk-assessment" />
          </div>

          {/* Center: Live Document Preview */}
          <div className="flex-1">
            <LiveDocumentPreview content={document.content || ''} />
          </div>

          {/* Right: Chat Panel */}
          <div className="w-96 flex-shrink-0">
            <ChatPanel documentId={id || ''} onSectionUpdate={handleSectionUpdate} />
          </div>
        </div>
      </div>
    );
  }

  // ── Render Manual Mode (existing layout) ────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="backdrop-blur-md bg-white/60 border-b border-white/60 px-4 py-2.5 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() =>
            navigate(
              effectiveAssessmentId
                ? `/template-generation/workbench?assessmentId=${effectiveAssessmentId}`
                : '/template-generation',
            )
          }
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Workbench
        </button>
        <span className="text-gray-200">|</span>
        {assessment?.projectName && (
          <>
            <span
              className="text-sm text-gray-400 hover:text-blue-700 cursor-pointer transition-colors truncate max-w-[120px]"
              title={assessment.projectName}
              onClick={() => navigate('/projects')}
            >
              {assessment.projectName}
            </span>
            <span className="text-gray-200">/</span>
          </>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{document.title}</p>
          {document.artifact_name && (
            <p className="text-xs text-gray-400">Editing: {document.artifact_name}</p>
          )}
        </div>

        {/* Save status feedback */}
        <div className="flex items-center gap-2">
          {hasChanges && saveStatus === 'idle' && (
            <span className="text-xs text-orange-500">● Unsaved changes</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500">Save failed</span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || updating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Draft
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </header>

      {/* ── Main 3-panel body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: document list */}
        <aside className="w-64 backdrop-blur-md bg-blue-50/80 border-r border-blue-200/60 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-blue-200/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Documents
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : sidebarDocs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 px-3">No documents found.</p>
            ) : (
              <ul className="py-1">
                {sidebarDocs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() =>
                        navigate(
                          `/template-generation/editor/${doc.id}?assessmentId=${effectiveAssessmentId}`,
                        )
                      }
                      className={`w-full text-left px-3 py-2.5 hover:bg-blue-100/80 transition-colors border-l-4 ${
                        doc.id === id
                          ? 'border-l-blue-500 bg-white shadow-sm'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {STATUS_ICON[(doc.status || 'DRAFT') as DocStatus]}
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium leading-snug line-clamp-2 ${
                              doc.id === id ? 'text-blue-700' : 'text-gray-800'
                            }`}
                          >
                            {doc.artifact_name || doc.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: Toolbar + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-lg z-10">
          {/* Toolbar */}
          <div className="border-b border-gray-200 px-3 py-1.5 flex items-center gap-0.5 bg-gray-50 flex-shrink-0 flex-wrap">
            {/* Text formatting */}
            <ToolbarBtn title="Bold" onClick={() => execCmd('bold')}>
              <Bold className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Italic" onClick={() => execCmd('italic')}>
              <Italic className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Heading" onClick={() => execCmd('formatBlock', 'h2')}>
              <span className="text-xs font-bold">H2</span>
            </ToolbarBtn>
            <ToolbarBtn title="Bullet list" onClick={() => execCmd('insertUnorderedList')}>
              <List className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Numbered list" onClick={() => execCmd('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            <ToolbarBtn title="Undo" onClick={() => execCmd('undo')}>
              <Undo className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Redo" onClick={() => execCmd('redo')}>
              <Redo className="h-4 w-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* AI-Assisted Mode Toggle */}
            <button
              onClick={handleStartAIConversation}
              disabled={startingConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {startingConversation ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Fill using AI
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* AI action buttons */}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </button>

            <button
              onClick={() => {
                setTone('simple');
                void handleRegenerate();
              }}
              disabled={isRegenerating}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              Simplify
            </button>

            <button
              onClick={() => {
                setTone('legalistic');
                void handleRegenerate();
              }}
              disabled={isRegenerating}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Stricter
            </button>
          </div>

          {/* contentEditable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setHasChanges(true)}
            className="flex-1 overflow-y-auto p-8 outline-none prose prose-sm max-w-none focus:outline-none"
            style={{ minHeight: 0 }}
          />
        </div>

        {/* Right sidebar: context + settings */}
        <aside className="w-72 backdrop-blur-md bg-purple-50/80 border-l border-purple-200/60 flex flex-col overflow-y-auto flex-shrink-0">
          {/* Assessment context */}
          {assessment && (
            <div className="p-4 border-b border-purple-200/60">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Assessment Context
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium text-gray-800">{assessment.orgName}</span>
                </div>
                {assessment.q2_geography && (
                  <p className="text-gray-600 pl-5 line-clamp-1">{assessment.q2_geography}</p>
                )}
                <div className="pl-0 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      TIER_BADGE[assessment.riskTier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {assessment.riskTier} Risk
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regeneration settings */}
          <div className="p-4 border-b border-purple-200/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Regeneration Settings
            </p>
            <div className="space-y-3">
              <SettingSelect
                label="Tone"
                value={tone}
                onChange={setTone}
                options={[
                  { value: 'simple', label: 'Simple' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'legalistic', label: 'Legalistic' },
                ]}
              />
              <SettingSelect
                label="Jurisdiction"
                value={jurisdiction}
                onChange={setJurisdiction}
                options={[
                  { value: 'india', label: 'India (DPDP)' },
                  { value: 'eu', label: 'EU (GDPR)' },
                  { value: 'us', label: 'US' },
                  { value: 'uk', label: 'UK (UK GDPR)' },
                ]}
              />
              <SettingSelect
                label="Sector"
                value={sector}
                onChange={setSector}
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'fintech', label: 'Fintech' },
                  { value: 'healthcare', label: 'Healthcare' },
                  { value: 'saas', label: 'SaaS' },
                  { value: 'ecommerce', label: 'E-Commerce' },
                ]}
              />
            </div>
          </div>

          {/* Document status */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Document Status
            </p>
            <select
              value={docStatus}
              onChange={(e) => {
                setDocStatus(e.target.value as DocStatus);
                setHasChanges(true);
              }}
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="generated">Generated</option>
              <option value="draft">Draft</option>
              <option value="edited">Edited</option>
              <option value="exported">Exported</option>
            </select>

            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">
                Created: {new Date(document.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400">
                Updated: {new Date(document.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolbarBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent losing focus in contentEditable
        onClick();
      }}
      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
    >
      {children}
    </button>
  );
}

function SettingSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Markdown / HTML conversion helpers ──────────────────────────────────────

function markdownToHtml(md: string): string {
  if (!md) return '';
  // Very simple converter for display purposes
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hHuUpP])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
