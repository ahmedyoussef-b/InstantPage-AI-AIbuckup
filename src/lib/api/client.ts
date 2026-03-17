
'use client';

import { Document, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';

/**
 * Client-side API for the Agentic Personal Assistant.
 * Simulates the RAG process: Extraction, 1000-char Chunking, and Vector Indexing.
 */
export const api = {
  /**
   * Simulates the RAG ingestion process: 
   * 1. Extraction 2. Chunking (1000 chars) 3. Embedding 4. Vector Storage
   */
  async upload(file: File): Promise<{ success: boolean; chunks: number; docId: string }> {
    // Artificial delay to simulate local processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Chunking logic: 1000 characters per segment as per user requirements
    // We simulate character extraction from the file size for this MVP
    // Assuming roughly 1 byte per character for basic text
    const chunks = Math.max(1, Math.ceil(file.size / 1000));
    
    return {
      success: true,
      chunks,
      docId: Math.random().toString(36).substring(7),
    };
  },

  /**
   * Real agentic chat interaction via Genkit.
   */
  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        content: [{ text: msg.text }]
      }));

      const result = await serverChat({ 
        text: query, 
        history: genkitHistory 
      });

      return {
        answer: result.answer,
        sources: result.sources || []
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  /**
   * Clear the entire local vector database.
   */
  async clearAll(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  },

  /**
   * Fetches system and RAG performance statistics.
   */
  async getStats(): Promise<Stats> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalDocuments: 3,
      totalChunks: 43,
      totalSize: 1782200, 
      diskSpace: {
        total: "Local",
        used: "1.2 GB", 
        free: "Illimité"
      }
    };
  },

  /**
   * Returns list of documents indexed in the local base.
   */
  async getDocuments(): Promise<Document[]> {
    return [
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
  }
};
