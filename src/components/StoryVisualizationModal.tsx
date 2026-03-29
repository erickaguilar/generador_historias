
import React, { useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { calculateWordFrequency } from '../../utils/textUtils';

interface StoryVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyText: string;
  title: string;
}

const drawWordCloud = (canvas: HTMLCanvasElement, frequencies: Map<string, number>) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc'; // slate-800 or slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Sort words by frequency
    const sortedWords = Array.from(frequencies.entries()).sort((a, b) => b[1] - a[1]);
    const topWords = sortedWords.slice(0, 50); // Take top 50 words
    if (topWords.length === 0) {
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.font = '16px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No hay suficientes palabras para generar una visualización.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const maxFreq = topWords[0][1];
    const minFreq = topWords[topWords.length - 1][1];

    const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#075985'];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const placedRects: {x: number, y: number, width: number, height: number}[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    topWords.forEach(([word, freq]) => {
        // Map frequency to font size (e.g., 14px to 60px)
        const fontSize = 14 + ((freq - minFreq) / (maxFreq - minFreq || 1)) * 46;
        ctx.font = `bold ${fontSize}px Montserrat, sans-serif`;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

        const textMetrics = ctx.measureText(word);
        const textWidth = textMetrics.width;
        const textHeight = fontSize; // Approximate height

        let angle = Math.random() * Math.PI * 2;
        let radius = 0;
        let x, y;

        // Spiral placement logic
        for (let i = 0; i < 500; i++) { // Limit attempts to find a spot
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle);

            // Bounding box for the word, centered on (x, y)
            const currentRect = {
                x: x - textWidth / 2,
                y: y - textHeight / 2,
                width: textWidth,
                height: textHeight,
            };

            // Check if it's within canvas boundaries (with a small margin)
            const margin = 5;
            if (currentRect.x < margin || currentRect.x + currentRect.width > canvas.width - margin ||
                currentRect.y < margin || currentRect.y + currentRect.height > canvas.height - margin) {
                // Move along the spiral if out of bounds
                radius += 1.5; // Slightly larger step to move outwards faster
                angle += (Math.PI / 180) * 15; // Rotate 15 degrees
                continue;
            }

            // Check for collision with already placed words
            const overlaps = placedRects.some(r =>
                currentRect.x < r.x + r.width &&
                currentRect.x + currentRect.width > r.x &&
                currentRect.y < r.y + r.height &&
                currentRect.y + currentRect.height > r.y
            );

            if (!overlaps) {
                ctx.fillText(word, x, y);
                placedRects.push(currentRect);
                break; // Found a position, break the inner loop to place the next word
            }

            // Move along the spiral if collision
            radius += 1.5;
            angle += (Math.PI / 180) * 15;
        }
    });
};

export const StoryVisualizationModal: React.FC<StoryVisualizationModalProps> = ({ isOpen, onClose, storyText, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const frequencies = calculateWordFrequency(storyText);
      
      // A brief timeout to ensure the modal and canvas are fully rendered before drawing
      setTimeout(() => {
        drawWordCloud(canvas, frequencies);
      }, 100);
    }
  }, [isOpen, storyText]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visualización de Palabras: ${title}`}>
        <div className="bg-slate-200 dark:bg-slate-900 p-2 rounded-lg">
            <canvas ref={canvasRef} width="600" height="400" className="w-full h-auto rounded-md"></canvas>
        </div>
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
