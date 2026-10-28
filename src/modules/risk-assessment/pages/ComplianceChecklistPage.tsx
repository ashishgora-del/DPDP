import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen, ArrowLeft, CheckSquare, ChevronDown, ChevronRight,
  AlertCircle, Save, ClipboardList,
} from 'lucide-react';
import { getProject, getProjectChecklist, saveProjectChecklist } from '../api';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from '../../../shared/lib/checklistData';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useAuth } from '../../../shared/auth/AuthContext';

const PRIORITY_BADGE: Record<string, string> = {
  required:    'bg-blue-100 text-blue-700',
  recommended: 'bg-amber-100 text-amber-700',
  'sdf-only':  'bg-purple-100 text-purple-700',
};

const PRIORITY_LABEL: Record<string, string> = {
  required:    'Required',
  recommended: 'Recommended',
  'sdf-only':  'SDF Required',
};

export default function ComplianceChecklistPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { isLoading: authLoading } = useAuth();

  const [projectName,   setProjectName]   = useState('');
  const [loadingData,   setLoadingData]   = useState(true);
  const [checkedItems,  setCheckedItems]  = useState<Set<string>>(new Set());
  const [saving,        setSaving]        = useState(false);
  const [lastSaved,     setLastSaved]     = useState<Date | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set(CHECKLIST_CATEGORIES));

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    Promise.all([getProject(projectId), getProjectChecklist(projectId)])
      .then(([project, checklist]) => {
        setProjectName(project.name);
        setCheckedItems(new Set(checklist.filter(i => i.checked).map(i => i.itemId)));
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load checklist'))
      .finally(() => setLoadingData(false));
  }, [projectId]);

  // ── Save ──────────────────────────────────────────────────────────────
  const scheduleSave = useCallback((nextChecked: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!projectId) return;
      setSaving(true);
      try {
        await saveProjectChecklist(
          projectId,
          CHECKLIST_ITEMS.map(item => ({ itemId: item.id, checked: nextChecked.has(item.id) })),
        );
        setLastSaved(new Date());
      } catch { /* silent */ }
      finally { setSaving(false); }
    }, 600);
  }, [projectId]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      scheduleSave(next);
      return next;
    });
  };

  const toggleAllInCategory = (category: string) => {
    const items = CHECKLIST_ITEMS.filter(i => i.category === category);
    const allChecked = items.every(i => checkedItems.has(i.id));
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (allChecked) items.forEach(i => next.delete(i.id));
      else            items.forEach(i => next.add(i.id));
      scheduleSave(next);
      return next;
    });
  };

  const toggleExpand = (category: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const total     = CHECKLIST_ITEMS.length;
  const checked   = checkedItems.size;
  const progress  = total > 0 ? Math.round((checked / total) * 100) : 0;

  // ── Guards ────────────────────────────────────────────────────────────
  if (authLoading || loadingData) {
    return <LoadingState fullScreen message="Loading compliance checklist…" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: icon + title + project name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Compliance Checklist</span>
                {projectName && (
                  <p
                    className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors mt-0.5"
                    onClick={() => navigate('/projects')}
                  >
                    <FolderOpen className="h-3 w-3" />
                    {projectName}
                  </p>
                )}
              </div>
            </div>

            {/* Right: save indicator + back button */}
            <div className="flex items-center gap-4">
              {saving && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Save className="h-3.5 w-3.5 animate-pulse" />
                  Saving…
                </span>
              )}
              {!saving && lastSaved && (
                <span className="text-xs text-green-600 font-medium">✓ Saved</span>
              )}
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">DPDPA Compliance Progress</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {checked} of {total} items completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text leading-none">
                {progress}%
              </div>
              <p className="text-xs text-gray-500 mt-1">complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* All done banner */}
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
            >
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">All compliance items completed! 🎉</span>
            </motion.div>
          )}
        </motion.div>

        {/* Priority legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">Required</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700">Recommended</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">SDF Required</span>
        </div>

        {/* Category sections */}
        <div className="space-y-4">
          {CHECKLIST_CATEGORIES.map((category, catIdx) => {
            const items      = CHECKLIST_ITEMS.filter(i => i.category === category);
            const catChecked = items.filter(i => checkedItems.has(i.id)).length;
            const allDone    = catChecked === items.length;
            const someDone   = catChecked > 0 && !allDone;
            const isExpanded = expanded.has(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.05 }}
                className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-md overflow-hidden"
              >
                {/* Category header */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/50 transition-colors select-none"
                  onClick={() => toggleExpand(category)}
                >
                  <div className="flex items-center gap-3">
                    {/* "Check all" toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleAllInCategory(category); }}
                      title={allDone ? 'Uncheck all' : 'Check all'}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        allDone  ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-transparent' :
                        someDone ? 'bg-blue-100 border-blue-300' :
                                   'border-gray-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      {allDone  && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {someDone && <span className="text-xs text-blue-700 font-black leading-none">–</span>}
                    </button>

                    <h3 className="font-bold text-gray-900 text-base">{category}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                      {catChecked}/{items.length}
                    </span>
                  </div>

                  {isExpanded
                    ? <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  }
                </div>

                {/* Items */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="items"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100/60">
                        {items.map((item, itemIdx) => {
                          const isChecked = checkedItems.has(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${
                                itemIdx < items.length - 1 ? 'border-b border-gray-100/60' : ''
                              } ${isChecked ? 'bg-green-50/50 hover:bg-green-50/70' : 'hover:bg-blue-50/40'}`}
                            >
                              {/* Checkbox */}
                              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isChecked
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-transparent'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isChecked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>

                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <p className={`text-sm font-semibold leading-snug ${
                                    isChecked ? 'line-through text-gray-400' : 'text-gray-800'
                                  }`}>
                                    {item.title}
                                  </p>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_BADGE[item.priority]}`}>
                                    {PRIORITY_LABEL[item.priority]}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
