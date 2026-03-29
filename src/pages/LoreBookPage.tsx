

import React, { useState, useEffect } from 'react';
import { LoadingIcon, EditIcon, DeleteIcon } from '../components/Icons';
import { Alert } from '../components/Alert';
import { AlertType, CharacterEntry, WorldElementEntry, WORLD_ELEMENT_TYPES, WorldElementType } from '../types';
import type { useLoreBook } from '../hooks/useLoreBook';

type LoreBookApi = ReturnType<typeof useLoreBook>;

interface LoreBookPageProps {
  loreBookApi: LoreBookApi;
}

const CharacterForm: React.FC<{
    entry: Partial<CharacterEntry>;
    onFieldChange: (field: keyof CharacterEntry, value: string) => void;
}> = ({ entry, onFieldChange }) => (
    <>
        <div>
            <label htmlFor="entryName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
            <input id="entryName" type="text" value={entry.name || ''} onChange={(e) => onFieldChange('name', e.target.value)} placeholder="Nombre del personaje" className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500" required />
        </div>
        <div>
            <label htmlFor="entryRole" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol en la Historia</label>
            <input id="entryRole" type="text" value={entry.role || ''} onChange={(e) => onFieldChange('role', e.target.value)} placeholder="Ej: Protagonista, Antagonista, Mentor..." className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div>
            <label htmlFor="entryAppearance" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apariencia</label>
            <textarea id="entryAppearance" value={entry.appearance || ''} onChange={(e) => onFieldChange('appearance', e.target.value)} placeholder="Descripción física, vestimenta..." rows={2} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div>
            <label htmlFor="entryPersonality" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Personalidad</label>
            <textarea id="entryPersonality" value={entry.personality || ''} onChange={(e) => onFieldChange('personality', e.target.value)} placeholder="Rasgos clave, motivaciones, miedos..." rows={2} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div>
            <label htmlFor="entryBackstory" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trasfondo</label>
            <textarea id="entryBackstory" value={entry.backstory || ''} onChange={(e) => onFieldChange('backstory', e.target.value)} placeholder="Breve historia, eventos importantes..." rows={3} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:ring-sky-500 focus:border-sky-500" />
        </div>
    </>
);

