

import { useState, useEffect, useCallback } from 'react';
import { loadLoreBook as loadLoreBookFromDb, saveLoreBook as saveLoreBookToDb } from '../db';
import type { CharacterEntry, WorldElementEntry, LoreBookData } from '../types';

export const useLoreBook = () => {
    const [characters, setCharacters] = useState<CharacterEntry[]>([]);
    const [worldElements, setWorldElements] = useState<WorldElementEntry[]>([]);
    const [isLoreBookLoaded, setIsLoreBookLoaded] = useState<boolean>(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoreBookLoaded(false);
            const loadedLoreBook = await loadLoreBookFromDb();
            if (loadedLoreBook) {
                setCharacters(loadedLoreBook.characters || []);
                setWorldElements(loadedLoreBook.worldElements || []);
            }
            setIsLoreBookLoaded(true);
        };
        loadData();
    }, []);

    const saveLoreBook = useCallback(async (currentData: LoreBookData): Promise<{success: boolean; error?: string}> => {
        try {
            await saveLoreBookToDb(currentData);
            return { success: true };
        } catch (error) {
            console.error("Failed to save lore book:", error);
            return { success: false, error: error instanceof Error ? error.message : "Error desconocido al guardar el libro de lore." };
        }
    }, []);

    return {
        characters,
        setCharacters,
        worldElements,
        setWorldElements,
        isLoreBookLoaded,
        saveLoreBook,
    };
};
