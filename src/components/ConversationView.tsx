import React, { useRef, useEffect } from 'react';
import type { ConversationMessage } from '../types';
import { LoadingIcon } from './Icons';

interface ConversationViewProps {
  conversation: ConversationMessage[];
  isLoading: boolean; // True when AI is thinking after user's last message
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  isLoading,
}) => {
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll whenever the conversation array length changes (new message)
    // or when the content of the last message changes (streaming).
    scrollToBottom();
  }, [conversation, isLoading]);


  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-120px)] pr-2">
      {conversation.map((msg, index) => (
        <div key={msg.id}>
          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 prose dark:prose-invert prose-sm sm:prose-base max-w-none flex flex-col'
              }`}
            >
              <div> {/* Wrapper for content */}
                {msg.role === 'model' ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                    {isLoading && index === conversation.length - 1 && <span className="streaming-cursor" />}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* The old loading indicator is removed as the new streaming cursor provides better feedback */}
      <div ref={conversationEndRef} />
    </div>
  );
};
