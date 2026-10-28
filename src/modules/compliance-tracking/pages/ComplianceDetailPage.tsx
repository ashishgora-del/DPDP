import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkComplianceEligibility } from '../api';
import { getProject, getAssessment } from '../../risk-assessment/api';
import type { AssessmentDetail } from '../../risk-assessment/api';
import { ErrorState } from '../components/EmptyState';
import { ProjectProgressHeader } from '../components/ProjectProgressHeader';
import { ChecklistSection } from '../components/ChecklistSection';
import { ComplianceStats } from '../components/ComplianceStats';

interface ProjectData {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Main Compliance Tracking Page
 * Shows project progress, checklist, stats, and attachments
 * 
 * Phase 5 implementation with Stats & Analytics
 */
export default function ComplianceDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Validation: redirect if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/compliance-tracking', { replace: true });
      return;
    }

    // Check eligibility
    const checkEligibility = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await checkComplianceEligibility(projectId);
        setEligibility(result);
        
        if (!result.eligible && result.reason) {
          // Show warning but allow viewing in read-only mode
          setWarning(result.reason);
        }

        // Fetch project and assessment data
        const projectData = await getProject(projectId);
        setProject(projectData);

        // Find latest assessment for this project
        if (projectData) {
          // Get projects list to find assessment ID (since project doesn't directly store it)
          const { getProjects } = await import('../../risk-assessment/api');
          const projects = await getProjects();
          const currentProject = projects.find(p => p.id === projectId);
          
          if (currentProject?.latestAssessmentId) {
            const assessmentData = await getAssessment(currentProject.latestAssessmentId);
            setAssessment(assessmentData);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Project not found - redirect to selector
          setError('Project not found');
          setTimeout(() => navigate('/compliance-tracking', { replace: true }), 2000);
        } else if (err.response?.status === 403) {
          // Access denied - redirect
          setError('You do not have access to this project');
          setTimeout(() => navigate('/compliance-tracking', { replace: true }), 2000);
        } else {
          // Other errors - show error state with retry
          setError('Failed to load project. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [projectId, navigate]);

  // Retry function
  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Compliance Tracker...
          </h2>
          <p className="text-gray-600">
            Validating access and checking requirements
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <ErrorState error={error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

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
        {/* Navigation Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/compliance-tracking')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 text-gray-700 rounded-lg hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
            title="Back to Compliance Tracking"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 text-gray-700 rounded-lg hover:bg-white/90 transition-all shadow-sm hover:shadow-md"
            title="Go to Home"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>

        {/* Warning banner if not fully eligible */}
        {warning && (
          <div className="mb-6 bg-yellow-50/70 backdrop-blur-md border border-yellow-200/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">{warning}</p>
                <p className="text-sm text-yellow-700">
                  You can view this page but some features may be limited.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Header */}
        {project && assessment && eligibility && (
          <ProjectProgressHeader
            project={project}
            assessment={{
              orgName: assessment.orgName,
              riskTier: assessment.riskTier,
              q2_geography: assessment.q2_geography,
            }}
            templateCount={eligibility.templateCount || 0}
          />
        )}

        {/* Compliance Stats */}
        {project && (
          <div className="my-6">
            <ComplianceStats checkedItems={checkedItems} />
          </div>
        )}

        {/* Checklist Section */}
        {project && eligibility && (
          <ChecklistSection 
            projectId={project.id}
            checkedItems={checkedItems}
            onCheckedItemsChange={setCheckedItems}
          />
        )}
      </div>
    </div>
  );
}
