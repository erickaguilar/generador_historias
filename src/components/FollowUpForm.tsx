import React from 'react';
import { ConversationIcon } from './Icons';

interface FollowUpFormProps {
  onOpenConversationModal: () => void;
  isLoading: boolean; // General loading state to disable button if any major operation is ongoing
}

export const FollowUpForm: React.FC<FollowUpFormProps> = ({
  onOpenConversationModal,
  isLoading,
}) => {
  return (
    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
      {/* View Conversation Button */}
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button
          type="button"
          onClick={onOpenConversationModal}
          disabled={isLoading}
          className="w-full bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ConversationIcon className="h-5 w-5 mr-2" />
          Ver Conversación
        </button>
      </div>
    </div>
  );
};
