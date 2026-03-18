/**
 * @fileOverview API Client Elite - Orchestration des 32 innovations côté client.
 * Gère la persistence atomique du VFS et la boucle d'apprentissage continue.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';
import { getPendingReviews, type KnowledgeItem, calculateNextReview } from '@/ai/learning/spaced-repetition';
import { shareKnowledge } from '@/ai/learning/collaborative-network';

const STORAGE_KEY = 'AGENTIC_VFS_ELITE_V32';
const DEMO_KEY = 'AGENTIC_DEMOS_V1';
const MEMORY_KEY = 'AGENTIC_EPISODIC_MEMORY_V1';
const RULES_KEY = 'AGENTIC_DISTILLED_RULES_V1';
const REPETITION_KEY = 'AGENTIC_SPACED_REP_V1';
const INSTANCE_ID = typeof window !== 'undefined' ? (localStorage.getItem('AGENTIC_INSTANCE_ID') || `inst-${Math.random().toString(36).substring(7)}`) : 'server-node';

if (typeof window !== 'undefined' && !localStorage.getItem('AGENTIC_INSTANCE_ID')) {
  localStorage.setItem('AGENTIC_INSTANCE_ID', INSTANCE_ID);
}

const loadLocalFS = (): FileSystemItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveLocalFS = (fs: FileSystemItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
};

const loadMemory = (): Episode[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveMemory = async (episodes: Episode[]) => {
  if (typeof window === 'undefined') return;
  const optimized = await applyForgetting(episodes);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(optimized));
};

const loadDistilledRules = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RULES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveDistilledRules = (rules: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
};

const loadRepetitionItems = (): KnowledgeItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REPETITION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveRepetitionItems = (items: KnowledgeItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REPETITION_KEY, JSON.stringify(items));
};

let lastQueryTime = 0;
let lastQueryText = '';

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    const fs = loadLocalFS();
    const text = await file.text();
    const result = await ingestDocument({ fileName: file.name, fileContent: text, fileType: file.type || 'text/plain' });

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
      graphNodes: result.graphData?.nodes
    } as any;

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.chunks, docId: result.docId };
  },

  async chat(query: string, history: any[] = []): Promise<any> {
    const fs = loadLocalFS();
    const files = fs.filter(i => i.type === 'file');
    
    // Phase 1: Comprendre (Context Retrieval)
    const context = await hybridRAG.retrieve(query, files);
    const episodicMemory = loadMemory();
    const distilledRules = loadDistilledRules();
    const repetitionItems = loadRepetitionItems();
    const pendingReviews = await getPendingReviews(repetitionItems);
    
    implicitRL.loadProfile();
    const now = Date.now();
    
    // Innovation 26: Signal de reformulation (Hesitation/Correction)
    if (lastQueryText && now - lastQueryTime < 30000) {
      if (query.toLowerCase().includes(lastQueryText.toLowerCase().substring(0, 10))) {
        await implicitRL.processSignal('REFORMULATION', { isLong: false });
      }
    }
    
    lastQueryTime = now;
    lastQueryText = query;

    const rlDirective = implicitRL.getSystemDirective();
    const genkitHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: [{ text: msg.text || '' }]
    }));
    
    // Appel au Cerveau Central (Server Action)
    const response = await serverChat({ 
      text: query + (rlDirective ? ` ${rlDirective}` : ""), 
      history: genkitHistory,
      documentContext: context,
      episodicMemory: episodicMemory,
      distilledRules: distilledRules,
      pendingReviews: pendingReviews
    });

    // Innovation 8: Post-traitement Apprentissage Continu
    const correctedAnswer = continuousLearning.applyRules(response.answer);
    
    // Innovation 28 & 32: Sauvegarde et Partage des connaissances
    if (response.distillationPerformed && response.newDistilledRules) {
      const mergedRules = [...response.newDistilledRules, ...distilledRules].slice(0, 50);
      saveDistilledRules(mergedRules);
      
      for (const rule of response.newDistilledRules) {
        shareKnowledge(INSTANCE_ID, rule).catch(() => {});
      }
    }

    // Phase 4: Apprendre (Update Memory & Spaced Repetition)
    if (response.newMemoryEpisode) {
      const updatedMemory = [{
        ...response.newMemoryEpisode,
        id: `epi-${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now()
      }, ...episodicMemory];
      await saveMemory(updatedMemory);
      
      // Auto-création item de révision si importance élevée
      if (response.confidence > 0.8 && response.newMemoryEpisode.content.length > 40) {
        const newItem: KnowledgeItem = {
          id: `rep-${Math.random().toString(36).substring(7)}`,
          content: response.newMemoryEpisode.content,
          concept: response.newMemoryEpisode.tags[0] || 'Technique',
          stability: 1,
          difficulty: 0.3,
          lastReview: Date.now(),
          nextReview: Date.now() + (24 * 60 * 60 * 1000),
          reviewsCount: 0
        };
        saveRepetitionItems([...repetitionItems, newItem]);
      }
    }

    return { ...response, answer: correctedAnswer };
  },

  async submitCorrection(original: string, corrected: string): Promise<boolean> {
    await implicitRL.processSignal('CORRECTION', { isLong: original.length > 200 });
    return await continuousLearning.recordCorrection(original, corrected);
  },

  async deleteItem(id: string, name: string): Promise<any> {
    const fs = loadLocalFS();
    saveLocalFS(fs.filter(item => item.id !== id));
    deleteDocument({ docId: id, fileName: name }).catch(() => {});
    return { success: true };
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    const fs = loadLocalFS();
    const folderId = Math.random().toString(36).substring(7);
    const newFolder: FileSystemItem = { id: folderId, name, type: 'folder', parentId, uploadedAt: new Date().toISOString() };
    saveLocalFS([...fs, newFolder]);
    return { ...newFolder, children: [] };
  },

  async getStats(): Promise<Stats> {
    const fs = loadLocalFS();
    let size = 0;
    fs.forEach(i => { if (i.type === 'file') size += (i.size || 0); });
    return { 
      totalDocuments: fs.filter(i => i.type === 'file').length, 
      totalChunks: fs.reduce((acc, curr) => acc + (curr.chunks || 0), 0),
      totalSize: size,
      diskSpace: { used: `${(size / (1024*1024)).toFixed(2)} MB`, total: '500 MB', free: '...' }
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

  async getDocChunks(docId: string) {
    const fs = loadLocalFS();
    const file = fs.find(i => i.id === docId);
    if (!file || !file.content) return [];
    // Simulation découpage segments
    return [{ id: 'c1', docId, index: 1, text: file.content.substring(0, 1000), size: 1000 }];
  }
};
