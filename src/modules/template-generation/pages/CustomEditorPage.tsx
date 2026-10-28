import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Breadcrumbs } from '../../../shared/components';
import { Sparkles, ArrowLeft, AlertCircle, Loader, Shield } from 'lucide-react';
import { useGenerateCustom } from '../hooks/useTemplates';
import { useAssessment } from '../../risk-assessment/hooks/useAssessment';

export default function CustomEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId');

  const [prompt, setPrompt] = useState('');
  const [orgName, setOrgName] = useState('');

  const { assessment } = useAssessment(assessmentId || '');
  const { generate, generating, error } = useGenerateCustom();

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 20) {
      alert('Please enter a detailed prompt (at least 20 characters)');
      return;
    }

    if (!orgName.trim()) {
      alert('Please enter your organization name');
      return;
    }

    try {
      const document = await generate({
        prompt: prompt.trim(),
        assessmentId: assessmentId || undefined,
        orgName: orgName.trim(),
      });

      navigate(`/template-generation/editor/${document.id}`);
    } catch (error: any) {
      console.error('Generation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Breadcrumbs className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Custom AI Document Generator</h1>
                <p className="text-sm text-gray-600">Describe your document needs</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Context */}
        {assessment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-6 shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Context from Assessment</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Organization: <span className="font-semibold">{assessment.orgName}</span> • 
                  Risk Tier: <span className="font-semibold">{assessment.riskTier}</span>
                  {assessment.sdfFlag && ' • SDF'}
                </p>
                {assessment.focusAreas.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Focus: {assessment.focusAreas.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Generation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
        >
          {/* Organization Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Organization Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={assessment?.orgName || 'Enter your organization name'}
              disabled={generating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Document Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the document you need... For example:&#10;&#10;'Generate a DPDPA-compliant privacy notice for a mobile health app that collects patient vital signs, medication schedules, and doctor consultations.'&#10;&#10;Be specific about:&#10;- Type of document (privacy notice, policy, procedure, etc.)&#10;- Your business context&#10;- Data types involved&#10;- Specific requirements or concerns"
              rows={12}
              disabled={generating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Minimum 20 characters • Be as detailed as possible
              </p>
              <p className={`text-xs ${prompt.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {prompt.length} / 20
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">Generation Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Helpful Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">💡 Tips for Best Results</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Be specific about the type of document you need</li>
              <li>• Mention your industry or sector if relevant</li>
              <li>• Include specific DPDPA requirements or concerns</li>
              <li>• The AI will use your risk assessment context automatically</li>
            </ul>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: generating ? 1 : 1.02 }}
              whileTap={{ scale: generating ? 1 : 0.98 }}
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || prompt.length < 20 || !orgName.trim()}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-bold rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md"
            >
              {generating ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Document
                </>
              )}
            </motion.button>
          </div>

          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Generating your document...</p>
                  <p className="text-xs text-blue-700 mt-1">
                    This may take 10-30 seconds depending on document complexity
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-3">Example Prompts</h3>
          <div className="space-y-3">
            {[
              'Generate a DPIA for an AI-powered recruitment system that analyzes candidate resumes and conducts video interview assessments',
              'Create a data breach response procedure specific to healthcare organizations handling patient medical records',
              'Draft a cross-border data transfer agreement for sharing employee data with our EU-based payroll processor',
              'Develop a consent management policy for an e-commerce platform collecting customer payment and delivery information',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                disabled={generating}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-700 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
