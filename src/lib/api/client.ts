'use client';

import { Document, Stats } from '@/types';

/**
 * Client-side API simulation for the Agentic Personal Assistant.
 * Implements the RAG ingestion logic: Extraction, Chunking (1000 chars), and Metadata storage.
 */
export const api = {
  /**
   * Simulates the RAG ingestion process.
   * 1. File Reading
   * 2. Text Extraction (Simulated)
   * 3. Chunking (1000 characters per chunk)
   * 4. Embedding & Vector Storage (Simulated)
   */
  async upload(file: File): Promise<{ success: boolean; chunks: number; docId: string }> {
    // Simulate reading and processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // In a real RAG system:
    // const text = await extractText(file);
    // const chunks = chunkText(text, 1000); 
    
    // Simulation: Assume average character count based on file size (approx 1 byte per char)
    const estimatedChars = file.size;
    const chunks = Math.max(1, Math.ceil(estimatedChars / 1000));
    
    return {
      success: true,
      chunks,
      docId: Math.random().toString(36).substring(7),
    };
  },

  /**
   * Simulates RAG-based chat interaction.
   * Context is retrieved from ChromaDB (simulated) and passed to Genkit.
   */
  async chat(query: string): Promise<{ answer: string; sources: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 1800));

    const responses = [
      "D'après l'analyse de vos documents (ChromaDB), la stratégie recommandée est centrée sur l'acquisition d'utilisateurs.",
      "Le système RAG a identifié une croissance de 15% dans vos derniers rapports financiers indexés.",
      "La documentation technique (MD/PDF) précise que la maintenance doit être planifiée toutes les 500 heures.",
      "Analyse contextuelle terminée : vos documents traitent principalement de l'optimisation des ressources locales."
    ];

    return {
      answer: responses[Math.floor(Math.random() * responses.length)],
      sources: ["Strategie_Q1.md", "Rapport_Annuel_2023.pdf"]
    };
  },

  async getStats(): Promise<Stats> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalDocuments: 12,
      totalChunks: 452, // Updated to reflect 1000-char chunks
      totalSize: 4500000,
      diskSpace: {
        total: "Local Storage",
        used: "15 MB",
        free: "Illimité"
      }
    };
  },

  async getDocuments(): Promise<Document[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "1",
        name: "Rapport Annuel 2023.pdf",
        size: 1200000,
        chunks: 120, // 1.2MB / 1000 chars
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
        name: "Configuration.json",
        size: 15000,
        chunks: 15,
        uploadedAt: new Date().toISOString()
      }
    ];
  }
};
