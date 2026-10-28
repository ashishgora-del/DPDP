import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjects } from '../../risk-assessment/hooks/useAssessment';

/**
 * Project Selector for Compliance Tracking
 * Shows list of eligible projects (those with templates generated)
 * Handles auto-navigation when coming from template generation
 */
export default function ComplianceProjectSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, loading, error } = useProjects();

  // Check if coming from template generation with project context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('projectId');
    
    if (projectId) {
      // Auto-navigate to compliance for that project
      navigate(`/compliance-tracking/${projectId}`, { replace: true });
    }
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl">
          <p className="text-red-600 mb-4 font-medium">Failed to load projects</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter projects that have templates generated
  const eligibleProjects = projects.filter(p => p.templatesGenerated > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="mb-8 bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Compliance Tracking
              </h1>
              <p className="text-gray-600">
                Track your DPDPA compliance progress for projects
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 text-gray-700 rounded-lg hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
              title="Go to Home"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>

        {eligibleProjects.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Projects Ready
              </h3>
              <p className="text-gray-600 mb-6">
                Complete template generation for a project first to access compliance tracking
              </p>
              <button
                onClick={() => navigate('/projects')}
                className="px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Go to Projects
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eligibleProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all p-6 cursor-pointer hover:scale-105 transform duration-300"
                onClick={() => navigate(`/compliance-tracking/${project.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {project.name}
                </h3>
                <div className="space-y-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                    <span className="font-medium">Templates:</span>
                    <span className="font-bold text-blue-600">{project.templatesGenerated}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                    <span className="font-medium">Created:</span>
                    <span className="text-gray-700">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/compliance-tracking/${project.id}`);
                  }}
                >
                  Continue to Compliance →
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
