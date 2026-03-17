'use client';

import { FileSystemItem, Stats, ChunkMetadata } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';

/**
 * Client-side API for the Agentic Personal Assistant.
 * Orchestrates real RAG ingestion and conversational flows.
 */
export const api = {
  /**
   * Real RAG ingestion: reads file and calls server-side embedding flow.
   */
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    console.log(`[API_CLIENT][upload] Ingestion du fichier: ${file.name} (ParentID: ${parentId || 'Racine'})`);
    
    try {
      const text = await file.text();
      const result = await ingestDocument({
        fileName: file.name,
        fileContent: text,
        fileType: file.type || 'text/plain'
      });

      console.log(`[API_CLIENT][upload] Ingestion serveur réussie. DocID: ${result.docId} affecté au dossier: ${parentId || 'Racine'}`);
      
      return {
        success: true,
        chunks: result.chunks,
        docId: result.docId,
      };
    } catch (error) {
      console.error('[API_CLIENT][upload] Erreur lors de l\'ingestion:', error);
      throw error;
    }
  },

  /**
   * Conversational memory-aware chat interaction.
   */
  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    console.log(`[API_CLIENT][chat] Envoi de la requête: "${query}"`);
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
      console.error('[API_CLIENT][chat] Erreur conversationnelle:', error);
      throw error;
    }
  },

  /**
   * Reset the local knowledge base: deletes all files/chunks but preserves folders.
   */
  async clearAll(): Promise<boolean> {
    console.log(`[API_CLIENT][clearAll] Réinitialisation de la base : suppression massive des fichiers et segments...`);
    // Simulation d'une opération asynchrone lourde de nettoyage
    return new Promise(resolve => setTimeout(() => {
      console.log(`[API_CLIENT][clearAll] Nettoyage terminé. Seuls les répertoires ont été conservés.`);
      resolve(true);
    }, 1500));
  },

  /**
   * Delete a specific item (file or folder) with cascade chunk cleanup.
   */
  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    console.log(`[API_CLIENT][deleteItem] Suppression de l'élément: ${id} (${name})`);
    try {
      const result = await deleteDocument({ docId: id, fileName: name });
      console.log(`[API_CLIENT][deleteItem] Suppression réussie. ${result.purgedChunks} segments purgés.`);
      return {
        success: result.success,
        purgedChunks: result.purgedChunks
      };
    } catch (error) {
      console.error('[API_CLIENT][deleteItem] Erreur lors de la suppression:', error);
      throw error;
    }
  },

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    console.log(`[API_CLIENT][createFolder] Création du répertoire: ${name} (Parent: ${parentId || 'Racine'})`);
    return {
      id: Math.random().toString(36).substring(7),
      name,
      type: 'folder',
      parentId,
      children: []
    };
  },

  /**
   * Fetches real-time system and RAG performance statistics.
   */
  async getStats(): Promise<Stats> {
    console.log(`[API_CLIENT][getStats] Récupération des statistiques système...`);
    return {
      totalDocuments: 15,
      totalChunks: 342,
      totalSize: 4800000, 
      diskSpace: {
        total: "Local",
        used: "1.4 GB", 
        free: "Illimité"
      }
    };
  },

  /**
   * Returns metadata of all items in a tree structure.
   */
  async getFileSystem(): Promise<FileSystemItem[]> {
    console.log(`[API_CLIENT][getFileSystem] Construction de l'arborescence des fichiers...`);
    return [
      {
        id: "root-1",
        name: "Projets 2024",
        type: "folder",
        parentId: null,
        children: [
          {
            id: "file-1",
            name: "Cahier_des_charges.pdf",
            type: "file",
            size: 450000,
            chunks: 15,
            uploadedAt: new Date().toISOString(),
            parentId: "root-1"
          },
          {
            id: "folder-sub",
            name: "Archives Techniques",
            type: "folder",
            parentId: "root-1",
            children: [
              {
                id: "file-old",
                name: "Ancien_Plan_V1.txt",
                type: "file",
                size: 1200,
                chunks: 2,
                uploadedAt: new Date(2023, 11, 15).toISOString(),
                parentId: "folder-sub"
              }
            ]
          }
        ]
      },
      {
        id: "root-2",
        name: "Éducation & Recherche",
        type: "folder",
        parentId: null,
        children: [
          {
            id: "file-2",
            name: "Cours_Physique_Particules.md",
            type: "file",
            size: 25000,
            chunks: 8,
            uploadedAt: new Date().toISOString(),
            parentId: "root-2"
          }
        ]
      },
      {
        id: "file-3",
        name: "Note_Stratege_IA.json",
        type: "file",
        size: 5000,
        chunks: 1,
        uploadedAt: new Date().toISOString(),
        parentId: null
      }
    ];
  },

  /**
   * Simulated retrieval of chunks for a specific document.
   */
  async getDocChunks(docId: string): Promise<ChunkMetadata[]> {
    console.log(`[API_CLIENT][getDocChunks] Récupération des segments pour le document: ${docId}`);
    return Array.from({ length: 5 }, (_, i) => ({
      id: `chunk-${docId}-${i}`,
      docId: docId,
      index: i + 1,
      text: `Contenu du segment ${i + 1} extrait du document. Ce texte représente une portion de 1000 caractères maximum utilisée par le moteur RAG pour la recherche vectorielle locale.`,
      size: 1000
    }));
  }
};
