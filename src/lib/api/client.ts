'use client';

import { Document, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';

/**
 * Client-side API for the Agentic Personal Assistant.
 * Connects to server-side Genkit flows for real AI intelligence.
 */
export const api = {
  /**
   * Simulates the RAG ingestion process.
   */
  async upload(file: File): Promise<{ success: boolean; chunks: number; docId: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const chunks = Math.max(1, Math.ceil(file.size / 1000));
    return {
      success: true,
      chunks,
      docId: Math.random().toString(36).substring(7),
    };
  },

  /**
   * Real RAG-based chat interaction via Genkit.
   * Maintains history for conversational memory.
   */
  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      // Map UI messages to Genkit history format
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
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

  async getStats(): Promise<Stats> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalDocuments: 3,
      totalChunks: 180,
      totalSize: 1260000,
      diskSpace: {
        total: "Local",
        used: "1.2 MB",
        free: "Illimité"
      }
    };
  },

  async getDocuments(): Promise<Document[]> {
    return [
      {
        id: "1",
        name: "Rapport Annuel 2023.pdf",
        size: 1200000,
        chunks: 120,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "2",
        name: "Strategie_Q1.md",
        size: 45000,
        chunks: 45,
        uploadedAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Notes_Reunion.txt",
        size: 15000,
        chunks: 15,
        uploadedAt: new Date().toISOString()
      }
    ];
  }
};
