import React, { useEffect, useRef, useState } from 'react';
import { useConversation } from '../context/ConversationContext';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Pause, Play } from 'lucide-react';
import * as api from '../api';

interface ChatPanelProps {
  documentId: string;
  onSectionUpdate?: (sectionId: string, markdown: string) => void;
}

export function ChatPanel({ documentId, onSectionUpdate }: ChatPanelProps) {
  const {
    state,
    addMessage,
    updateProgress,
    setCurrentSection,
    completeSection,
    setStatus,
    uncompleteSection,
  } = useConversation();

  const [currentValue, setCurrentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Submit free-text message (covers multiple fields at once via Python AI extraction)
  const handleSubmit = async () => {
    if (!state.conversationId || !currentValue?.trim() || isSubmitting) return;

    const messageText = currentValue.trim();
    setError(null);
    setIsSubmitting(true);

    // Optimistically add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    });
    setCurrentValue('');

    try {
      const response = await api.submitMessage(state.conversationId, { message: messageText });

      // Add AI response
      addMessage({
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: response.aiMessage.content,
        timestamp: response.aiMessage.timestamp,
        metadata: { type: (response.aiMessage.type as any) || 'question' },
      });

      // Update overall progress
      updateProgress(response.progress);

      // Handle section completion
      if (response.sectionUpdate) {
        completeSection(response.sectionUpdate.sectionId);
        onSectionUpdate?.(response.sectionUpdate.sectionId, response.sectionUpdate.markdown);

        addMessage({
          id: `msg-${Date.now()}-section`,
          role: 'system',
          content: `✅ Section completed and added to document`,
          timestamp: new Date().toISOString(),
        });

        // Update section header when AI transitions to a new section
        if (response.currentSection) {
          setCurrentSection({
            sectionId: response.currentSection.sectionId,
            sectionNumber: response.currentSection.sectionNumber,
            title: response.currentSection.title,
            emoji: response.currentSection.emoji,
            status: 'in-progress',
          });
        }
      }

      // Mark completed ONLY when backend says all sections are done
      if (response.conversationStatus === 'completed') {
        setStatus('completed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send message. Please try again.';
      setError(msg);
      addMessage({
        id: `msg-${Date.now()}-error`,
        role: 'ai',
        content: err.response?.data?.message || 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        metadata: { type: 'error', error: true },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jump to a previously completed section for editing
  const handleJumpToSection = async (sectionId: string) => {
    if (!state.conversationId || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.jumpToSection(state.conversationId, { sectionId });

      // Remove from completed and navigate
      uncompleteSection(sectionId);
      setCurrentSection({
        sectionId: response.currentSection.sectionId,
        sectionNumber: response.currentSection.sectionNumber,
        title: response.currentSection.title,
        emoji: response.currentSection.emoji,
        status: 'in-progress',
      });

      addMessage({
        id: `msg-${Date.now()}-jump`,
        role: 'ai',
        content: response.aiMessage.content,
        timestamp: response.aiMessage.timestamp,
        metadata: { type: (response.aiMessage.type as any) || 'transition' },
      });

      // If conversation was completed, reopen it
      if (state.status === 'completed') setStatus('active');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to jump to section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pause conversation
  const handlePause = async () => {
    if (!state.conversationId) return;
    
    try {
      await api.pauseConversation(state.conversationId);
      setStatus('paused');
      
      const pauseMsg = {
        id: `msg-${Date.now()}-pause`,
        role: 'system' as const,
        content: '⏸️ Conversation paused. You can resume anytime.',
        timestamp: new Date().toISOString(),
      };
      addMessage(pauseMsg);
    } catch (err) {
      console.error('Failed to pause conversation:', err);
    }
  };

  // Resume conversation
  const handleResume = async () => {
    if (!state.conversationId) return;
    
    try {
      const response = await api.resumeConversation(state.conversationId);
      setStatus('active');
      
      const resumeMsg = {
        id: `msg-${Date.now()}-resume`,
        role: 'system' as const,
        content: '▶️ Conversation resumed.',
        timestamp: new Date().toISOString(),
      };
      addMessage(resumeMsg);

      // Add AI message
      const aiMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai' as const,
        content: response.aiMessage.content,
        timestamp: response.aiMessage.timestamp,
      };
      addMessage(aiMessage);

      if (response.nextField) {
        // nextField no longer used in grouped mode — conversation continues via submitMessage
      }
    } catch (err) {
      console.error('Failed to resume conversation:', err);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            {state.currentSection && (
              <p className="text-xs text-gray-500 mt-0.5">
                {state.currentSection.emoji} {state.currentSection.title}
              </p>
            )}
          </div>
          
          {/* Pause/Resume button */}
          {state.status === 'active' && (
            <button
              onClick={handlePause}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              title="Pause conversation"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          {state.status === 'paused' && (
            <button
              onClick={handleResume}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Resume conversation"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{state.progress.overallPercentage}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${state.progress.overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Section navigation chips — only shown once sections are loaded */}
        {state.sections.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">Sections</p>
            <div className="flex flex-wrap gap-1">
              {state.sections.map((section) => {
                const isCompleted = state.completedSections.includes(section.sectionId);
                const isCurrent = state.currentSection?.sectionId === section.sectionId;
                return (
                  <button
                    key={section.sectionId}
                    disabled={!isCompleted || isCurrent || isSubmitting}
                    onClick={() => handleJumpToSection(section.sectionId)}
                    title={
                      isCompleted && !isCurrent
                        ? `Edit: ${section.title}`
                        : isCurrent
                        ? 'Current section'
                        : 'Not yet reached'
                    }
                    className={[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                      isCompleted && !isCurrent
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                        : isCurrent
                        ? 'bg-blue-100 text-blue-800 cursor-default ring-1 ring-blue-400'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <span>{section.emoji}</span>
                    <span className="max-w-[80px] truncate">{section.title}</span>
                    {isCompleted && !isCurrent && (
                      <span className="text-green-600" title="Click to edit">✎</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {state.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — always a plain textarea; AI asks for multiple fields naturally */}
      {state.status === 'active' && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-2">
            <textarea
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
              disabled={isSubmitting}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !currentValue?.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {state.status === 'completed' && (
        <div className="border-t border-gray-200 p-4 bg-green-50">
          <p className="text-sm text-green-800 text-center">
            🎉 All sections completed! Your document is ready.
          </p>
        </div>
      )}

      {/* Paused state */}
      {state.status === 'paused' && (
        <div className="border-t border-gray-200 p-4 bg-yellow-50">
          <p className="text-sm text-yellow-800 text-center">
            ⏸️ Conversation paused. Click the play button to resume.
          </p>
        </div>
      )}
    </div>
  );
}
