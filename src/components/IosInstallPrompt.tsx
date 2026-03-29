
import React from 'react';
import { Modal } from './Modal';
import { ArrowUpTrayIcon, PlusIcon } from './Icons';

interface IosInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallPrompt: React.FC<IosInstallPromptProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalar Aplicación en iOS">
      <div className="space-y-4 text-slate-700 dark:text-slate-300">
        <p>Para instalar esta aplicación en tu iPhone o iPad, sigue estos sencillos pasos:</p>
        <ol className="list-decimal list-inside space-y-4 pl-2">
          <li className="flex items-center gap-4">
            <span className="flex-shrink-0 font-bold text-sky-500 text-lg">1.</span>
            <div className="flex-grow">
                Toca el botón de <span className="font-semibold">Compartir</span> en la barra de herramientas de Safari.
            </div>
            <ArrowUpTrayIcon className="flex-shrink-0 h-10 w-10 text-sky-500 dark:text-sky-400 border border-slate-300 dark:border-slate-600 rounded-lg p-1" />
          </li>
          <li className="flex items-center gap-4">
            <span className="flex-shrink-0 font-bold text-sky-500 text-lg">2.</span>
            <div className="flex-grow">
                Busca en el menú y selecciona <span className="font-semibold">"Añadir a la pantalla de inicio"</span>.
            </div>
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 text-sky-500 dark:text-sky-400 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                <PlusIcon className="h-7 w-7" />
            </div>
          </li>
          <li className="flex items-center gap-4">
            <span className="flex-shrink-0 font-bold text-sky-500 text-lg">3.</span>
            <div className="flex-grow">
                Confirma tocando <span className="font-semibold">"Añadir"</span> en la esquina superior derecha de la pantalla.
            </div>
          </li>
        </ol>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
          ¡La aplicación aparecerá en tu pantalla de inicio como cualquier otra!
        </p>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
        >
          Entendido
        </button>
      </div>
    </Modal>
  );
};
