

import React, { useState, useEffect } from 'react';
import { LightbulbIcon } from './Icons';

const LOCAL_STORAGE_KEY = 'mobileTipDismissed';

export const MobileTipBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!dismissed) {
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
            // If localStorage is not available, just show the banner.
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        } catch (error) {
            console.error("Could not set item in localStorage:", error);
        }
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    // Usando sm:hidden para mostrar solo en pantallas más pequeñas que 640px.
    return (
        <div className="sm:hidden w-full max-w-3xl bg-sky-100 dark:bg-sky-900/70 border border-sky-200 dark:border-sky-700 rounded-lg p-3 my-4 flex items-start gap-3 shadow-lg">
            <div className="flex-shrink-0 pt-0.5">
                <LightbulbIcon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            </div>
            <div className="flex-grow text-sm text-sky-800 dark:text-sky-200">
                <p>
                    <span className="font-semibold">Consejo:</span> Guarda, escucha o accede a más acciones (⋮) sobre tu historia. ¡Usa los botones de la barra inferior para los Ajustes y el Libro de Lore!
                </p>
            </div>
            <button 
                onClick={handleDismiss}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-200 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition-colors flex-shrink-0 -mt-1 -mr-1"
                aria-label="Cerrar consejo"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
