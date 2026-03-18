/**
 * @fileOverview API Client - Gestionnaire de la base de données locale persistante (VFS).
 * Intègre désormais le moteur d'apprentissage continu et la mémoire analogique (Innovation 12).
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';

const STORAGE_KEY = 'AGENTIC_VFS_STABLE_V12';
const ANALOGY_KEY = 'AGENTIC_ANALOGIES_V1';

const loadLocalFS = (): FileSystemItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("[API_CLIENT] Erreur lecture BDD locale, réinitialisation...");
    return [];
  }
};

const saveLocalFS = (fs: FileSystemItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
  } catch (e: any) {
    console.error("[API_CLIENT] Quota localStorage dépassé ou erreur critique :", e.message);
  }
};

const loadAnalogies = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ANALOGY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveAnalogy = async (problem: string, solution: string) => {
  if (typeof window === 'undefined') return;
  try {
    // Note: Dans un vrai système, on générerait ici l'embedding via le serveur
    // Pour la stabilité du VFS, on stocke la paire texte pour indexation future
    const current = loadAnalogies();
    
    // Simulation d'un embedding simplifié (ou appel serveur si disponible)
    const newAnalogy = { 
      problem, 
      solution, 
      timestamp: Date.now(),
      embedding: Array(768).fill(0).map(() => Math.random() - 0.5) // Placeholder
    };

    const updated = [newAnalogy, ...current].slice(0, 50);
    localStorage.setItem(ANALOGY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("[API_CLIENT] Erreur sauvegarde analogie:", e);
  }
};

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    const fs = loadLocalFS();
    
    if (fs.some(item => item.name === file.name && item.parentId === parentId)) {
      throw new Error(`Le fichier "${file.name}" est déjà présent dans ce dossier.`);
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
        parentId,
        tags: result.concepts
      };

      (newFile as any).graphNodes = result.graphData?.nodes || [];

      const updatedFs = [...fs, newFile];
      saveLocalFS(updatedFs);
      
      return { success: true, chunks: result.chunks, docId: result.docId };
    } catch (error: any) {
      console.error("[API_CLIENT] Échec de l'indexation :", error.message);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[]; isAnalogical?: boolean }> {
    try {
      const fs = loadLocalFS();
      const files = fs.filter(i => i.type === 'file');
      const context = await hybridRAG.retrieve(query, files);
      const analogies = loadAnalogies();
      
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.text || '' }]
      }));
      
      const response = await serverChat({ 
        text: query, 
        history: genkitHistory,
        documentContext: context,
        analogyMemory: analogies
      });

      const correctedAnswer = continuousLearning.applyRules(response.answer);
      
      return {
        ...response,
        answer: correctedAnswer
      };
    } catch (error) {
      console.error("[API_CLIENT] Erreur lors du chat intelligent :", error);
      throw error;
    }
  },

  async submitCorrection(original: string, corrected: string): Promise<boolean> {
    const success = await continuousLearning.recordCorrection(original, corrected);
    if (success) {
      // Si l'utilisateur corrige, on sauvegarde comme une analogie positive pour l'Innovation 12
      await saveAnalogy(original, corrected);
    }
    return success;
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
    localStorage.removeItem(ANALOGY_KEY);
    return true;
  },

  async getStats(): Promise<Stats & { rulesCount: number; analogiesCount: number }> {
    const fs = loadLocalFS();
    const analogies = loadAnalogies();
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
        total: "VFS Browser Storage", 
        used: `${(size / 1024).toFixed(1)} KB`, 
        free: "Stable" 
      },
      rulesCount: continuousLearning.getRulesCount(),
      analogiesCount: analogies.length
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
