import React from 'react';
import { ContentBlock, ContentBlockType } from '../../types';

interface ContentRendererProps {
  block: ContentBlock;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ block }) => {
  const renderContent = () => {
    switch (block.type) {
      case ContentBlockType.TEXT:
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: block.content.html || block.content }} />
          </div>
        );

      case ContentBlockType.VIDEO:
        return (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {block.content.url ? (
              <video
                src={block.content.url}
                controls
                className="w-full h-full"
                poster={block.content.thumbnail}
              >
                Your browser does not support the video tag.
              </video>
            ) : block.content.embedUrl ? (
              <iframe
                src={block.content.embedUrl}
                title="Video content"
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <p className="text-gray-400">Video unavailable</p>
                </div>
              </div>
            )}
          </div>
        );

      case ContentBlockType.IMAGE:
        return (
          <div className="rounded-lg overflow-hidden">
            {block.content.url ? (
              <img
                src={block.content.url}
                alt={block.content.caption || 'Content image'}
                className="w-full h-auto"
              />
            ) : (
              <div className="bg-gray-200 aspect-video flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {block.content.caption && (
              <p className="text-sm text-gray-600 mt-2 italic">{block.content.caption}</p>
            )}
          </div>
        );

      case ContentBlockType.QUIZ:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  {block.content.title || 'Quiz'}
                </h4>
                <p className="text-blue-700 mb-4">
                  {block.content.description || 'Test your knowledge with this quiz.'}
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        );

      case ContentBlockType.ASSIGNMENT:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-lg font-semibold text-yellow-900 mb-2">
                  {block.content.title || 'Assignment'}
                </h4>
                <p className="text-yellow-700 mb-4">
                  {block.content.description || 'Complete this assignment to continue.'}
                </p>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium">
                  View Assignment
                </button>
              </div>
            </div>
          </div>
        );

      case ContentBlockType.RESOURCE:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {block.content.title || 'Resource'}
                </h4>
                {block.content.description && (
                  <p className="text-gray-700 mb-4">{block.content.description}</p>
                )}
                {block.content.url && (
                  <a
                    href={block.content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    Download Resource
                  </a>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center text-gray-500">
            Unsupported content type
          </div>
        );
    }
  };

  return <div className="mb-6">{renderContent()}</div>;
};

export default ContentRenderer;
