/**
 * @fileOverview API Client Elite - Orchestration AI Complete.
 * Support du pipeline ML complet et des missions Agentic complexes.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { processAgentMission } from '@/ai/agent/agent-core';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { hybridRAG } from '@/ai/hybrid-rag';
import { continuousLearning } from '@/ai/continuous-learning';
import { applyForgetting, type Episode } from '@/ai/learning/episodic-memory';
import { implicitRL } from '@/ai/learning/implicit-rl';
import { feedbackLoop } from '@/ai/ml/feedback-loop';

const STORAGE_KEY = 'AGENTIC_VFS_ELITE_V32';
const MEMORY_KEY = 'AGENTIC_EPisodic_MEMORY_V1';
const RULES_KEY = 'AGENTIC_DISTILLED_RULES_V1';

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
      version: 1
    };

    saveLocalFS([...fs, newFile]);
    return { success: true, chunks: result.chunks };
  },

  async chat(query: string, history: any[] = []): Promise<any> {
    const isComplex = (query.match(/et|ensuite|puis|organise|prépare|envoie/gi) || []).length > 1;

    if (isComplex) {
      console.log("[API] Mission complexe -> Agentic Mode");
      const agentRes = await processAgentMission(query, 'default-user');
      return {
        answer: agentRes.summary,
        sources: [],
        confidence: 0.95,
        isAgentMission: true,
        steps: agentRes.steps
      };
    }

    const fs = loadLocalFS();
    const searchableDocs = fs.filter(i => i.type === 'file');
    const docContext = await hybridRAG.retrieve(query, searchableDocs);
    const episodicMemory = loadMemory();
    
    implicitRL.loadProfile();
    const response = await serverChat({ 
      text: query, 
      history: history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', content: [{ text: msg.text || '' }] })),
      documentContext: docContext,
      episodicMemory: episodicMemory,
      distilledRules: [],
      userProfile: implicitRL.getProfile()
    } as any);

    if (response.newMemoryEpisode) {
      await saveMemory([response.newMemoryEpisode, ...episodicMemory]);
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
    return await continuousLearning.recordCorrection(original, corrected);
  },

  async getTrainingDashboard(): Promise<any> {
    const res = await fetch('/api/ml/dashboard');
    return res.json();
  }
};
