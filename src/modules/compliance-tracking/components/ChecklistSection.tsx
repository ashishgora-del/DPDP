import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Circle, CheckCircle2, Loader2 } from 'lucide-react';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES, type ChecklistItem } from '../../../shared/lib/checklistData';
import { getProjectChecklist, saveProjectChecklist } from '../../risk-assessment/api';
import { AttachmentButton } from './AttachmentButton';
import { AttachmentsList } from './AttachmentsList';

interface ChecklistSectionProps {
  projectId: string;
  checkedItems: Set<string>;
  onCheckedItemsChange: (items: Set<string>) => void;
}

const PRIORITY_STYLES = {
  required: 'bg-red-100 text-red-800 border-red-200',
  recommended: 'bg-amber-100 text-amber-800 border-amber-200',
  'sdf-only': 'bg-purple-100 text-purple-800 border-purple-200',
};

/**
 * Reusable Checklist Section Component
 * Shows compliance checklist with auto-save functionality
 */
export function ChecklistSection({ projectId, checkedItems, onCheckedItemsChange }: ChecklistSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CHECKLIST_CATEGORIES)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved checklist state
  useEffect(() => {
    if (!projectId) return;

    getProjectChecklist(projectId)
      .then((items) => {
        const checked = items.filter((i) => i.checked).map((i) => i.itemId);
        onCheckedItemsChange(new Set(checked));
        setLastSaved(new Date());
      })
      .catch((error) => {
        console.error('Failed to load checklist:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  // Debounced save function
  const scheduleSave = useCallback(
    (nextChecked: Set<string>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await saveProjectChecklist(
            projectId,
            CHECKLIST_ITEMS.map((item) => ({
              itemId: item.id,
              checked: nextChecked.has(item.id),
            }))
          );
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save checklist:', error);
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [projectId]
  );

  // Toggle individual item
  const handleToggleItem = (itemId: string) => {
    const next = new Set(checkedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    onCheckedItemsChange(next);
    scheduleSave(next);
  };

  // Toggle all items in a category
  const handleToggleCategory = (category: string) => {
    const categoryItems = CHECKLIST_ITEMS.filter((item) => item.category === category);
    const allChecked = categoryItems.every((item) => checkedItems.has(item.id));

    const next = new Set(checkedItems);
    categoryItems.forEach((item) => {
      if (allChecked) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
    });
    onCheckedItemsChange(next);
    scheduleSave(next);
  };

  // Toggle category expansion
  const toggleExpand = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading checklist...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
      {/* Save Status Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Compliance Checklist
        </h2>
        <div className="text-sm text-gray-500">
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved at {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="divide-y divide-white/20">
        {CHECKLIST_CATEGORIES.map((category) => {
          const categoryItems = CHECKLIST_ITEMS.filter(
            (item) => item.category === category
          );
          const checkedCount = categoryItems.filter((item) =>
            checkedItems.has(item.id)
          ).length;
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="p-6">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm">
                <button
                  onClick={() => toggleExpand(category)}
                  className="flex items-center gap-3 text-left flex-1 group"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  )}
                  <h3 className="text-lg font-bold text-gray-900">
                    {category}
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/80 text-blue-700 border border-blue-200/50 shadow-sm">
                    {checkedCount}/{categoryItems.length}
                  </span>
                </button>
                <button
                  onClick={() => handleToggleCategory(category)}
                  className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm border border-blue-200/50 text-blue-700 rounded-lg hover:bg-blue-50/80 font-medium transition-all shadow-sm hover:shadow-md"
                >
                  {categoryItems.every((item) => checkedItems.has(item.id))
                    ? 'Uncheck All'
                    : 'Check All'}
                </button>
              </div>

              {/* Category Items */}
              {isExpanded && (
                <div className="space-y-4 mt-4">
                  {categoryItems.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      checked={checkedItems.has(item.id)}
                      onToggle={() => handleToggleItem(item.id)}
                      projectId={projectId}
                      refreshTrigger={attachmentRefresh}
                      onUploadSuccess={() => setAttachmentRefresh((prev) => prev + 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual Checklist Item Row
 */
function ChecklistItemRow({
  item,
  checked,
  onToggle,
  projectId,
  refreshTrigger,
  onUploadSuccess,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  projectId: string;
  refreshTrigger: number;
  onUploadSuccess: () => void;
}) {
  return (
    <div className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 group ${
      checked 
        ? 'bg-green-50/40 backdrop-blur-sm border-green-200/50 shadow-sm' 
        : 'bg-white/60 backdrop-blur-sm border-white/40 shadow-md hover:shadow-xl hover:scale-[1.01]'
    }`}>
      <button
        onClick={onToggle}
        className="mt-1 flex-shrink-0 transition-all duration-300 hover:scale-125"
      >
        {checked ? (
          <CheckCircle2 className="h-6 w-6 text-green-600 drop-shadow-sm" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <p
            className={`font-semibold text-base ${
              checked
                ? 'text-gray-500 line-through'
                : 'text-gray-900'
            }`}
          >
            {item.title}
          </p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
              PRIORITY_STYLES[item.priority]
            }`}
          >
            {item.priority === 'sdf-only' ? 'SDF Only' : item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{item.description}</p>

        {/* Attachments Section */}
        <div className="space-y-3 mt-4 pt-4 border-t border-white/30">
          <div className="flex items-center gap-2">
            <AttachmentButton
              checklistItemId={item.id}
              projectId={projectId}
              onUploadSuccess={onUploadSuccess}
            />
          </div>
          <AttachmentsList
            projectId={projectId}
            checklistItemId={item.id}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
