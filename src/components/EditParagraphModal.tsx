import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingIcon } from './Icons';

interface EditParagraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onConfirm: (instruction: string) => void;
  isSaving: boolean;
}

export const EditParagraphModal: React.FC<EditParagraphModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onConfirm,
  isSaving,
}) => {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInstruction(''); // Reset instruction when modal is closed
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isSaving) {
      onConfirm(instruction);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Párrafo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Párrafo Original:
          </label>
          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-600 dark:text-slate-300">{originalText}</p>
          </div>
        </div>

        <div>
          <label htmlFor="editInstruction" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Instrucciones de Edición:
          </label>
          <textarea
            id="editInstruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y"
            placeholder="Ej: Haz que el personaje suene más asustado y describe el frío de la habitación."
            disabled={isSaving}
            required
            autoFocus
          />
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !instruction.trim()}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <LoadingIcon className="w-4 h-4 mr-2" />
                Aplicando...
              </>
            ) : (
              'Confirmar Edición'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
