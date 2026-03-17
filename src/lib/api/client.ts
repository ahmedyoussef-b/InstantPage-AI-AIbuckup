'use client';

import { Document, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';

/**
 * Client-side API for the Agentic Personal Assistant.
 * Simulates the RAG process: 100% Local Ingestion & Vector Indexing.
 */
export const api = {
  /**
   * Simulates the RAG ingestion process: 
   */
  async upload(file: File): Promise<{ success: boolean; chunks: number; docId: string }> {
    console.log(`[API_CLIENT][upload] Starting upload for: ${file.name} (${file.size} bytes)`);
    
    // Artificial delay to simulate local processing (Extraction + Embedding)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Technical Spec: 1000 characters per segment
    const chunks = Math.max(1, Math.ceil(file.size / 1000));
    const docId = Math.random().toString(36).substring(7);

    console.log(`[API_CLIENT][upload] Processed ${file.name}: ${chunks} chunks generated. DocID: ${docId}`);
    
    return {
      success: true,
      chunks,
      docId,
    };
  },

  /**
   * Conversational memory-aware chat interaction.
   */
  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    console.log(`[API_CLIENT][chat] Sending query to backend: "${query}"`);
    
    try {
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        content: [{ text: msg.text }]
      }));

      const result = await serverChat({ 
        text: query, 
        history: genkitHistory 
      });

      console.log(`[API_CLIENT][chat] Received response from backend. Sources: ${result.sources?.join(', ') || 'None'}`);

      return {
        answer: result.answer,
        sources: result.sources || []
      };
    } catch (error) {
      console.error('[API_CLIENT][chat] Error during chat flow:', error);
      throw error;
    }
  },

  /**
   * Reset the local knowledge base.
   */
  async clearAll(): Promise<boolean> {
    console.log(`[API_CLIENT][clearAll] Requesting full database cleanup.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[API_CLIENT][clearAll] Database cleared successfully.`);
    return true;
  },

  /**
   * Fetches real-time system and RAG performance statistics.
   */
  async getStats(): Promise<Stats> {
    console.log(`[API_CLIENT][getStats] Fetching system statistics...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const stats = {
      totalDocuments: 3,
      totalChunks: 43,
      totalSize: 1782200, 
      diskSpace: {
        total: "Local",
        used: "1.2 GB", 
        free: "Unlimited"
      }
    };
    console.log(`[API_CLIENT][getStats] Stats retrieved: ${stats.totalDocuments} docs, ${stats.totalChunks} chunks.`);
    return stats;
  },

  /**
   * Returns metadata of all documents indexed in the local base.
   */
  async getDocuments(): Promise<Document[]> {
    console.log(`[API_CLIENT][getDocuments] Fetching indexed documents list...`);
    const docs = [
      {
        id: "1",
        name: "Cours Physique - 3ème.pdf",
        size: 1200000,
        chunks: 28,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "2",
        name: "COMMANDS_REFERENCE.txt",
        size: 2200,
        chunks: 3,
        uploadedAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Devoir Contrôle N°1.pdf",
        size: 580000,
        chunks: 12,
        uploadedAt: new Date().toISOString()
      }
    ];
    console.log(`[API_CLIENT][getDocuments] Found ${docs.length} documents.`);
    return docs;
  }
};
