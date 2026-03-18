/**
 * @fileOverview API Client Elite - Orchestrateur de Décision Amélioré.
 * Support du pipeline ML complet et du routage intelligent RAG/Agent.
 */
import { FileSystemItem, Stats } from '@/types';
import { continuousLearning } from '@/ai/continuous-learning';
import { type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';

const STORAGE_KEY = 'AGENTIC_VFS_ELITE_V32';
const MEMORY_KEY = 'AGENTIC_EPisodic_MEMORY_V1';

const loadLocalFS = (): FileSystemItem[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveLocalFS = (fs: FileSystemItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
};

const loadMemory = (): Episode[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]'); } catch { return []; }
};

const saveMemory = async (episodes: Episode[]) => {
  if (typeof window === 'undefined') return;
  // Note: applyForgetting est appelé côté serveur ou simulé ici pour éviter les imports 'use server'
  const optimized = episodes.slice(0, 50); 
  localStorage.setItem(MEMORY_KEY, JSON.stringify(optimized));
};

/**
 * Utilitaire pour parser le JSON de manière sécurisée.
 */
async function safeJsonParse(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch (e) {
      throw new Error("La réponse du serveur est malformée.");
    }
  }
  const text = await res.text();
  // Si on reçoit du HTML (erreur serveur), on extrait le message d'erreur si possible
  if (text.includes('<html>')) {
    throw new Error(`Erreur serveur (${res.status}). Veuillez vérifier que le backend est opérationnel.`);
  }
  throw new Error(`Réponse inattendue (${res.status}): ${text.substring(0, 100)}`);
}

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<any> {
    if (!(file instanceof File)) throw new Error("Le fichier est invalide.");
    
    const fs = loadLocalFS();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'default-user');
    
    const res = await fetch('/api/ingest', { method: 'POST', body: formData });
    const result = await safeJsonParse(res);

    if (result.error) throw new Error(result.error);

    const text = await file.text().catch(() => "");
    const newFile: FileSystemItem = {
      id: result.documentId || Math.random().toString(36).substring(7),
      name: file.name,
      type: 'file',
      size: file.size,
      chunks: result.stats?.chunks || 0,
      content: text,
      uploadedAt: new Date().toISOString(),
      parentId,
      tags: result.concepts || [],
      version: 1
    };

    saveLocalFS([...fs, newFile]);
    return result;
  },

  async chat(query: string, history: any[] = []): Promise<any> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: query,
        history: history,
        userId: 'default-user',
        mode: 'auto'
      })
    });

    const result = await safeJsonParse(response);
    if (result.error) throw new Error(result.error);

    if (result.newMemoryEpisode) {
      const currentMemory = loadMemory();
      await saveMemory([result.newMemoryEpisode, ...currentMemory]);
    }

    const finalAnswer = continuousLearning.applyRules(result.answer);
    return { ...result, answer: finalAnswer };
  },

  async deleteItem(id: string): Promise<any> {
    const fs = loadLocalFS();
    saveLocalFS(fs.filter(item => item.id !== id));
    return { success: true };
  },

  async getStats(): Promise<Stats> {
    const fs = loadLocalFS();
    let size = 0;
    fs.forEach(i => { if (i.type === 'file') size += (i.size || 0); });
    return { 
      totalDocuments: fs.filter(i => i.type === 'file').length, 
      totalChunks: fs.reduce((acc, curr) => acc + (curr.chunks || 0), 0),
      totalSize: size,
      diskSpace: { used: `${(size / 1024 / 1024).toFixed(2)} MB`, total: '500 MB', free: '...' }
    };
  },

  async getFileSystem(): Promise<FileSystemItem[]> {
    const allItems = loadLocalFS();
    const buildTree = (parentId: string | null): FileSystemItem[] => {
      return allItems.filter(item => item.parentId === parentId).map(item => ({
        ...item,
        children: item.type === 'folder' ? buildTree(item.id) : undefined
      }));
    };
    return buildTree(null);
  },

  async submitFeedback(query: string, _response: string, rating: number): Promise<void> {
    await implicitRL.processSignal(rating >= 4 ? 'ACCEPTANCE' : 'CORRECTION', { isTechnical: query.length > 50 });
  },

  async submitCorrection(original: string, corrected: string): Promise<boolean> {
    return await continuousLearning.recordCorrection(original, corrected);
  },

  async getTrainingDashboard(): Promise<any> {
    const res = await fetch('/api/training/dashboard');
    if (!res.ok) return { activeBrain: { accuracy: 0.72 }, pipelineStatus: {}, improvementTrend: [] };
    return safeJsonParse(res);
  },

  async revectorizeDocument(id: string): Promise<any> {
    const fs = loadLocalFS();
    const doc = fs.find(f => f.id === id);
    if (!doc) throw new Error("Document introuvable.");
    
    doc.version = (doc.version || 1) + 1;
    doc.lastRevectorized = new Date().toISOString();
    saveLocalFS([...fs]);
    return { version: doc.version };
  },

  async runGlobalOptimization(): Promise<any> {
    const fs = loadLocalFS();
    const memory = loadMemory();
    const res = await fetch('/api/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: fs, memory })
    });
    return await safeJsonParse(res);
  }
};
