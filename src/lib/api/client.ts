/**
 * @fileOverview API Client Elite - Orchestrateur de Décision Amélioré.
 * Support du pipeline ML complet et du routage intelligent RAG/Agent.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { processAgentMission } from '@/ai/agent/agent-core';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
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

export const api = {
  /**
   * Pipeline d'ingestion avec enrichissement sémantique.
   */
  async upload(file: File, parentId: string | null = null): Promise<any> {
    const fs = loadLocalFS();
    const text = await file.text();
    const result = await ingestDocument({ fileName: file.name, fileContent: text, fileType: file.type });

    const newFile: FileSystemItem = {
      id: result.docId,
      name: file.name,
      type: 'file',
      size: file.size,
      chunks: result.chunks,
      content: text,
      uploadedAt: new Date().toISOString(),
      parentId,
      tags: result.concepts,
      version: 1
    };

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.chunks };
  },

  /**
   * ORCHESTRATEUR AMÉLIORÉ - Routage intelligent et boucle d'apprentissage.
   */
  async chat(query: string, history: any[] = []): Promise<any> {
    // 1. ANALYSE & ROUTING - Détection de mission complexe
    const isComplex = (query.match(/et|ensuite|puis|organise|prépare|envoie|planifie|calcule/gi) || []).length > 1;

    let result;

    if (isComplex) {
      // workflow Agentic (Phase 2 & 3)
      console.log("[API][ORCHESTRATOR] Routage -> Mission Agentic Elite");
      const agentRes = await processAgentMission(query, 'default-user');
      result = {
        answer: agentRes.summary,
        sources: [],
        confidence: 0.95,
        isAgentMission: true,
        steps: agentRes.steps,
        pedagogicalLevel: 'EXPERT'
      };
    } else {
      // workflow RAG Enhancée (Phase 1 & 2)
      console.log("[API][ORCHESTRATOR] Routage -> Chat RAG Enhancée");
      const fs = loadLocalFS();
      const searchableDocs = fs.filter(i => i.type === 'file');
      const docContext = await hybridRAG.retrieve(query, searchableDocs);
      const episodicMemory = loadMemory();
      
      implicitRL.loadProfile();
      result = await serverChat({ 
        text: query, 
        history: history.map(msg => ({ 
          role: msg.role === 'user' ? 'user' : 'model', 
          content: [{ text: msg.text || '' }] 
        })),
        documentContext: docContext,
        episodicMemory: episodicMemory,
        distilledRules: [],
        userProfile: implicitRL.getProfile()
      } as any);
    }

    // 2. VALIDATION & APPRENTISSAGE (Phase 4)
    if (result.newMemoryEpisode) {
      const currentMemory = loadMemory();
      await saveMemory([result.newMemoryEpisode, ...currentMemory]);
    }

    // 3. AMÉLIORATION - Application des règles apprises localement
    const finalAnswer = continuousLearning.applyRules(result.answer);

    return { 
      ...result, 
      answer: finalAnswer,
      learning: { recorded: true }
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

  async submitCorrection(original: string, corrected: string): Promise<boolean> {
    return await continuousLearning.recordCorrection(original, corrected);
  },

  async getTrainingDashboard(): Promise<any> {
    const res = await fetch('/api/training/dashboard');
    return res.json();
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
    return await res.json();
  }
};
