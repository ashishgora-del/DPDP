import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, FolderOpen, Plus, ArrowRight, Trash2, Clock,
  FileText, AlertCircle, CheckCircle, TrendingUp, LogOut, CheckSquare, RefreshCw
} from 'lucide-react';
import { useProjects } from '../hooks/useAssessment';
import { useState, useEffect } from 'react';
import { useAuth, LoginModal } from '../../../shared/auth';

const TIER_COLORS: Record<string, string> = {
  HIGH:     'bg-red-100 text-red-700 border-red-200',
  MODERATE: 'bg-orange-100 text-orange-700 border-orange-200',
  BASIC:    'bg-green-100 text-green-700 border-green-200',
};

const TIER_ICONS: Record<string, typeof AlertCircle> = {
  HIGH:     AlertCircle,
  MODERATE: TrendingUp,
  BASIC:    CheckCircle,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const { projects, loading, error, create, remove, refetch } = useProjects();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout } = useAuth();

  // Auto-refetch when window gains focus (useful after database changes)
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) refetch();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
    // Keep spinner visible for at least 500ms for visual feedback
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await create(newName.trim());
      setNewName('');
      setShowCreate(false);
    } catch (err: any) {
      if (err.response?.status === 401) { setShowLoginModal(true); }
      else alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleStartNew = () => {
    navigate('/risk-assessment/start');
  };

  const handleDelete = async (id: string, name: string) => {
    const project = projects.find(p => p.id === id);
    const docCount = project?.templatesGenerated || 0;
    
    const warningMessage = docCount > 0
      ? `⚠️ WARNING: Deleting "${name}" will permanently delete:\n\n` +
        `• The project\n` +
        `• All risk assessments\n` +
        `• ${docCount} generated document${docCount === 1 ? '' : 's'}\n` +
        `• All saved selections\n\n` +
        `This CANNOT be undone. Are you absolutely sure?`
      : `Delete project "${name}"?\n\nThis will also delete all associated assessments and data.\n\nThis cannot be undone.`;
    
    if (!confirm(warningMessage)) return;
    
    setDeletingId(id);
    try { await remove(id); }
    catch { alert('Could not delete project. Please try again.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} />
        <motion.div className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }} transition={{ duration: 15, repeat: Infinity }} />
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
                My Projects
              </span>
              {user && (
                <p className="text-xs text-gray-500">{user.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all disabled:opacity-50"
              title="Refresh projects">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => navigate('/risk-assessment')}
              className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors">
              Assessment
            </button>
            <button onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Home
            </button>
            {user && (
              <button onClick={logout}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Page title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
              Compliance Projects
            </h1>
            <p className="text-gray-600 mt-1">Track your DPDPA compliance journey across multiple engagements.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            New Project
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 p-6 animate-pulse h-48" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Start your first DPDPA risk assessment to create a project and track your compliance progress.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartNew}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Start First Assessment
            </motion.button>
          </motion.div>
        )}

        {/* Project cards */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((project, idx) => {
                const TierIcon = project.riskTier ? TIER_ICONS[project.riskTier] : FolderOpen;
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm flex-shrink-0">
                            <FolderOpen className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-base leading-tight truncate max-w-[12rem]">
                              {project.name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {relativeTime(project.lastActivity ?? project.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          disabled={deletingId === project.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Risk tier badge */}
                      {project.riskTier ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${TIER_COLORS[project.riskTier]}`}>
                          <TierIcon className="h-3.5 w-3.5" />
                          {project.riskTier} Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 text-gray-500 bg-gray-50">
                          Not assessed yet
                        </span>
                      )}

                      {/* Template progress */}
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span>
                          <span className="font-semibold text-gray-900">{project.templatesGenerated}</span>
                          {' '}document{project.templatesGenerated !== 1 ? 's' : ''} generated
                        </span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="border-t border-gray-100/60 px-6 py-4 bg-white/40 flex items-center justify-between">
                      {project.latestAssessmentId ? (
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => navigate(`/template-generation/workbench?assessmentId=${project.latestAssessmentId}`)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                        >
                          <span>Open Workbench</span>
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => navigate(`/risk-assessment/start?project=${encodeURIComponent(project.name)}`)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                        >
                          <span>Run Assessment</span>
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      )}

                      <button
                        onClick={() => navigate(`/compliance-tracking/${project.id}`)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-purple-700 transition-colors"
                        title="Open compliance checklist"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        Checklist
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Quick-add inline card */}
            {!showCreate && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowCreate(true)}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-blue-500 hover:text-blue-700 transition-all min-h-[180px] bg-white/30 hover:bg-white/50"
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-semibold">New Project</span>
              </motion.button>
            )}

            {showCreate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/70 backdrop-blur-md border-2 border-blue-300 rounded-2xl p-6 flex flex-col gap-3 min-h-[180px]"
              >
                <label className="text-sm font-semibold text-gray-800">Project Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="e.g. Acme Corp 2025"
                />
                <div className="flex gap-2 mt-auto">
                  <button onClick={handleCreate} disabled={!newName.trim() || creating}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all">
                    {creating ? 'Creating…' : 'Create & Start'}
                  </button>
                  <button onClick={() => { setShowCreate(false); setNewName(''); }}
                    className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => { setShowLoginModal(false); handleCreate(); }}
      />
    </div>
  );
}
