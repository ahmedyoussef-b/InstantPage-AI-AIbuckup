'use client';

import { FileSystemItem, Stats, ChunkMetadata } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';

/**
 * État local simulé pour la démonstration (en mémoire pour cette session)
 */
let mockFileSystem: FileSystemItem[] = [
  {
    id: "root-1",
    name: "Projets 2024",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "file-1",
        name: "Cahier_des_charges.pdf",
        type: "file",
        size: 450000,
        chunks: 15,
        uploadedAt: new Date().toISOString(),
        parentId: "root-1"
      }
    ]
  }
];

/**
 * Helper: Compte tous les éléments (fichiers + dossiers) pour le debug
 */
const countAllItems = (items: FileSystemItem[]): number => {
  return items.reduce((acc, item) => {
    return acc + 1 + (item.children ? countAllItems(item.children) : 0);
  }, 0);
};

/**
 * Helper: Trouve un élément récursivement
 */
const findItemById = (items: FileSystemItem[], id: string): FileSystemItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Helper: Supprime récursivement un élément par son ID
 */
const recursiveRemove = (items: FileSystemItem[], id: string): FileSystemItem[] => {
  return items
    .filter(item => {
      const match = item.id === id;
      if (match) console.log(`[API_CLIENT][RECURSIVE_REMOVE] Suppression trouvée: ${item.name} (${item.type})`);
      return !match;
    })
    .map(item => {
      if (item.type === 'folder' && item.children) {
        return { ...item, children: recursiveRemove(item.children, id) };
      }
      return item;
    });
};

/**
 * Helper: Purge récursivement les segments de tous les fichiers d'un dossier
 */
const purgeChunksRecursive = async (item: FileSystemItem): Promise<number> => {
  let total = 0;
  if (item.type === 'file') {
    const res = await deleteDocument({ docId: item.id, fileName: item.name });
    total += res.purgedChunks;
  } else if (item.children) {
    for (const child of item.children) {
      total += await purgeChunksRecursive(child);
    }
  }
  return total;
};

/**
 * Helper: Supprime récursivement les fichiers d'une structure (Reset Base)
 */
const clearFilesOnly = (items: FileSystemItem[]): FileSystemItem[] => {
  return items
    .filter(item => item.type === 'folder')
    .map(folder => ({
      ...folder,
      children: folder.children ? clearFilesOnly(folder.children) : []
    }));
};

/**
 * Helper: Ajoute un élément à un parent spécifique
 */
const addItemToParent = (items: FileSystemItem[], parentId: string | null, newItem: FileSystemItem): FileSystemItem[] => {
  if (parentId === null) return [...items, newItem];
  return items.map(item => {
    if (item.id === parentId && item.type === 'folder') {
      return { ...item, children: [...(item.children || []), newItem] };
    }
    if (item.children) {
      return { ...item, children: addItemToParent(item.children, parentId, newItem) };
    }
    return item;
  });
};

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    console.log(`[API_CLIENT][upload] Debut ingestion: ${file.name}`);
    try {
      const text = await file.text();
      const result = await ingestDocument({
        fileName: file.name,
        fileContent: text,
        fileType: file.type || 'text/plain'
      });

      const newFile: FileSystemItem = {
        id: result.docId,
        name: file.name,
        type: 'file',
        size: file.size,
        chunks: result.chunks,
        uploadedAt: new Date().toISOString(),
        parentId: parentId
      };

      mockFileSystem = addItemToParent(mockFileSystem, parentId, newFile);
      console.log(`[API_CLIENT][upload] Succès. Nouvel état base: ${countAllItems(mockFileSystem)} items.`);
      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error) {
      console.error('[API_CLIENT][upload] Erreur:', error);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        content: [{ text: msg.text }]
      }));
      const result = await serverChat({ text: query, history: genkitHistory });
      return { answer: result.answer, sources: result.sources || [] };
    } catch (error) {
      console.error('[API_CLIENT][chat] Erreur:', error);
      throw error;
    }
  },

  async clearAll(): Promise<boolean> {
    console.log(`[API_CLIENT][clearAll] Reset complet demandé.`);
    return new Promise(resolve => {
      setTimeout(() => {
        mockFileSystem = clearFilesOnly(mockFileSystem);
        console.log(`[API_CLIENT][clearAll] Reset terminé. Items restants: ${countAllItems(mockFileSystem)}`);
        resolve(true);
      }, 500);
    });
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    console.log(`[API_CLIENT][deleteItem] Suppression: ${name} (ID: ${id})`);
    
    try {
      // 1. Trouver l'élément pour la purge des segments
      const itemToPurge = findItemById(mockFileSystem, id);
      let totalPurged = 0;

      if (itemToPurge) {
        totalPurged = await purgeChunksRecursive(itemToPurge);
        console.log(`[API_CLIENT][deleteItem] Segments purgés: ${totalPurged}`);
      }

      // 2. Suppression de l'arborescence
      const countBefore = countAllItems(mockFileSystem);
      mockFileSystem = recursiveRemove(mockFileSystem, id);
      const countAfter = countAllItems(mockFileSystem);

      console.log(`[API_CLIENT][deleteItem] Terminé. Items: ${countBefore} -> ${countAfter}`);
      return { success: true, purgedChunks: totalPurged };
    } catch (error) {
      console.error('[API_CLIENT][deleteItem] Erreur:', error);
      throw error;
    }
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    console.log(`[API_CLIENT][createFolder] Nouveau dossier: ${name}`);
    const newFolder: FileSystemItem = {
      id: Math.random().toString(36).substring(7),
      name,
      type: 'folder',
      parentId,
      children: []
    };
    mockFileSystem = addItemToParent(mockFileSystem, parentId, newFolder);
    return newFolder;
  },

  async getStats(): Promise<Stats> {
    const countDocs = (items: FileSystemItem[]): { docs: number, chunks: number, size: number } => {
      return items.reduce((acc, item) => {
        if (item.type === 'file') {
          acc.docs += 1;
          acc.chunks += (item.chunks || 0);
          acc.size += (item.size || 0);
        } else if (item.children) {
          const sub = countDocs(item.children);
          acc.docs += sub.docs;
          acc.chunks += sub.chunks;
          acc.size += sub.size;
        }
        return acc;
      }, { docs: 0, chunks: 0, size: 0 });
    };
    const totals = countDocs(mockFileSystem);
    return {
      totalDocuments: totals.docs,
      totalChunks: totals.chunks,
      totalSize: totals.size,
      diskSpace: { total: "Local", used: "0.1 GB", free: "Illimité" }
    };
  },

  async getFileSystem(): Promise<FileSystemItem[]> {
    return [...mockFileSystem];
  },

  async getDocChunks(docId: string): Promise<ChunkMetadata[]> {
    return Array.from({ length: 3 }, (_, i) => ({
      id: `chunk-${docId}-${i}`,
      docId: docId,
      index: i + 1,
      text: `Extrait vectorisé du segment ${i + 1}. Analyse sémantique via text-embedding-004.`,
      size: 1000
    }));
  }
};
