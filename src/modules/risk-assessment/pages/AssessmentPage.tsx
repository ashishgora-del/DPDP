import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Save, Shield, AlertCircle, FolderOpen, CheckCircle2 } from 'lucide-react';
import { QUESTIONNAIRE_STEPS } from '../lib/questionnaire-config';
import { QuestionnaireAnswers } from '../types';
import { saveProgress, loadProgress, clearProgress } from '../lib/storage';
import { useSubmitAssessment, useProjects } from '../hooks/useAssessment';
import { SubmitAssessmentRequest, createProject } from '../api';
import { LoginModal } from '../../../shared/auth/LoginModal';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Step 0 = project naming, steps 1..N = questionnaire
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [orgName, setOrgName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [projectMode, setProjectMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const { submit, submitting, error: submitError } = useSubmitAssessment();
  const { projects: existingProjects, loading: projectsLoading } = useProjects();

  // Pre-fill project name if passed via query param (e.g. ?project=...)
  useEffect(() => {
    const nameParam = searchParams.get('project');
    if (nameParam) setProjectName(decodeURIComponent(nameParam));
  }, [searchParams]);

  // Load saved progress from localStorage — only restore questionnaire answers,
  // never skip Step 0 (user must always name/select a project on each visit)
  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      setAnswers(saved.answers || {});
      setOrgName(saved.orgName || '');
      setEmail(saved.email || '');
      // Always start at Step 0 so the user consciously picks/creates a project
    }
  }, []);

  // Save progress to localStorage (only once we've passed the naming step)
  useEffect(() => {
    if (currentStep > 0) {
      saveProgress({ answers, orgName, email, currentStep });
    }
  }, [answers, orgName, email, currentStep]);

  const currentStepData = QUESTIONNAIRE_STEPS.find((s) => s.step === currentStep);
  const progress = currentStep === 0 ? 0 : (currentStep / QUESTIONNAIRE_STEPS.length) * 100;
  const selectedProject = existingProjects.find(p => p.id === selectedExistingId) ?? null;

  // ---- Step 0: select or create project then advance to step 1 ----
  const handleStartAssessment = async () => {
    if (projectMode === 'existing') {
      if (!selectedExistingId) return;
      setProjectId(selectedExistingId);
      const proj = existingProjects.find(p => p.id === selectedExistingId);
      if (proj) setProjectName(proj.name);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // new project
    if (!projectName.trim()) return;
    setCreatingProject(true);
    try {
      const proj = await createProject(projectName.trim());
      setProjectId(proj.id);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowLoginModal(true);
      } else {
        alert(err.response?.data?.message || 'Could not create project. Please try again.');
      }
    } finally {
      setCreatingProject(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId: string, value: string) => {
    const currentValue = answers[questionId as keyof QuestionnaireAnswers] || '';
    const values = currentValue ? currentValue.split(',').filter(v => v) : [];
    
    if (values.includes(value)) {
      const newValues = values.filter((v) => v !== value);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: newValues.join(','),
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: [...values, value].join(','),
      }));
    }
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    if (currentStep === 1 && !orgName.trim()) return false;
    
    return currentStepData.questions.every((q) => {
      const answer = answers[q.id as keyof QuestionnaireAnswers];
      return answer && answer.length > 0;
    });
  };

  const handleNext = () => {
    if (currentStep < QUESTIONNAIRE_STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!orgName.trim()) {
      alert('Please enter your organization name');
      return;
    }

    if (!canProceed()) {
      alert('Please answer all questions before submitting');
      return;
    }
    
    try {
      // Prepare data for backend API
      const assessmentData: SubmitAssessmentRequest = {
        orgName: orgName.trim(),
        email: email.trim() || undefined,
        projectId: projectId ?? undefined,
        q1_orgProfile: answers.q1_orgProfile || '',
        q2_geography: answers.q2_geography || '',
        q3_dataPrincipals: answers.q3_dataPrincipals || '',
        q4_largeScale: answers.q4_largeScale || '',
        q5_dataTypes: answers.q5_dataTypes || '',
        q6_purposes: answers.q6_purposes || '',
        q7_aiUse: answers.q7_aiUse || '',
        q8_vendors: answers.q8_vendors || '',
        q9_crossBorder: answers.q9_crossBorder || '',
        q10_volume: answers.q10_volume || '',
      };
      
      // Submit to backend
      const result = await submit(assessmentData);
      
      // Clear progress from localStorage
      clearProgress();
      
      // Navigate to results with assessment ID
      navigate(`/risk-assessment/results/${result.id}`);
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Check if it's an authentication error (401)
      if (error.response?.status === 401) {
        // Show login modal instead of alert
        setShowLoginModal(true);
      } else {
        alert(error.message || 'Failed to submit assessment. Please try again.');
      }
    }
  };

  if (currentStep > 0 && !currentStepData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // ============================================================
  // STEP 0 – Name Your Project
  // ============================================================
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} />
          <motion.div className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" animate={{ x: [0, -30, 0], y: [0, 50, 0] }} transition={{ duration: 15, repeat: Infinity }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
              Name Your Project
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Give this compliance project a name so you can track it on your dashboard.
            </p>

            <div className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8">

              {/* Mode toggle */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                <button
                  onClick={() => setProjectMode('existing')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    projectMode === 'existing'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Use Existing Project
                </button>
                <button
                  onClick={() => setProjectMode('new')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    projectMode === 'new'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Create New Project
                </button>
              </div>

              {/* ── Existing project picker ── */}
              {projectMode === 'existing' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  {projectsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Loading projects…
                    </div>
                  ) : existingProjects.length === 0 ? (
                    <div className="text-sm text-gray-500 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
                      No projects yet —
                      <button onClick={() => setProjectMode('new')} className="ml-1 text-blue-600 font-semibold underline">
                        create one instead
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {existingProjects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedExistingId(p.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                            selectedExistingId === p.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FolderOpen className={`h-4 w-4 flex-shrink-0 ${
                              selectedExistingId === p.id ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                              {p.riskTier && (
                                <p className="text-xs text-gray-400">{p.riskTier} risk</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.latestAssessmentId ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" /> Assessed
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not assessed</span>
                            )}
                            {selectedExistingId === p.id && (
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Status callout */}
                  {selectedProject?.latestAssessmentId ? (
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-900">This project already has a completed assessment</p>
                          {selectedProject.riskTier && (
                            <p className="text-xs text-amber-700 mt-0.5">
                              Risk level: <span className="font-bold">{selectedProject.riskTier}</span>
                              {selectedProject.templatesGenerated > 0 && ` · ${selectedProject.templatesGenerated} template${selectedProject.templatesGenerated !== 1 ? 's' : ''} generated`}
                            </p>
                          )}
                          <button
                            onClick={() => navigate(`/risk-assessment/results/${selectedProject.latestAssessmentId}`)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline hover:text-amber-900 transition-colors"
                          >
                            View existing results →
                          </button>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs text-amber-600 border-t border-amber-200 pt-2">
                        You can still run a new assessment below — it will be added to this project's history.
                      </p>
                    </div>
                  ) : selectedExistingId ? (
                    <p className="text-xs text-gray-500 mt-3">
                      This project has no assessments yet. Click Start Assessment to begin.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-3">
                      Select a project above, or{' '}
                      <button onClick={() => setProjectMode('new')} className="text-blue-600 font-semibold underline">
                        create a new one
                      </button>.
                    </p>
                  )}
                </div>
              )}

              {/* ── New project input ── */}
              {projectMode === 'new' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && projectName.trim()) handleStartAssessment(); }}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="e.g. Acme Corp DPDPA 2025"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This appears on your Projects dashboard. You can always find it later.
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartAssessment}
                disabled={
                  creatingProject ||
                  (projectMode === 'new' && !projectName.trim()) ||
                  (projectMode === 'existing' && !selectedExistingId)
                }
                className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingProject
                  ? 'Creating project…'
                  : projectMode === 'existing' && selectedProject?.latestAssessmentId
                    ? 'Run New Assessment'
                    : 'Start Assessment'}
                <ChevronRight className="h-5 w-5 ml-2" />
              </motion.button>

              <button
                onClick={() => navigate('/projects')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Projects
              </button>
            </div>
          </motion.div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => { setShowLoginModal(false); handleStartAssessment(); }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      {/* Header with Progress */}
      <div className="bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">DPDPA Risk Assessment</h1>
                {projectName && (
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />{projectName}
                  </p>
                )}
              </div>
            </div>
            <span className="text-sm font-semibold px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-md">
              Step {currentStep} of {QUESTIONNAIRE_STEPS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200/50 rounded-full h-3 shadow-inner">
            <motion.div
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Organization Info (Step 1 only) */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text mb-4">
              Before we begin...
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Enter your organization name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-600 mt-2 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                  💡 Optional: For saving and retrieving your assessment later
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Submission Error</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </motion.div>
        )}

        {/* Current Step Questions */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6 md:p-8 mb-6"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 mb-8">{currentStepData.subtitle}</p>

          <div className="space-y-8">
            {currentStepData.questions.map((question) => (
              <div key={question.id} className="border-b border-gray-200/50 pb-6 last:border-0">
                <label className="block text-base font-bold text-gray-900 mb-2">
                  {question.text}
                </label>
                {question.helpText && (
                  <p className="text-sm text-gray-600 mb-4 bg-blue-50 px-3 py-2 rounded-lg">{question.helpText}</p>
                )}

                <div className="space-y-2">
                  {question.type === 'radio' &&
                    question.options.map((option) => (
                      <motion.label
                        key={option.value}
                        whileHover={{ scale: 1.01, x: 5 }}
                        className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 bg-white/50"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={answers[question.id as keyof QuestionnaireAnswers] === option.value}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </motion.label>
                    ))}

                  {question.type === 'checkbox' &&
                    question.options.map((option) => {
                      const currentValue = answers[question.id as keyof QuestionnaireAnswers] || '';
                      const values = currentValue ? currentValue.split(',').filter(v => v) : [];
                      const isChecked = values.includes(option.value);

                      return (
                        <motion.label
                          key={option.value}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 bg-white/50"
                        >
                          <input
                            type="checkbox"
                            value={option.value}
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(question.id, option.value)}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        </motion.label>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="inline-flex items-center px-5 py-3 text-sm font-bold rounded-xl text-gray-700 bg-white/80 backdrop-blur-md border-2 border-gray-300 hover:bg-white hover:border-gray-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </motion.button>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => saveProgress({ answers, orgName, email, currentStep })}
              className="inline-flex items-center px-5 py-3 text-sm font-bold rounded-xl text-gray-700 bg-white/80 backdrop-blur-md border-2 border-gray-300 hover:bg-white hover:text-gray-900 transition-all shadow-lg"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Progress
            </motion.button>

            {currentStep < QUESTIONNAIRE_STEPS.length ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
                <ChevronRight className="h-5 w-5 ml-2" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // After successful login, retry submission
          setShowLoginModal(false);
          handleSubmit();
        }}
      />
    </div>
  );
}
