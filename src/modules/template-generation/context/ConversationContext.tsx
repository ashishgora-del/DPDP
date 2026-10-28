import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  ConversationState,
  ConversationStatus,
  ChatMessage,
  TemplateField,
  CurrentSection,
  ConversationProgress,
  ConversationAnswers,
  ConversationContext as ConvContext,
  SectionUpdate,
  SectionSummary,
} from '../types/conversation';

// ─── Context Types ───────────────────────────────────────────────────────────

interface ConversationContextValue {
  // State
  state: ConversationState;
  
  // Mode toggle
  isAIMode: boolean;
  toggleAIMode: () => void;
  
  // Conversation management
  initializeConversation: (conversationId: string, context: ConvContext) => void;
  addMessage: (message: ChatMessage) => void;
  updateProgress: (progress: ConversationProgress) => void;
  setNextField: (field: TemplateField | null) => void;
  setCurrentSection: (section: CurrentSection) => void;
  addAnswer: (sectionId: string, fieldId: string, value: any) => void;
  completeSection: (sectionId: string) => void;
  setStatus: (status: ConversationStatus) => void;
  updateSectionInDocument: (update: SectionUpdate) => void;
  /** Set the full ordered list of template sections (populated on conversation start) */
  setSections: (sections: SectionSummary[]) => void;
  /** Initialise completed sections (used when resuming a prior conversation) */
  setCompletedSections: (sectionIds: string[]) => void;
  /** Remove a section from completedSections (used when jumping back to re-edit it) */
  uncompleteSection: (sectionId: string) => void;
  
  // Reset
  resetConversation: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: ConversationState = {
  conversationId: null,
  status: 'active',
  currentSection: null,
  completedSections: [],
  sections: [],
  messages: [],
  answers: {},
  progress: {
    currentSection: 0,
    totalSections: 0,
    sectionFieldsCompleted: 0,
    sectionFieldsTotal: 0,
    overallPercentage: 0,
  },
  context: null,
  nextField: null,
};

// ─── Context ─────────────────────────────────────────────────────────────────

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConversationState>(initialState);
  const [isAIMode, setIsAIMode] = useState(false);

  const toggleAIMode = useCallback(() => {
    setIsAIMode((prev) => !prev);
  }, []);

  const initializeConversation = useCallback(
    (conversationId: string, context: ConvContext) => {
      setState((prev) => ({
        ...prev,
        conversationId,
        context,
        status: 'active',
      }));
    },
    []
  );

  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const updateProgress = useCallback((progress: ConversationProgress) => {
    setState((prev) => ({
      ...prev,
      progress,
    }));
  }, []);

  const setNextField = useCallback((field: TemplateField | null) => {
    setState((prev) => ({
      ...prev,
      nextField: field,
    }));
  }, []);

  const setCurrentSection = useCallback((section: CurrentSection) => {
    setState((prev) => ({
      ...prev,
      currentSection: section,
    }));
  }, []);

  const addAnswer = useCallback((sectionId: string, fieldId: string, value: any) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [sectionId]: {
          ...(prev.answers[sectionId] || {}),
          [fieldId]: value,
        },
      },
    }));
  }, []);

  const completeSection = useCallback((sectionId: string) => {
    setState((prev) => ({
      ...prev,
      completedSections: [...prev.completedSections, sectionId],
    }));
  }, []);

  const setStatus = useCallback((status: ConversationStatus) => {
    setState((prev) => ({
      ...prev,
      status,
    }));
  }, []);

  const setSections = useCallback((sections: SectionSummary[]) => {
    setState((prev) => ({ ...prev, sections }));
  }, []);

  const setCompletedSections = useCallback((sectionIds: string[]) => {
    setState((prev) => ({ ...prev, completedSections: sectionIds }));
  }, []);

  const uncompleteSection = useCallback((sectionId: string) => {
    setState((prev) => ({
      ...prev,
      completedSections: prev.completedSections.filter(id => id !== sectionId),
    }));
  }, []);

  const updateSectionInDocument = useCallback((update: SectionUpdate) => {
    // This will be handled by parent component (DocumentEditorPage)
    // We just store it in a callback
    console.log('Section update:', update);
  }, []);

  const resetConversation = useCallback(() => {
    setState(initialState);
    setIsAIMode(false);
  }, []);

  const value: ConversationContextValue = {
    state,
    isAIMode,
    toggleAIMode,
    initializeConversation,
    addMessage,
    updateProgress,
    setNextField,
    setCurrentSection,
    addAnswer,
    completeSection,
    setStatus,
    updateSectionInDocument,
    setSections,
    setCompletedSections,
    uncompleteSection,
    resetConversation,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
}
