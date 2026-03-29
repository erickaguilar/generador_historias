
import React from 'react';
import { Modal } from './Modal';
import { StoryHistoryView } from './StoryHistoryView';
import type { StoryRecord } from '../db'; // Ensures StoryRecord type is available

interface StoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryRecord[];
  onLoadStory: (story: StoryRecord) => void;
  onDeleteStory: (story: StoryRecord) => void;
  onOpenEditModal: (story: StoryRecord) => void; // New prop
  isLoadingStories: boolean;
  isDeletingStory: number | null;
}

export const StoryHistoryModal: React.FC<StoryHistoryModalProps> = ({
  isOpen,
  onClose,
  stories,
  onLoadStory,
  onDeleteStory,
  onOpenEditModal, // Destructure new prop
  isLoadingStories,
  isDeletingStory,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis Historias Guardadas">
      <StoryHistoryView
        stories={stories}
        onLoadStory={onLoadStory}
        onDeleteStory={onDeleteStory}
        onOpenEditModal={onOpenEditModal} // Pass prop down
        isLoading={isLoadingStories}
        isDeleting={isDeletingStory}
      />
       <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          >
            Cerrar
          </button>
      </div>
    </Modal>
  );
};