const WorldElementForm: React.FC<{
    entry: Partial<WorldElementEntry>;
    onFieldChange: (field: keyof WorldElementEntry, value: string) => void;
}> = ({ entry, onFieldChange }) => (
    <>
        <div>
            <label htmlFor="entryName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
            <input id="entryName" type="text" value={entry.name || ''} onChange={(e) => onFieldChange('name', e.target.value)} placeholder="Nombre del elemento" className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500" required />
        </div>
        <div>
            <label htmlFor="entryType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Elemento</label>
            <select id="entryType" value={entry.type || 'Lugar'} onChange={(e) => onFieldChange('type', e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500">
                {WORLD_ELEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="entryDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
            <textarea id="entryDescription" value={entry.description || ''} onChange={(e) => onFieldChange('description', e.target.value)} placeholder="Detalles, apariencia, historia, función..." rows={8} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:ring-sky-500 focus:border-sky-500" required />
        </div>
    </>
);


export const LoreBookPage: React.FC<LoreBookPageProps> = ({ loreBookApi }) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'worldElements'>('characters');
  
  const [tempCharacters, setTempCharacters] = useState<CharacterEntry[]>([]);
  const [tempWorldElements, setTempWorldElements] = useState<WorldElementEntry[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<CharacterEntry | WorldElementEntry>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{message: string, type: AlertType} | null>(null);

  useEffect(() => {
      setTempCharacters([...loreBookApi.characters]);
      setTempWorldElements([...loreBookApi.worldElements]);
  }, [loreBookApi.characters, loreBookApi.worldElements]);

  const resetForm = () => {
    setEditingId(null);
    setFormState({});
  };

  const handleEditClick = (entry: CharacterEntry | WorldElementEntry) => {
    setEditingId(entry.id);
    setFormState(entry);
  };
  
  const handleDeleteClick = (id: string) => {
    if (activeTab === 'characters') {
      setTempCharacters(prev => prev.filter(e => e.id !== id));
    } else {
      setTempWorldElements(prev => prev.filter(e => e.id !== id));
    }
    if (id === editingId) {
        resetForm();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name?.trim()) return;

    if (activeTab === 'characters') {
        const newEntry: CharacterEntry = {
            id: editingId || crypto.randomUUID(),
            name: formState.name,
            role: (formState as Partial<CharacterEntry>).role || '',
            appearance: (formState as Partial<CharacterEntry>).appearance || '',
            personality: (formState as Partial<CharacterEntry>).personality || '',
            backstory: (formState as Partial<CharacterEntry>).backstory || '',
        };
        if (editingId) {
            setTempCharacters(prev => prev.map(e => e.id === editingId ? newEntry : e));
        } else {
            setTempCharacters(prev => [...prev, newEntry]);
        }
    } else { // worldElements
        const newEntry: WorldElementEntry = {
            id: editingId || crypto.randomUUID(),
            name: formState.name,
            type: (formState as Partial<WorldElementEntry>).type || 'Otro',
            description: (formState as Partial<WorldElementEntry>).description || '',
        };
        if (editingId) {
            setTempWorldElements(prev => prev.map(e => e.id === editingId ? newEntry : e));
        } else {
            setTempWorldElements(prev => [...prev, newEntry]);
        }
    }
    resetForm();
  };

  const handleSaveToBrowser = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    
    loreBookApi.setCharacters(tempCharacters);
    loreBookApi.setWorldElements(tempWorldElements);
    
    const result = await loreBookApi.saveLoreBook({
        characters: tempCharacters,
        worldElements: tempWorldElements
    });
    
    if (result.success) {
      setSaveFeedback({ message: "Libro de Lore guardado con éxito.", type: AlertType.Success });
    } else {
      setSaveFeedback({ message: result.error || "Error al guardar.", type: AlertType.Error });
    }
    setIsSaving(false);
  };
  
  const currentEntries = activeTab === 'characters' ? tempCharacters : tempWorldElements;
  const formTitle = editingId ? `Editando ${activeTab === 'characters' ? 'Personaje' : 'Elemento'}` : `Añadir Nuevo ${activeTab === 'characters' ? 'Personaje' : 'Elemento'}`;
  const formButtonText = editingId ? 'Actualizar Entrada' : 'Añadir Entrada';

  return (
     <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col w-full">
        {saveFeedback && (
            <Alert message={saveFeedback.message} type={saveFeedback.type} onClose={() => setSaveFeedback(null)} />
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-300 mb-2 text-center">
            Libro de Lore (World-Building)
        </h2>
         <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm max-w-2xl mx-auto">
            Define personajes y elementos del mundo. La IA los usará para mantener la coherencia en tus historias. Los cambios se guardan en tu navegador.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 flex flex-col">
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3 flex-shrink-0">
                    <button onClick={() => { setActiveTab('characters'); resetForm(); }} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'characters' ? 'text-sky-600 dark:text-sky-300 border-b-2 border-sky-600 dark:border-sky-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Personajes</button>
                    <button onClick={() => { setActiveTab('worldElements'); resetForm(); }} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'worldElements' ? 'text-sky-600 dark:text-sky-300 border-b-2 border-sky-600 dark:border-sky-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Elementos del Mundo</button>
                </div>
                <div className="space-y-2 overflow-y-auto pr-2 flex-grow min-h-[300px]">
                    {currentEntries.length > 0 ? currentEntries.map(entry => (
                    <div key={entry.id} className={`p-2 rounded-md flex justify-between items-center transition-colors ${editingId === entry.id ? 'bg-sky-100 dark:bg-sky-900/60 ring-2 ring-sky-300' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                        <div className="truncate pr-2">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{entry.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {activeTab === 'characters' ? (entry as CharacterEntry).role : (entry as WorldElementEntry).type}
                            </p>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                            <button onClick={() => handleEditClick(entry)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300 rounded-md" title="Editar"><EditIcon className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteClick(entry.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md" title="Eliminar"><DeleteIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
                    )) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center pt-8">No hay {activeTab === 'characters' ? 'personajes' : 'elementos'} definidos.</p>
                    )}
                </div>
            </div>

            <div className="w-full md:w-1/2">
                <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-300 mb-3">{formTitle}</h3>
                <form onSubmit={handleFormSubmit} className="space-y-3">
                    {activeTab === 'characters' ? (
                        <CharacterForm entry={formState as Partial<CharacterEntry>} onFieldChange={(field, value) => setFormState(prev => ({ ...prev, [field]: value }))} />
                    ) : (
                        <WorldElementForm entry={formState as Partial<WorldElementEntry>} onFieldChange={(field, value) => setFormState(prev => ({ ...prev, [field]: value }))} />
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        {editingId && <button type="button" onClick={resetForm} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md">Cancelar Edición</button>}
                        <button type="submit" className="px-3 py-1.5 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-md">{formButtonText}</button>
                    </div>
                </form>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button type="button" onClick={handleSaveToBrowser} disabled={isSaving} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isSaving ? (<><LoadingIcon className="w-4 h-4 mr-2" />Guardando...</>) : ('Guardar Cambios en el Navegador')}
            </button>
        </div>
    </div>
  );
};
