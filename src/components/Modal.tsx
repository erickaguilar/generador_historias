

import React from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-800 bg-opacity-75 dark:bg-slate-900 dark:bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-300">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
