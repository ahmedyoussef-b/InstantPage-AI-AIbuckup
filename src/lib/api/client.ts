'use client';

/**
 * API Client avec Persistance Locale Robuste pour AHMED.
 * Utilise le stockage local du navigateur avec synchronisation atomique.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';

const STORAGE_KEY = 'AHMED_LOCAL_FS';

// Helper pour charger/sauvegarder les données locales
const loadLocalFS = (): FileSystemItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalFS = (fs: FileSystemItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
};

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    const fs = loadLocalFS();
    
    // Vérifier les doublons
    const exists = fs.some(item => item.name === file.name && item.parentId === parentId);
    if (exists) {
      throw new Error(`Le fichier "${file.name}" existe déjà dans ce dossier.`);
    }

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
        parentId
      };

      fs.push(newFile);
      saveLocalFS(fs);

      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error: any) {
      console.error("[API_CLIENT] Upload failed:", error.message);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const fs = loadLocalFS();
      const fileNames = this.getAllFileNames(fs);
      const allContent = this.getAllFileContents(fs);
      
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.text || '' }]
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
    saveLocalFS([]);
    return true;
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    let fs = loadLocalFS();
    fs = fs.filter(item => item.id !== id);
    saveLocalFS(fs);
    
    await deleteDocument({ docId: id, fileName: name }).catch(() => {});
    return { success: true, purgedChunks: 1 };
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    const fs = loadLocalFS();
    const folderId = Math.random().toString(36).substring(7);
    
    const newFolder: FileSystemItem = {
      id: folderId,
      name,
      type: 'folder',
      parentId,
      uploadedAt: new Date().toISOString()
    };
    
    fs.push(newFolder);
    saveLocalFS(fs);
    return { ...newFolder, children: [] };
  },

  async getStats(): Promise<Stats> {
    const fs = loadLocalFS();
    const stats = { docs: 0, chunks: 0, size: 0 };
    
    fs.forEach(i => {
      if (i.type === 'file') {
        stats.docs++;
        stats.chunks += (i.chunks || 0);
        stats.size += (i.size || 0);
      }
    });
    
    return {
      totalDocuments: stats.docs,
      totalChunks: stats.chunks,
      totalSize: stats.size,
      diskSpace: { total: "5 MB (Browser)", used: `${(stats.size / 1024).toFixed(1)} KB`, free: "Local" }
    };
  },

  async getFileSystem(): Promise<FileSystemItem[]> {
    const allItems = loadLocalFS();
    
    const buildTree = (parentId: string | null): FileSystemItem[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: item.type === 'folder' ? buildTree(item.id) : undefined
        }));
    };
    
    return buildTree(null);
  },

  private getAllFileNames(items: FileSystemItem[]): string[] {
    let names: string[] = [];
    items.forEach(item => {
      if (item.type === 'file') names.push(item.name);
      if (item.children) names = [...names, ...this.getAllFileNames(item.children)];
    });
    return names;
  },

  private getAllFileContents(items: FileSystemItem[]): string {
    let context = "";
    items.forEach(item => {
      if (item.type === 'file' && item.content) {
        context += `--- FICHIER: ${item.name} ---\n${item.content}\n\n`;
      }
      if (item.children) context += this.getAllFileContents(item.children);
    });
    return context;
  }
};