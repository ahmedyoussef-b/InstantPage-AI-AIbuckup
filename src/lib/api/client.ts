/**
 * @fileOverview API Client Elite - Orchestrateur de Décision Amélioré.
 * Support du pipeline ML complet et du routage intelligent RAG/Agent.
 */
import { FileSystemItem, Stats } from '@/types';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
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
  const optimized = await applyForgetting(episodes);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(optimized));
};

/**
 * Utilitaire pour parser le JSON de manière sécurisée.
 */
async function safeJsonParse(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  const text = await res.text();
  throw new Error(`Réponse invalide du serveur (${res.status}). Attendu JSON, reçu: ${text.substring(0, 50)}...`);
}

export const api = {
  /**
   * Pipeline d'ingestion avec enrichissement sémantique (Phase 1).
   */
  async upload(file: File, parentId: string | null = null): Promise<any> {
    const fs = loadLocalFS();
    const text = await file.text();
    
    // Appel à l'API d'ingestion Elite
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'default-user');
    
    const res = await fetch('/api/ingest', { method: 'POST', body: formData });
    
    if (!res.ok) {
      const errorData = await safeJsonParse(res).catch(() => ({ error: "Erreur serveur inconnue" }));
      throw new Error(errorData.error || `Erreur lors de l'upload (${res.status})`);
    }

    const result = await safeJsonParse(res);

    const newFile: FileSystemItem = {
      id: result.documentId,
      name: file.name,
      type: 'file',
      size: file.size,
      chunks: result.stats.chunks,
      content: text,
      uploadedAt: new Date().toISOString(),
      parentId,
      tags: result.concepts || [],
      version: 1
    };

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.stats.chunks };
  },

  /**
   * ORCHESTRATEUR ELITE 32 - Routage intelligent et boucle d'apprentissage.
   */
  async chat(query: string, history: any[] = []): Promise<any> {
    console.log("[API][ORCHESTRATOR] Traitement de la demande...");

    // 1. ROUTING & EXECUTION via API Hybride
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

    if (!response.ok) {
      const errorData = await safeJsonParse(response).catch(() => ({ error: "Échec de la communication avec l'assistant." }));
      throw new Error(errorData.error || "Erreur de communication.");
    }
    
    const result = await safeJsonParse(response);

    // 2. APPRENTISSAGE : Enregistrement de l'épisode de mémoire (Phase 4)
    if (result.newMemoryEpisode) {
      const currentMemory = loadMemory();
      await saveMemory([result.newMemoryEpisode, ...currentMemory]);
    }

    // 3. AMÉLIORATION : Application des règles apprises localement (Innovation 28)
    const finalAnswer = continuousLearning.applyRules(result.answer);

    return { 
      ...result, 
      answer: finalAnswer
    };
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

  async submitFeedback(query: string, response: string, rating: number): Promise<void> {
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
