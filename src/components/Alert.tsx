import React, { useEffect } from 'react';
import { AlertType } from '../types';
import { AlertInfoIcon, CloseIcon } from './Icons';

interface AlertProps {
  message: string;
  type: AlertType;
  onClose?: () => void;
  persistent?: boolean;
}

const alertStyles = {
  [AlertType.Error]: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-100',
  [AlertType.Success]: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-100',
  [AlertType.Info]: 'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-100',
};

const Icon = ({ type }: { type: AlertType }) => {
  if (type === AlertType.Error) {
    return <AlertInfoIcon className="h-6 w-6 mr-3 flex-shrink-0" />;
  }
  // Add other icons for success/info if needed
  return null;
};

export const Alert: React.FC<AlertProps> = ({ message, type, onClose, persistent = false }) => {
  useEffect(() => {
    // Only set a timeout if the alert is not persistent
    if (message && type && onClose && !persistent) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer on unmount or if message/type/onClose changes
    }
  }, [message, type, onClose, persistent]);

  const baseClasses = 'fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 max-w-md w-11/12 sm:w-auto z-[60] p-4 border-l-4 rounded-lg shadow-xl flex items-center justify-between transition-all duration-300 ease-in-out transform';
  const typeClasses = alertStyles[type] || alertStyles[AlertType.Info];

  if (!message) return null;

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <div className="flex items-center">
        <Icon type={type} />
        <span className="flex-grow">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 p-1 text-current hover:bg-black hover:bg-opacity-20 rounded-md focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-50 flex-shrink-0"
          aria-label="Cerrar alerta"
        >
          <CloseIcon className="h-5 w-5"/>
        </button>
      )}
    </div>
  );
};