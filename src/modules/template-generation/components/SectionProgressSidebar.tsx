import React, { useState, useEffect } from 'react';
import { useConversation } from '../context/ConversationContext';
import type { TemplateSection } from '../types/conversation';
import { CheckCircle, Circle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import * as api from '../api';

interface SectionProgressSidebarProps {
  templateId: string;
}

export function SectionProgressSidebar({ templateId }: SectionProgressSidebarProps) {
  const { state } = useConversation();
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Load template structure
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const template = await api.getTemplateStructure(templateId);
        setSections(template.sections as any); // Type assertion needed due to API response structure
        
        // Auto-expand current section
        if (state.currentSection) {
          setExpandedSections(new Set([state.currentSection.sectionId]));
        }
      } catch (err) {
        console.error('Failed to load template structure:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Auto-expand current section when it changes
  useEffect(() => {
    if (state.currentSection) {
      setExpandedSections((prev) => new Set([...prev, state.currentSection!.sectionId]));
    }
  }, [state.currentSection?.sectionId]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Get section status
  const getSectionStatus = (sectionId: string): 'completed' | 'in-progress' | 'not-started' => {
    if (state.completedSections.includes(sectionId)) {
      return 'completed';
    }
    if (state.currentSection?.sectionId === sectionId) {
      return 'in-progress';
    }
    return 'not-started';
  };

  // Get section icon
  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  // Calculate field progress for a section
  const getSectionFieldProgress = (sectionId: string): { completed: number; total: number } => {
    const section = sections.find((s) => s.sectionId === sectionId);
    if (!section || !section.fields || section.fields.length === 0) {
      return { completed: 0, total: 0 };
    }

    const answers = state.answers[sectionId] || {};
    const completed = Object.keys(answers).length;
    const total = section.fields.length;

    return { completed, total };
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900">Sections</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {state.completedSections.length} of {sections.length} completed
        </p>
      </div>

      {/* Overall Progress */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <span>Overall Progress</span>
          <span className="font-semibold">{state.progress.overallPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${state.progress.overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const status = getSectionStatus(section.sectionId);
          const isExpanded = expandedSections.has(section.sectionId);
          const fieldProgress = getSectionFieldProgress(section.sectionId);

          return (
            <div
              key={section.sectionId}
              className={`
                border-b border-gray-200
                ${status === 'in-progress' ? 'bg-blue-50' : 'bg-white'}
                ${status === 'completed' ? 'bg-green-50/30' : ''}
              `}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.sectionId)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-100/50 transition-colors"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getSectionIcon(status)}
                </div>

                {/* Section Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{section.emoji}</span>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {section.title}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {section.description}
                  </p>

                  {/* Field Progress */}
                  {status !== 'not-started' && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${fieldProgress.total > 0 
                              ? (fieldProgress.completed / fieldProgress.total) * 100 
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {fieldProgress.completed}/{fieldProgress.total}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Fields List */}
              {isExpanded && section.fields && section.fields.length > 0 && (
                <div className="px-4 pb-3 pl-12 space-y-2">
                  {section.fields.map((field) => {
                    const isAnswered = state.answers[section.sectionId]?.[field.fieldId] !== undefined;
                    const isCurrent = 
                      state.currentSection?.sectionId === section.sectionId &&
                      state.nextField?.fieldId === field.fieldId;

                    return (
                      <div
                        key={field.fieldId}
                        className={`
                          flex items-start gap-2 text-xs
                          ${isCurrent ? 'text-blue-700 font-medium' : ''}
                          ${isAnswered ? 'text-gray-600' : 'text-gray-400'}
                        `}
                      >
                        {isAnswered ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="line-clamp-2">{field.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
