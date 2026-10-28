import React, { useEffect, useRef, useState } from 'react';
import { useConversation } from '../context/ConversationContext';
import { Eye, Edit3 } from 'lucide-react';

interface LiveDocumentPreviewProps {
  content: string;
  onContentChange?: (content: string) => void;
  editable?: boolean;
}

export function LiveDocumentPreview({ 
  content, 
  onContentChange, 
  editable = false 
}: LiveDocumentPreviewProps) {
  const { state } = useConversation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Parse markdown to HTML (simple version)
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-4">$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

    // Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-4 border-gray-300" />');

    // Tables (basic support)
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(cell => cell.trim());
      const cellsHtml = cells.map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('');
      return `<tr>${cellsHtml}</tr>`;
    });

    // Wrap table rows in table
    if (html.includes('<tr>')) {
      html = html.replace(/(<tr>.*<\/tr>)/s, '<table class="w-full border-collapse my-4">$1</table>');
    }

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, '<br />');

    // Wrap in paragraph
    html = `<div class="prose max-w-none"><p class="mb-3">${html}</p></div>`;

    return html;
  };

  // Scroll to a specific section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight for 2 seconds
      setHighlightedSection(sectionId);
      setTimeout(() => setHighlightedSection(null), 2000);
    }
  };

  // Parse sections from content
  const parseSections = (markdown: string) => {
    const sections: Array<{ id: string; content: string }> = [];
    const regex = /<!-- SECTION:([\w-]+):START -->([\s\S]*?)<!-- SECTION:\1:END -->/g;
    
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      sections.push({
        id: match[1],
        content: match[2].trim(),
      });
    }
    
    return sections;
  };

  // When a new section is completed, scroll to it
  useEffect(() => {
    if (state.completedSections.length > 0) {
      const lastSection = state.completedSections[state.completedSections.length - 1];
      scrollToSection(lastSection);
    }
  }, [state.completedSections]);

  // Render sections with highlighting
  const renderContent = () => {
    const sections = parseSections(content);
    
    if (sections.length === 0) {
      // No sections yet, show placeholder or plain content
      return (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />
      );
    }

    return (
      <div className="space-y-6">
        {sections.map((section) => {
          const isHighlighted = highlightedSection === section.id;
          const isCompleted = state.completedSections.includes(section.id);
          
          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`
                transition-all duration-500 rounded-lg p-4
                ${isHighlighted ? 'bg-blue-50 border-2 border-blue-300 shadow-lg' : ''}
                ${isCompleted && !isHighlighted ? 'bg-green-50/30' : ''}
              `}
            >
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Live Preview</h3>
        </div>
        
        {editable && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            onClick={() => {
              // Toggle edit mode
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Preview Content */}
      <div
        ref={previewRef}
        className="flex-1 overflow-y-auto p-6"
      >
        {content ? (
          renderContent()
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Eye className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Document preview will appear here</p>
            <p className="text-xs mt-1">Start the AI conversation to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
