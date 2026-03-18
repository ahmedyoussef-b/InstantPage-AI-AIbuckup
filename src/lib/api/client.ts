/**
 * @fileOverview API Client - Gestionnaire de la base de données locale persistante (VFS).
 * Intègre désormais l'Apprentissage par Renforcement Implicite (Innovation 26).
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';

const STORAGE_KEY = 'AGENTIC_VFS_STABLE_V13';
const DEMO_KEY = 'AGENTIC_DEMOS_V1';
const MEMORY_KEY = 'AGENTIC_EPISODIC_MEMORY_V1';

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

const loadDemonstrations = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveDemonstration = (demo: any) => {
  if (typeof window === 'undefined') return;
  const current = loadDemonstrations();
  const updated = [demo, ...current].slice(0, 20);
  localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
};

// Variable pour la détection de répétition/reformulation
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
    
    // --- INNOVATION 26: SIGNaux IMPLICITES ---
    implicitRL.loadProfile();
    const now = Date.now();
    
    // 1. Détection de Reformulation (Même intention en < 30s)
    if (lastQueryText && query.length > 5 && now - lastQueryTime < 30000) {
      const similarity = query.toLowerCase().includes(lastQueryText.toLowerCase().substring(0, 10)) ? 0.8 : 0;
      if (similarity > 0.5) {
        await implicitRL.processSignal('REFORMULATION', { isLong: false });
      }
    }
    
    // 2. Détection d'Hésitation (Long délai entre deux messages techniques)
    if (lastQueryTime > 0 && now - lastQueryTime > 300000) { // 5 mins
       await implicitRL.processSignal('HESITATION', {});
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
      episodicMemory: episodicMemory
    });

    const correctedAnswer = continuousLearning.applyRules(response.answer);
    
    // 3. Signal d'Acceptation tacite
    if (history.length > 0 && query.length < 15) {
      implicitRL.processSignal('ACCEPTANCE', { isLong: response.answer.length > 200 });
    }

    // 4. Signal d'Usage (si l'IA a pris une action et que l'utilisateur continue)
    if (response.actionTaken) {
      saveDemonstration({
        timestamp: Date.now(),
        context: query,
        action: response.actionTaken,
        result: response.answer.substring(0, 100)
      });
      await implicitRL.processSignal('USAGE', { isTechnical: true });
    }

    // Mémorisation épisodique (Innovation 25)
    if (response.newMemoryEpisode) {
      const updatedMemory = [{
        ...response.newMemoryEpisode,
        id: `epi-${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now()
      }, ...episodicMemory];
      saveMemory(updatedMemory);
    }

    return { ...response, answer: correctedAnswer };
  },

  async submitCorrection(original: string, corrected: string): Promise<boolean> {
    // --- INNOVATION 26: SIGNAL RL NÉGATIF ---
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
