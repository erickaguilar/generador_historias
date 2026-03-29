import React from 'react';
import type { StoryRecord } from '../db';
import { LoadingIcon, LoadIcon, EditIcon, DeleteIcon, FolderEmptyIcon } from './Icons';

interface StoryHistoryViewProps {
  stories: StoryRecord[];
  onLoadStory: (story: StoryRecord) => void;
  onDeleteStory: (story: StoryRecord) => void;
  onOpenEditModal: (story: StoryRecord) => void; // New prop
  isLoading: boolean; // For overall loading of the list or bulk operations
  isDeleting: number | null; // ID of story currently being deleted
}

export const StoryHistoryView: React.FC<StoryHistoryViewProps> = ({
  stories,
  onLoadStory,
  onDeleteStory,
  onOpenEditModal, // Destructure new prop
  isLoading,
  isDeleting,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-slate-500 dark:text-slate-400">
        <LoadingIcon className="h-8 w-8 mb-3 text-sky-500 dark:text-sky-400" />
        <span>Cargando historias guardadas...</span>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center p-10 text-slate-500 dark:text-slate-400">
        <FolderEmptyIcon className="h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No hay historias guardadas.</p>
        <p className="text-sm">Cuando guardes una historia, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {stories.map((story) => (
        <li
          key={story.id}
          className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-200/70 dark:hover:bg-slate-600/70 transition-colors duration-150"
        >
          <div className="flex-grow mb-3 sm:mb-0 mr-2 min-w-0"> {/* Added mr-2 and min-w-0 for better truncation */}
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-300 truncate" title={story.title}>
              {story.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Guardado: {new Date(story.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onLoadStory(story)}
              disabled={!!isDeleting}
              className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50"
              title="Cargar esta historia"
            >
              <LoadIcon className="h-4 w-4 mr-1.5" />
              Cargar
            </button>
            <button
              onClick={() => onOpenEditModal(story)} // Call new handler
              disabled={!!isDeleting}
              className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50"
              title="Editar esta historia"
            >
              <EditIcon className="h-4 w-4 mr-1.5" />
              Editar
            </button>
            <button
              onClick={() => onDeleteStory(story)}
              disabled={isDeleting === story.id || (!!isDeleting && isDeleting !== story.id)}
              className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50"
              title="Eliminar esta historia"
            >
              {isDeleting === story.id ? (
                <LoadingIcon className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <DeleteIcon className="h-4 w-4 mr-1.5" />
              )}
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
