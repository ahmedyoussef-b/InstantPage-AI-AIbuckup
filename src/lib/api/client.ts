/**
 * @fileOverview API Client - Gestionnaire de la base de données locale persistante (VFS).
 * Intègre désormais l'Intelligence Collective (Innovation 32).
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';
import { getPendingReviews, type KnowledgeItem } from '@/ai/learning/spaced-repetition';
import { shareKnowledge } from '@/ai/learning/collaborative-network';

const STORAGE_KEY = 'AGENTIC_VFS_STABLE_V13';
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

const loadDemonstrations = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
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
      tags: result.concepts
    };

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.chunks, docId: result.docId };
  },

  async chat(query: string, history: any[] = []): Promise<any> {
    const fs = loadLocalFS();
    const files = fs.filter(i => i.type === 'file');
    const context = await hybridRAG.retrieve(query, files);
    const demonstrations = loadDemonstrations();
    const episodicMemory = loadMemory();
    const distilledRules = loadDistilledRules();
    const repetitionItems = loadRepetitionItems();
    const pendingReviews = await getPendingReviews(repetitionItems);
    
    implicitRL.loadProfile();
    const now = Date.now();
    
    if (lastQueryText && query.length > 5 && now - lastQueryTime < 30000) {
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
    
    const response = await serverChat({ 
      text: query + (rlDirective ? ` ${rlDirective}` : ""), 
      history: genkitHistory,
      documentContext: context,
      demonstrationHistory: demonstrations,
      episodicMemory: episodicMemory,
      distilledRules: distilledRules,
      pendingReviews: pendingReviews
    });

    const correctedAnswer = continuousLearning.applyRules(response.answer);
    
    // Innovation 28 & 32: Sauvegarde et Partage des règles distillées
    if (response.distillationPerformed && response.newDistilledRules) {
      const mergedRules = [...response.newDistilledRules, ...distilledRules].slice(0, 30);
      saveDistilledRules(mergedRules);
      
      // Partager les nouvelles règles avec le réseau (Innovation 32)
      for (const rule of response.newDistilledRules) {
        shareKnowledge(INSTANCE_ID, rule).catch(() => {});
      }
    }

    if (response.newMemoryEpisode) {
      const updatedMemory = [{
        ...response.newMemoryEpisode,
        id: `epi-${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now()
      }, ...episodicMemory];
      saveMemory(updatedMemory);
      
      if (response.confidence > 0.85 && response.newMemoryEpisode.content.length > 50) {
        const newItem: KnowledgeItem = {
          id: `rep-${Math.random().toString(36).substring(7)}`,
          content: response.newMemoryEpisode.content,
          concept: response.newMemoryEpisode.tags[0] || 'Général',
          stability: 1,
          difficulty: 0.3,
          lastReview: Date.now(),
          nextReview: Date.now() + (24 * 60 * 60 * 1000),
          reviewsCount: 0
        };
        saveRepetitionItems([...repetitionItems, newItem]);
      }
    }

    return { 
      ...response, 
      answer: correctedAnswer
    };
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

  async getStats(): Promise<any> {
    const fs = loadLocalFS();
    let size = 0;
    fs.forEach(i => { if (i.type === 'file') size += (i.size || 0); });
    return { totalDocuments: fs.filter(i => i.type === 'file').length, totalSize: size };
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
    return [{ id: '1', text: file.content.substring(0, 1000), index: 1 }];
  }
};
