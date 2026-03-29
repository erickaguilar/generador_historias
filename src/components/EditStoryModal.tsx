
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingIcon } from './Icons';
import { Alert } from './Alert';
import { AlertType } from '../types';
import type { StoryRecord } from '../db';

interface EditStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyToEdit: StoryRecord | null;
  onSaveChanges: (storyId: number, data: { title: string; content: string }) => Promise<void>;
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
}

export const EditStoryModal: React.FC<EditStoryModalProps> = ({
  isOpen,
  onClose,
  storyToEdit,
  onSaveChanges,
  isSaving,
  error,
  clearError,
}) => {
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (storyToEdit) {
      setEditedTitle(storyToEdit.title);
      setEditedContent(storyToEdit.content);
      clearError(); // Clear previous errors when a new story is set or modal opens
    } else {
      // Reset fields if no story is being edited (e.g., modal closed and props reset)
      setEditedTitle('');
      setEditedContent('');
    }
  }, [storyToEdit, isOpen, clearError]); // Add isOpen to re-init on open if storyToEdit changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyToEdit || !storyToEdit.id || isSaving) return;
    
    // Basic validation
    if (!editedTitle.trim()) {
      // This ideally should be handled by an internal alert in this modal, or passed up.
      // For now, it relies on the parent potentially setting 'error'.
      // A more robust solution would be local error state for validation.
      alert("El título no puede estar vacío."); 
      return;
    }
    if (!editedContent.trim()) {
      alert("El contenido no puede estar vacío.");
      return;
    }

    await onSaveChanges(storyToEdit.id, { title: editedTitle.trim(), content: editedContent.trim() });
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  if (!isOpen || !storyToEdit) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Historia Guardada">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert message={error} type={AlertType.Error} onClose={clearError} />
        )}
        <div>
          <label htmlFor="editStoryTitle" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Título de la Historia
          </label>
          <input
            type="text"
            id="editStoryTitle"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
            disabled={isSaving}
            required
            aria-describedby="editStoryTitleHelper"
          />
          <p id="editStoryTitleHelper" className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modifica el título de tu historia.</p>
        </div>

        <div>
          <label htmlFor="editStoryContent" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Contenido de la Historia
          </label>
          <textarea
            id="editStoryContent"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={10}
            className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200 resize-y"
            disabled={isSaving}
            required
            aria-describedby="editStoryContentHelper"
          />
          <p id="editStoryContentHelper" className="text-xs text-slate-500 dark:text-slate-400 mt-1">Edita el contenido narrativo de tu historia. Asegúrate de mantener la estructura de párrafos separados por doble salto de línea si es necesario.</p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !editedTitle.trim() || !editedContent.trim()}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <LoadingIcon className="w-4 h-4 mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
