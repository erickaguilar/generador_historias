import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { GalleryImage } from '../db';

// Moved from FullStoryDisplay.tsx
const GalleryImageComponent: React.FC<{ image: GalleryImage }> = ({ image }) => {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        const objectUrl = URL.createObjectURL(image.imageBlob);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [image.imageBlob]);

    if (!url) return null;

    return (
        <figure className="break-inside-avoid">
            <img src={url} alt={image.sourceText} className="rounded-lg shadow-md w-full h-auto object-cover border-2 border-slate-300 dark:border-slate-600"/>
            <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic font-sans">"{image.sourceText}"</figcaption>
        </figure>
    );
};


interface StoryGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  title: string;
}

export const StoryGalleryModal: React.FC<StoryGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  title,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Galería de: ${title}`}>
        {images.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400">
                No hay imágenes en la galería de esta historia.
            </p>
        ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                {images.map((image, index) => (
                    <GalleryImageComponent key={index} image={image} />
                ))}
            </div>
        )}

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
