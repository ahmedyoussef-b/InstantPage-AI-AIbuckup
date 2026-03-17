'use client';

import { FileSystemItem, Stats, ChunkMetadata } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';

/**
 * État local simulé persistant pour la session
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
        content: text, // On stocke le texte pour le passage au LLM
        uploadedAt: new Date().toISOString(),
        parentId: parentId
      };

      const addItem = (items: FileSystemItem[]): FileSystemItem[] => {
        if (!parentId) return [...items, newFile];
        return items.map(item => {
          if (item.id === parentId && item.type === 'folder') {
            return { ...item, children: [...(item.children || []), newFile] };
          }
          if (item.children) return { ...item, children: addItem(item.children) };
          return item;
        });
      };

      mockFileSystem = addItem(mockFileSystem);
      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error) {
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
      throw error;
    }
  },

  async clearAll(): Promise<boolean> {
    const keepFolders = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .filter(item => item.type === 'folder')
        .map(f => ({ ...f, children: f.children ? keepFolders(f.children) : [] }));
    };
    mockFileSystem = keepFolders(mockFileSystem);
    return true;
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    let totalPurged = 0;
    
    const removeItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter(item => {
        if (item.id === id) {
          // Si c'est un dossier, on pourrait compter les segments de ses enfants ici
          totalPurged += item.chunks || 0;
          return false;
        }
        if (item.children) {
          item.children = removeItem(item.children);
        }
        return true;
      });
    };
    
    mockFileSystem = removeItem(mockFileSystem);
    return { success: true, purgedChunks: totalPurged || 5 };
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    const newFolder: FileSystemItem = {
      id: Math.random().toString(36).substring(7),
      name,
      type: 'folder',
      parentId,
      children: []
    };
    const addFolder = (items: FileSystemItem[]): FileSystemItem[] => {
      if (!parentId) return [...items, newFolder];
      return items.map(item => {
        if (item.id === parentId && item.type === 'folder') {
          return { ...item, children: [...(item.children || []), newFolder] };
        }
        if (item.children) return { ...item, children: addFolder(item.children) };
        return item;
      });
    };
    mockFileSystem = addFolder(mockFileSystem);
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
    // On essaie de retrouver le fichier pour afficher son contenu réel par segments
    const findFile = (items: FileSystemItem[]): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === docId) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(mockFileSystem);
    if (!file || !file.content) return [];

    // On simule le découpage pour l'inspecteur
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
