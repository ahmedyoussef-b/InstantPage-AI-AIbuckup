'use client';

/**
 * API Client avec BDD Locale Persistante.
 * Gère le stockage VFS (Virtual File System) dans le localStorage.
 * Ce module est strictement client.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';

const STORAGE_KEY = 'AGENTIC_VFS_STABLE_V5';

const loadLocalFS = (): FileSystemItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[API_CLIENT] Erreur lecture VFS locale:", e);
    return [];
  }
};

const saveLocalFS = (fs: FileSystemItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    const data = JSON.stringify(fs);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e: any) {
    console.error("[API_CLIENT] Erreur sauvegarde VFS:", e.message);
  }
};

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    const fs = loadLocalFS();
    
    const exists = fs.some(item => item.name === file.name && item.parentId === parentId);
    if (exists) {
      throw new Error(`Le fichier "${file.name}" est déjà présent dans ce dossier.`);
    }

    try {
      const text = await file.text();
      // L'ingestion et l'extraction de concepts se font côté serveur
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
        parentId,
        tags: result.concepts 
      };

      saveLocalFS([...fs, newFile]);
      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error: any) {
      console.error("[API_CLIENT] Upload failed:", error.message);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const fs = loadLocalFS();
      const files = fs.filter(i => i.type === 'file');
      
      // Le RAG Hybride (filtrage local) reste sur le client
      const context = await hybridRAG.retrieve(query, files);
      
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.text || '' }]
      }));
      
      return await serverChat({ 
        text: query, 
        history: genkitHistory,
        documentContext: context
      });
    } catch (error) {
      console.error("[API_CLIENT] Échec du chat intelligent:", error);
      throw error;
    }
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    const fs = loadLocalFS();
    const newFs = fs.filter(item => item.id !== id);
    saveLocalFS(newFs);
    deleteDocument({ docId: id, fileName: name }).catch(() => {});
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
    saveLocalFS([...fs, newFolder]);
    return { ...newFolder, children: [] };
  },

  async clearAll(): Promise<boolean> {
    saveLocalFS([]);
    return true;
  },

  async getStats(): Promise<Stats> {
    const fs = loadLocalFS();
    let docs = 0, chunks = 0, size = 0;
    fs.forEach(i => {
      if (i.type === 'file') {
        docs++;
        chunks += (i.chunks || 0);
        size += (i.size || 0);
      }
    });
    return {
      totalDocuments: docs,
      totalChunks: chunks,
      totalSize: size,
      diskSpace: { 
        total: "5 MB", 
        used: `${(size / 1024).toFixed(1)} KB`, 
        free: `${(5120 - size / 1024).toFixed(1)} KB` 
      }
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

  async getDocChunks(docId: string) {
    const fs = loadLocalFS();
    const file = fs.find(i => i.id === docId);
    if (!file || !file.content) return [];
    
    const chunks = [];
    const size = 1000;
    for (let i = 0; i < file.content.length; i += size) {
      chunks.push({
        id: `${docId}-${i}`,
        docId: docId,
        index: chunks.length + 1,
        text: file.content.substring(i, i + size),
        size: Math.min(size, file.content.length - i)
      });
    }
    return chunks;
  }
};
