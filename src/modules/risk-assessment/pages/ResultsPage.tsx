import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, CheckCircle, AlertTriangle, AlertCircle, ArrowLeft, Download, Share2, FileText, FolderOpen, Layers } from 'lucide-react';
import { useAssessment } from '../hooks/useAssessment';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Breadcrumbs } from '../../../shared/components';
import { useAuth } from '../../../shared/auth/AuthContext';

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const { assessment, loading, error } = useAssessment(id || '');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'mandatory' | 'recommended'>('all');

  // Show loading while auth is initializing
  if (authLoading) {
    return <LoadingState fullScreen message="Loading..." />;
  }

  if (loading) {
    return <LoadingState fullScreen message="Loading assessment results..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 border border-gray-100 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Assessment</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/risk-assessment')}
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base text-gray-900 mb-4 font-semibold">Assessment not found</p>
          <button
            onClick={() => navigate('/risk-assessment')}
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  const legacyGroups = assessment.templateGroups || [];
  const parentGroups = assessment.mapping?.selectedParents ?? legacyGroups.map((group) => ({
    parentId: group.parentCategory,
    parentName: group.parentCategory,
    selectionReason: '',
    children: group.children.map((child) => ({
      templateId: child.artifactId,
      templateName: child.name,
      applicability: child.applicability || (child.mandatory ? 'mandatory' as const : 'recommended' as const),
      reasonCodes: child.reasonCodes || [],
    })),
  }));
  const visibleParentGroups = parentGroups
    .map((parent) => ({
      ...parent,
      children: parent.children.filter((child) =>
        templateFilter === 'all' || child.applicability === templateFilter,
      ),
    }))
    .filter((parent) => parent.children.length > 0);
  const mappingCounts = assessment.mapping?.summaryCounts ?? {
    parentCount: parentGroups.length,
    childCount: parentGroups.reduce((count, parent) => count + parent.children.length, 0),
    mandatoryCount: parentGroups.reduce((count, parent) => count + parent.children.filter(child => child.applicability === 'mandatory').length, 0),
    recommendedCount: parentGroups.reduce((count, parent) => count + parent.children.filter(child => child.applicability === 'recommended').length, 0),
  };

  const getRiskTierColor = () => {
    switch (assessment.riskTier) {
      case 'BASIC':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MODERATE':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'HIGH':
        return 'text-destructive bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getRiskIcon = () => {
    switch (assessment.riskTier) {
      case 'BASIC':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'MODERATE':
        return <AlertTriangle className="h-12 w-12 text-amber-600" />;
      case 'HIGH':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Assessment Results</span>
                {assessment.projectName && (
                  <p
                    className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors mt-0.5"
                    onClick={() => navigate('/projects')}
                  >
                    <FolderOpen className="h-3 w-3" />
                    {assessment.projectName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(assessment.projectId ? '/projects' : '/')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {assessment.projectId ? 'Back to Projects' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {assessment.orgName}
          </h1>
          <p className="text-gray-600">
            Assessment completed on {new Date(assessment.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Risk Tier Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`p-8 rounded-lg border-2 mb-6 shadow-xl ${getRiskTierColor()}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {getRiskIcon()}
                <h2 className="text-2xl font-bold">
                  {assessment.riskTier} RISK
                </h2>
              </div>
              <p className="text-base opacity-90">
                Your organization has been assessed as <strong>{assessment.riskTier.toLowerCase()} risk</strong> for DPDPA compliance
              </p>
              {typeof assessment.normalizedScore === 'number' && (
                <p className="text-sm opacity-80 mt-1">
                  Normalized Score: <strong>{assessment.normalizedScore}</strong>/100
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* SDF Flag */}
        {assessment.sdfFlag && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6 mb-6 shadow-lg"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-purple-900 mb-2">
                  Significant Data Fiduciary (SDF) Status
                </h3>
                <p className="text-sm text-purple-800 leading-relaxed">
                  Your organization may qualify as a Significant Data Fiduciary under DPDPA due to large-scale processing. 
                  This requires additional compliance obligations including Data Protection Impact Assessments (DPIAs) and 
                  appointment of a Data Protection Officer (DPO).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Risk Drivers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Risk Drivers
            </h3>
            {assessment.riskDrivers.length > 0 ? (
              <ul className="space-y-3">
                {assessment.riskDrivers.map((driver, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{driver}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No specific risk drivers identified.</p>
            )}
          </motion.div>

          {/* Focus Areas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Focus Areas for Compliance
            </h3>
            {assessment.focusAreas.length > 0 ? (
              <div className="space-y-2">
                {assessment.focusAreas.map((area, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm"
                  >
                    <p className="text-sm text-gray-700">{area}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No specific focus areas identified</p>
            )}
          </motion.div>
        </div>

        {/* Parent -> required template mapping (risk-assessment driven) */}
        {!!parentGroups.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-indigo-600" />
              Template Recommendations
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Mapping version {assessment.mapping?.mappingVersion || 'legacy'} · {mappingCounts.parentCount} parent categories · {mappingCounts.childCount} templates
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filter templates by applicability">
              {(['all', 'mandatory', 'recommended'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={templateFilter === filter}
                  onClick={() => setTemplateFilter(filter)}
                  className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${templateFilter === filter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {filter === 'all' ? `All (${mappingCounts.childCount})` : filter === 'mandatory' ? `Mandatory (${mappingCounts.mandatoryCount})` : `Recommended (${mappingCounts.recommendedCount})`}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {visibleParentGroups.map((parent) => (
                <details key={parent.parentId} open className="border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer list-none px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-3">
                    <span>
                      <span className="block font-semibold text-indigo-900">{parent.parentName}</span>
                      <span className="block text-xs text-indigo-700 mt-0.5">
                        {parent.selectionReason || `${parent.children.length} applicable template${parent.children.length === 1 ? '' : 's'}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs shrink-0">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                        Mandatory: {parent.children.filter(child => child.applicability === 'mandatory').length}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        Recommended: {parent.children.filter(child => child.applicability === 'recommended').length}
                      </span>
                    </span>
                  </summary>

                  <div className="divide-y divide-gray-100">
                    {parent.children.map((child) => {
                      const detail = legacyGroups.flatMap(group => group.children).find(item => item.artifactId === child.templateId);
                      return (
                        <div key={child.templateId} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{child.templateName}</p>
                              {detail?.description && <p className="text-xs text-gray-600 mt-1">{detail.description}</p>}
                              {!!child.reasonCodes.length && (
                                <p className="text-xs text-indigo-700 mt-1" title={child.reasonCodes.join(', ')}>
                                  Reason: {child.reasonCodes.map(code => code.toLowerCase().replaceAll('_', ' ')).join(', ')}
                                </p>
                              )}
                              {!!detail?.matchReasons?.length && (
                                <p className="text-xs text-indigo-700 mt-1">Matched focus areas: {detail.matchReasons.join(', ')}</p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${child.applicability === 'mandatory' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {child.applicability === 'mandatory' ? 'Mandatory' : 'Recommended'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Items Section */}
        <div className="space-y-4">
          {/* Primary Actions - Template Generation */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Next Steps: Generate Compliance Documents
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Based on your {assessment.riskTier.toLowerCase()} risk profile, select and prepare tailored compliance documents
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/template-generation/workbench?assessmentId=${id}`, {
                  state: { selectedTemplateIds: parentGroups.flatMap(parent => parent.children.map(child => child.templateId)) },
                })}
                className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="h-5 w-5 mr-2" />
                Open Policy Workbench
              </button>
              {assessment.projectId && (
                <button
                  onClick={() => navigate('/projects')}
                  className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-lg text-purple-700 bg-white border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-all shadow-md"
                >
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Back to Project Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </button>
            <button
              onClick={() => navigate('/risk-assessment')}
              className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
