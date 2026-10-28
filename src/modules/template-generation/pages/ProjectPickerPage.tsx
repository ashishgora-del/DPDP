import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FileText, FolderOpen, ArrowRight, AlertCircle,
  CheckCircle, TrendingUp, Shield, Loader2, Plus,
} from 'lucide-react';
import { useProjects } from '../../risk-assessment/hooks/useAssessment';
import { useAuth } from '../../../shared/auth/AuthContext';
import { useEffect } from 'react';

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

export default function ProjectPickerPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { projects, loading, error } = useProjects();

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/learning-platform/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const ready   = projects.filter(p => p.latestAssessmentId !== null);
  const pending = projects.filter(p => p.latestAssessmentId === null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">Policy Workbench</span>
              <p className="text-xs text-gray-500 mt-0.5">Select a project to open its document workbench</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1.5"
          >
            <FolderOpen className="h-4 w-4" />
            All Projects
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/40 rounded-2xl border border-white/20 p-6 h-44 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty: no projects at all */}
        {!loading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Start a risk assessment first. A project will be created automatically, and you can open the workbench once it's complete.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/risk-assessment')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Shield className="h-5 w-5" />
              Start Risk Assessment
            </motion.button>
          </motion.div>
        )}

        {/* Projects with completed assessments */}
        {!loading && ready.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Ready — assessment completed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ready.map((project, idx) => {
                const TierIcon = project.riskTier ? TIER_ICONS[project.riskTier] : Shield;
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    onClick={() => navigate(`/template-generation/workbench?assessmentId=${project.latestAssessmentId}`)}
                    className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col overflow-hidden group"
                  >
                    <div className="p-5 flex-1">
                      {/* Project icon + name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0">
                          <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                            {project.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {project.templatesGenerated} doc{project.templatesGenerated !== 1 ? 's' : ''} generated
                          </p>
                        </div>
                      </div>

                      {/* Risk tier */}
                      {project.riskTier && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${TIER_COLORS[project.riskTier]}`}>
                          <TierIcon className="h-3.5 w-3.5" />
                          {project.riskTier} Risk
                        </span>
                      )}
                    </div>

                    {/* Footer CTA */}
                    <div className="border-t border-gray-100/60 px-5 py-3 bg-white/40 flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-700 group-hover:text-purple-900 transition-colors">
                        Open Workbench
                      </span>
                      <motion.span
                        className="text-purple-500"
                        animate={{ x: 0 }}
                        whileHover={{ x: 4 }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects without assessment */}
        {!loading && pending.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Pending — run assessment first
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pending.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col gap-4 opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-600 text-sm truncate">{project.name}</h3>
                      <span className="text-xs text-gray-400">No assessment yet</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/risk-assessment/start?project=${encodeURIComponent(project.name)}`)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-blue-700 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Run Assessment
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* If all projects have assessments but user wants a new one */}
        {!loading && projects.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/risk-assessment')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Start a new assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
