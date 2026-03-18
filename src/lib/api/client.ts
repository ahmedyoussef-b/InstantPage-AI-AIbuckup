/**
 * @fileOverview API Client Elite - Orchestration AI Complete.
 * Version 32.1 Integrée : Support de l'indexation hiérarchique.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';
import { getPendingReviews } from '@/ai/learning/spaced-repetition';
import { shareKnowledge } from '@/ai/learning/collaborative-network';

const STORAGE_KEY = 'AGENTIC_VFS_ELITE_V32';
const MEMORY_KEY = 'AGENTIC_EPISODIC_MEMORY_V1';
const RULES_KEY = 'AGENTIC_DISTILLED_RULES_V1';
const REPETITION_KEY = 'AGENTIC_SPACED_REP_V1';
const INSTANCE_ID = typeof window !== 'undefined' ? (localStorage.getItem('AGENTIC_INSTANCE_ID') || `inst-${Math.random().toString(36).substring(7)}`) : 'server-node';

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
      graphNodes: result.graphData?.nodes,
      hierarchy: result.hierarchy // Nouveau: Données de taxonomie
    } as any;

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.chunks };
  },

  async chat(query: string, history: any[] = []): Promise<any> {
    const fs = loadLocalFS();
    const files = fs.filter(i => i.type === 'file');
    
    // 1. PHASE 1: COMPRENDRE - Préparation du contexte vectoriel multi-strates
    const docContext = await hybridRAG.retrieve(query, files);
    const episodicMemory = loadMemory();
    const distilledRules = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
    
    // Récupération de tous les nœuds de hiérarchie pour l'expansion sémantique
    const allHierarchyNodes = files.flatMap(f => (f as any).hierarchy?.nodes || []);
    
    implicitRL.loadProfile();
    const userProfile = implicitRL.getProfile();

    // 2. APPEL ORCHESTRATEUR CENTRAL (Intégrant la hiérarchie)
    const response = await serverChat({ 
      text: query, 
      history: history.map(msg => ({ 
        role: msg.role === 'user' ? 'user' : 'model', 
        content: [{ text: msg.text || '' }] 
      })),
      documentContext: docContext,
      episodicMemory: episodicMemory,
      distilledRules: distilledRules,
      userProfile: userProfile,
      // On passe les nœuds hiérarchiques à l'orchestrateur (extension ChatInput)
      hierarchyNodes: allHierarchyNodes
    } as any);

    // 3. PHASE 4: APPRENDRE
    if (response.newMemoryEpisode) {
      const updatedMemory = [{
        ...response.newMemoryEpisode,
        id: `epi-${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now()
      }, ...episodicMemory];
      await saveMemory(updatedMemory);
      
      if (response.confidence > 0.9) {
        const mockRule = { instruction: response.answer.substring(0, 100), domain: 'Technique', confidence: response.confidence, id: 'rule-auto', pattern: 'Automatic' };
        shareKnowledge(INSTANCE_ID, mockRule as any).catch(() => {});
      }
    }

    return { 
      ...response, 
      answer: continuousLearning.applyRules(response.answer) 
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
    const success = await continuousLearning.recordCorrection(original, corrected);
    await implicitRL.processSignal('CORRECTION', { isTechnical: true });
    return success;
  },

  async clearAll(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MEMORY_KEY);
      localStorage.removeItem(RULES_KEY);
      localStorage.removeItem(REPETITION_KEY);
    }
  }
};
