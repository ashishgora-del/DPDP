import React from 'react';
import type { ChatMessage as ChatMessageType } from '../types/conversation';
import { Bot, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === 'ai';
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get icon based on message type
  const getIcon = () => {
    if (isUser) {
      return <User className="h-4 w-4" />;
    }
    if (isSystem) {
      return <Clock className="h-4 w-4" />;
    }
    
    // AI icons based on message type
    const type = message.metadata?.type;
    switch (type) {
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  // Get message styling based on role/type
  const getMessageStyle = () => {
    if (isUser) {
      return 'bg-blue-600 text-white ml-auto';
    }
    if (isSystem) {
      return 'bg-gray-100 text-gray-600 text-center mx-auto';
    }
    if (message.metadata?.error) {
      return 'bg-red-50 text-red-900 border border-red-200';
    }
    if (message.metadata?.type === 'completion') {
      return 'bg-green-50 text-green-900 border border-green-200';
    }
    return 'bg-white text-gray-900 border border-gray-200';
  };

  const getContainerStyle = () => {
    if (isUser) {
      return 'flex justify-end';
    }
    if (isSystem) {
      return 'flex justify-center';
    }
    return 'flex justify-start';
  };

  return (
    <div className={`${getContainerStyle()} mb-4 px-2`}>
      <div className={`max-w-[80%] ${isSystem ? 'max-w-full' : ''}`}>
        {/* Avatar & Name (for AI/System) */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`p-1.5 rounded-full ${
              isSystem ? 'bg-gray-200' : 'bg-blue-100'
            }`}>
              {getIcon()}
            </div>
            <span className="text-xs font-medium text-gray-600">
              {isSystem ? 'System' : 'AI Assistant'}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`${getMessageStyle()} rounded-2xl px-4 py-3 ${
            isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
          } shadow-sm`}
        >
          {/* Message Content */}
          <div className={`text-sm whitespace-pre-wrap break-words ${
            isSystem ? 'text-center' : ''
          }`}>
            {message.content}
          </div>

          {/* Timestamp */}
          <div
            className={`mt-1.5 text-xs ${
              isUser
                ? 'text-blue-200'
                : isSystem
                ? 'text-gray-400'
                : message.metadata?.error
                ? 'text-red-400'
                : 'text-gray-400'
            } ${isSystem ? 'text-center' : ''}`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>

        {/* User Avatar (on right side) */}
        {isUser && (
          <div className="flex items-center gap-2 mt-1.5 justify-end">
            <span className="text-xs font-medium text-gray-600">You</span>
            <div className="p-1.5 rounded-full bg-blue-600 text-white">
              {getIcon()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
