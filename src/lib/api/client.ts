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
 * Helper pour supprimer un élément par ID récursivement sans altérer les fichiers
 */
const removeItemById = (items: FileSystemItem[], id: string): FileSystemItem[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => {
      if (item.children && item.children.length > 0) {
        return { ...item, children: removeItemById(item.children, id) };
      }
      return item;
    });
};

/**
 * Helper pour supprimer récursivement les fichiers d'une structure (Reset Base)
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
 * Helper pour ajouter un élément à un parent spécifique
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
    console.log(`[API_CLIENT][upload] Ingestion: ${file.name} (Parent: ${parentId || 'Racine'})`);
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
    console.log(`[API_CLIENT][clearAll] Purge complète des fichiers.`);
    return new Promise(resolve => {
      setTimeout(() => {
        mockFileSystem = clearFilesOnly(mockFileSystem);
        resolve(true);
      }, 500);
    });
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    console.log(`[API_CLIENT][deleteItem] Suppression de l'élément: ${id} (${name})`);
    
    let totalPurgedChunks = 0;

    const findItem = (items: FileSystemItem[], targetId: string): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === targetId) return item;
        if (item.children) {
          const found = findItem(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const purgeRecursive = async (item: FileSystemItem) => {
      if (item.type === 'file') {
        const res = await deleteDocument({ docId: item.id, fileName: item.name });
        totalPurgedChunks += res.purgedChunks;
      }
      if (item.children) {
        for (const child of item.children) {
          await purgeRecursive(child);
        }
      }
    };

    try {
      const itemToPurge = findItem(mockFileSystem, id);
      if (itemToPurge) {
        await purgeRecursive(itemToPurge);
      }
      mockFileSystem = removeItemById(mockFileSystem, id);
      console.log(`[API_CLIENT][deleteItem] Succès. ${totalPurgedChunks} chunks purgés.`);
      return { success: true, purgedChunks: totalPurgedChunks };
    } catch (error) {
      console.error('[API_CLIENT][deleteItem] Erreur:', error);
      throw error;
    }
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
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
    return mockFileSystem;
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