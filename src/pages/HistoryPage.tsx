
import React, { useState, useCallback, useEffect } from 'react';
import type { StoryRecord } from '../db';
import { getAllStories, deleteStory as deleteStoryFromDb, updateStoryInDb } from '../db';
import { StoryHistoryView } from '../components/StoryHistoryView';
import { EditStoryModal } from '../components/EditStoryModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Alert } from '../components/Alert';
import { AlertType } from '../types';

interface HistoryPageProps {
  onLoadStory: (story: StoryRecord) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadStory }) => {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [storyToConfirmDelete, setStoryToConfirmDelete] = useState<StoryRecord | null>(null);
  const [storyToEdit, setStoryToEdit] = useState<StoryRecord | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storiesFromDb = await getAllStories();
      setStories(storiesFromDb);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar historias guardadas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleRequestDelete = (story: StoryRecord) => {
    if (deletingId) return;
    setStoryToConfirmDelete(story);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!storyToConfirmDelete || !storyToConfirmDelete.id) return;
    setDeletingId(storyToConfirmDelete.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteStoryFromDb(storyToConfirmDelete.id);
      setStories(prev => prev.filter(s => s.id !== storyToConfirmDelete.id));
      setSuccessMessage("Historia eliminada con éxito.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la historia.");
    } finally {
      setDeletingId(null);
      setStoryToConfirmDelete(null);
    }
  }, [storyToConfirmDelete]);

  const handleOpenEdit = (story: StoryRecord) => {
    setStoryToEdit(story);
    setEditError(null);
  };

  const handleSaveChanges = useCallback(async (storyId: number, data: { title: string; content: string }) => {
    setIsSavingEdit(true);
    setEditError(null);
    setError(null);
    setSuccessMessage(null);
    try {
      await updateStoryInDb(storyId, data);
      await fetchStories(); // Refresh the list
      setStoryToEdit(null); // Close modal
      setSuccessMessage("Historia actualizada con éxito.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido al guardar cambios.";
      setEditError(message);
    } finally {
      setIsSavingEdit(false);
    }
  }, [fetchStories]);

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col w-full">
        {error && <Alert message={error} type={AlertType.Error} onClose={() => setError(null)} />}
        {successMessage && <Alert message={successMessage} type={AlertType.Success} onClose={() => setSuccessMessage(null)} />}
        
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-300 mb-6 text-center">
            Mis Historias Guardadas
        </h2>

        <StoryHistoryView
            stories={stories}
            onLoadStory={onLoadStory}
            onDeleteStory={handleRequestDelete}
            onOpenEditModal={handleOpenEdit}
            isLoading={isLoading}
            isDeleting={deletingId}
        />

        <EditStoryModal
            isOpen={!!storyToEdit}
            onClose={() => setStoryToEdit(null)}
            storyToEdit={storyToEdit}
            onSaveChanges={handleSaveChanges}
            isSaving={isSavingEdit}
            error={editError}
            clearError={() => setEditError(null)}
        />

        <ConfirmationModal
            isOpen={!!storyToConfirmDelete}
            onClose={() => setStoryToConfirmDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Confirmar eliminación"
            message={`¿Estás seguro de que quieres eliminar la historia "${storyToConfirmDelete?.title}"? Esta acción es permanente y no se puede deshacer.`}
            confirmButtonText="Sí, eliminar"
            isConfirming={!!deletingId && deletingId === storyToConfirmDelete?.id}
        />
    </div>
  );
};
