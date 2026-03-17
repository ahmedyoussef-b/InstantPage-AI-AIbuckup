'use client';

import { Document, Stats } from '@/types';

/**
 * Client-side API simulation for the Agentic Personal Assistant.
 * In a production app, these would call Next.js Server Actions or API routes.
 */
export const api = {
  /**
   * Simulates uploading and chunking a document.
   */
  async upload(file: File): Promise<{ success: boolean; chunks: number; docId: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate chunk calculation (e.g., 1 chunk per 5KB)
    const chunks = Math.max(1, Math.ceil(file.size / 5000));
    
    return {
      success: true,
      chunks,
      docId: Math.random().toString(36).substring(7),
    };
  },

  /**
   * Simulates a chat interaction with the knowledge base.
   */
  async chat(query: string): Promise<{ answer: string; sources: string[] }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      "Basé sur vos documents, il semble que la stratégie recommandée soit de se concentrer sur l'acquisition d'utilisateurs au premier trimestre.",
      "Le rapport financier indique une croissance de 15% par rapport à l'année précédente.",
      "Selon le manuel, la procédure de maintenance doit être effectuée toutes les 500 heures d'utilisation.",
      "Vos documents ne mentionnent pas explicitement ce sujet, mais ils traitent de thèmes connexes comme l'optimisation des ressources."
    ];

    return {
      answer: responses[Math.floor(Math.random() * responses.length)],
      sources: ["document_reference_1.pdf", "notes_v2.txt"]
    };
  },

  /**
   * Retrieves overall statistics for the knowledge base.
   */
  async getStats(): Promise<Stats> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalDocuments: 12,
      totalChunks: 154,
      totalSize: 4500000, // 4.5 MB
      diskSpace: {
        total: "100 GB",
        used: "15 MB",
        free: "99.98 GB"
      }
    };
  },

  /**
   * Retrieves a list of uploaded documents.
   */
  async getDocuments(): Promise<Document[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "1",
        name: "Rapport Annuel 2023.pdf",
        size: 1200000,
        chunks: 45,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "2",
        name: "Notes de Réunion.txt",
        size: 15000,
        chunks: 3,
        uploadedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "3",
        name: "Strategie_Q1.md",
        size: 45000,
        chunks: 8,
        uploadedAt: new Date().toISOString()
      }
    ];
  }
};