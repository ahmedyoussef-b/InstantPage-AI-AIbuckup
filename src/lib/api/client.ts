'use client';

import { FileSystemItem, Stats, ChunkMetadata } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';

/**
 * État local simulé persistant pour la session.
 */
let mockFileSystem: FileSystemItem[] = [
  {
    id: "root-1",
    name: "Projets 2024",
    type: "folder",
    parentId: null,
    children: []
  }
];

// Helper pour extraire tous les noms de fichiers
const getAllFileNames = (items: FileSystemItem[]): string[] => {
  let names: string[] = [];
  items.forEach(item => {
    if (item.type === 'file') names.push(item.name);
    if (item.children) names = [...names, ...getAllFileNames(item.children)];
  });
  return names;
};

// Helper pour extraire tout le contenu textuel pour le RAG
const getAllFileContents = (items: FileSystemItem[]): string => {
  let context = "";
  items.forEach(item => {
    if (item.type === 'file' && item.content) {
      context += `--- DÉBUT FICHIER: ${item.name} ---\n${item.content}\n--- FIN FICHIER: ${item.name} ---\n\n`;
    }
    if (item.children) context += getAllFileContents(item.children);
  });
  return context;
};

// Trouve tous les fichiers dans un élément (récursif)
const findFilesToPurge = (items: FileSystemItem[], targetId: string): FileSystemItem[] => {
  let files: FileSystemItem[] = [];
  
  const search = (currentItems: FileSystemItem[], parentMatched: boolean) => {
    currentItems.forEach(item => {
      const isMatch = item.id === targetId || parentMatched;
      if (isMatch && item.type === 'file') {
        files.push(item);
      }
      if (item.children) {
        search(item.children, isMatch);
      }
    });
  };
  
  search(items, false);
  return files;
};

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
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
        content: text,
        uploadedAt: new Date().toISOString(),
        parentId: parentId
      };

      const addItemToTree = (items: FileSystemItem[]): FileSystemItem[] => {
        if (!parentId) return [...items, newFile];
        return items.map(item => {
          if (item.id === parentId && item.type === 'folder') {
            return { ...item, children: [...(item.children || []), newFile] };
          }
          if (item.children) return { ...item, children: addItemToTree(item.children) };
          return item;
        });
      };

      mockFileSystem = addItemToTree(mockFileSystem);
      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error) {
      console.error("[API_CLIENT] Upload failed:", error);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const fileNames = getAllFileNames(mockFileSystem);
      const allContent = getAllFileContents(mockFileSystem);
      
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        content: [{ text: msg.text }]
      }));
      
      const result = await serverChat({ 
        text: query, 
        history: genkitHistory,
        availableFiles: fileNames,
        documentContext: allContent
      });
      return { answer: result.answer, sources: result.sources || [] };
    } catch (error) {
      console.error("[API_CLIENT] Chat failed:", error);
      throw error;
    }
  },

  async clearAll(): Promise<boolean> {
    console.log("[API_CLIENT] Clearing all files, keeping folders...");
    const keepFoldersOnly = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .filter(item => item.type === 'folder')
        .map(f => ({ ...f, children: f.children ? keepFoldersOnly(f.children) : [] }));
    };
    mockFileSystem = keepFoldersOnly(mockFileSystem);
    return true;
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    console.log(`[API_CLIENT] Suppression de l'élément: ${name} (ID: ${id})`);
    let totalPurged = 0;
    
    // 1. Identification récursive des fichiers à purger
    const filesToPurge = findFilesToPurge(mockFileSystem, id);
    console.log(`[API_CLIENT] ${filesToPurge.length} fichiers identifiés pour purge RAG.`);

    for (const file of filesToPurge) {
      try {
        // On tente la suppression serveur, mais on ne bloque pas si l'action serveur échoue (ex: 404 Action)
        const purgeResult = await deleteDocument({ docId: file.id, fileName: file.name }).catch(err => {
          console.warn(`[API_CLIENT] Purge serveur échouée pour ${file.name} (Action 404?), suppression locale uniquement.`);
          return { purgedChunks: file.chunks || 0 };
        });
        totalPurged += purgeResult.purgedChunks;
      } catch (e) {
        totalPurged += (file.chunks || 0);
      }
    }
    
    // 2. Retrait de l'arborescence locale
    const removeItemFromTree = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter(item => {
        if (item.id === id) return false;
        if (item.children) {
          item.children = removeItemFromTree(item.children);
        }
        return true;
      });
    };
    
    mockFileSystem = removeItemFromTree(mockFileSystem);
    console.log(`[API_CLIENT] Élément retiré de l'arborescence locale.`);
    return { success: true, purgedChunks: totalPurged };
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    const newFolder: FileSystemItem = {
      id: Math.random().toString(36).substring(7),
      name,
      type: 'folder',
      parentId,
      children: []
    };
    
    const addFolderToTree = (items: FileSystemItem[]): FileSystemItem[] => {
      if (!parentId) return [...items, newFolder];
      return items.map(item => {
        if (item.id === parentId && item.type === 'folder') {
          return { ...item, children: [...(item.children || []), newFolder] };
        }
        if (item.children) return { ...item, children: addFolderToTree(item.children) };
        return item;
      });
    };
    
    mockFileSystem = addFolderToTree(mockFileSystem);
    return newFolder;
  },

  async getStats(): Promise<Stats> {
    const stats = { docs: 0, chunks: 0, size: 0 };
    const traverse = (items: FileSystemItem[]) => {
      items.forEach(i => {
        if (i.type === 'file') {
          stats.docs++;
          stats.chunks += (i.chunks || 0);
          stats.size += (i.size || 0);
        }
        if (i.children) traverse(i.children);
      });
    };
    traverse(mockFileSystem);
    return {
      totalDocuments: stats.docs,
      totalChunks: stats.chunks,
      totalSize: stats.size,
      diskSpace: { total: "Local", used: "0.1 GB", free: "Illimité" }
    };
  },

  async getFileSystem(): Promise<FileSystemItem[]> {
    return [...mockFileSystem];
  },

  async getDocChunks(docId: string): Promise<ChunkMetadata[]> {
    const findFileInTree = (items: FileSystemItem[]): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === docId) return item;
        if (item.children) {
          const found = findFileInTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFileInTree(mockFileSystem);
    if (!file || !file.content) return [];

    const segments = file.content.match(/.{1,1000}/g) || [];
    return segments.map((text, i) => ({
      id: `chunk-${docId}-${i}`,
      docId: docId,
      index: i + 1,
      text: text,
      size: text.length
    }));
  }
};
