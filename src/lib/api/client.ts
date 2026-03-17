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
      },
      {
        id: "folder-sub",
        name: "Archives Techniques",
        type: "folder",
        parentId: "root-1",
        children: [
          {
            id: "file-old",
            name: "Ancien_Plan_V1.txt",
            type: "file",
            size: 1200,
            chunks: 2,
            uploadedAt: new Date(2023, 11, 15).toISOString(),
            parentId: "folder-sub"
          }
        ]
      }
    ]
  },
  {
    id: "root-2",
    name: "Éducation & Recherche",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "file-2",
        name: "Cours_Physique_Particules.md",
        type: "file",
        size: 25000,
        chunks: 8,
        uploadedAt: new Date().toISOString(),
        parentId: "root-2"
      }
    ]
  }
];

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
 * Helper pour supprimer un élément par ID récursivement
 */
const removeItemById = (items: FileSystemItem[], id: string): FileSystemItem[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: item.children ? removeItemById(item.children, id) : []
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
    console.log(`[API_CLIENT][upload] Ingestion du fichier: ${file.name} (ParentID: ${parentId || 'Racine'})`);
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
      console.error('[API_CLIENT][upload] Erreur lors de l\'ingestion:', error);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    console.log(`[API_CLIENT][chat] Envoi de la requête: "${query}"`);
    try {
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        content: [{ text: msg.text }]
      }));
      const result = await serverChat({ text: query, history: genkitHistory });
      return { answer: result.answer, sources: result.sources || [] };
    } catch (error) {
      console.error('[API_CLIENT][chat] Erreur conversationnelle:', error);
      throw error;
    }
  },

  async clearAll(): Promise<boolean> {
    console.log(`[API_CLIENT][clearAll] Suppression des fichiers et chunks. Conservation des répertoires.`);
    return new Promise(resolve => {
      setTimeout(() => {
        mockFileSystem = clearFilesOnly(mockFileSystem);
        resolve(true);
      }, 800);
    });
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    console.log(`[API_CLIENT][deleteItem] Suppression récursive de l'élément: ${id} (${name})`);
    
    let totalPurgedChunks = 0;

    const findAndPurge = async (items: FileSystemItem[], targetId: string): Promise<boolean> => {
      for (const item of items) {
        if (item.id === targetId) {
          // Si c'est un fichier, on purge ses chunks
          if (item.type === 'file') {
            const res = await deleteDocument({ docId: item.id, fileName: item.name });
            totalPurgedChunks += res.purgedChunks;
          } else if (item.children) {
            // Si c'est un dossier, on purge récursivement tous les fichiers à l'intérieur
            const purgeRecursive = async (subItems: FileSystemItem[]) => {
              for (const sub of subItems) {
                if (sub.type === 'file') {
                  const res = await deleteDocument({ docId: sub.id, fileName: sub.name });
                  totalPurgedChunks += res.purgedChunks;
                }
                if (sub.children) await purgeRecursive(sub.children);
              }
            };
            await purgeRecursive(item.children);
          }
          return true;
        }
        if (item.children && await findAndPurge(item.children, targetId)) {
          return true;
        }
      }
      return false;
    };

    try {
      await findAndPurge(mockFileSystem, id);
      mockFileSystem = removeItemById(mockFileSystem, id);
      console.log(`[API_CLIENT][deleteItem] Suppression terminée. ${totalPurgedChunks} segments purgés.`);
      return { success: true, purgedChunks: totalPurgedChunks };
    } catch (error) {
      console.error('[API_CLIENT][deleteItem] Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    console.log(`[API_CLIENT][createFolder] Création du dossier: ${name} (Parent: ${parentId})`);
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
      diskSpace: { total: "Local", used: "0.4 GB", free: "Illimité" }
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
      text: `Extrait vectorisé du segment ${i + 1}. Analyse sémantique en cours...`,
      size: 1000
    }));
  }
};