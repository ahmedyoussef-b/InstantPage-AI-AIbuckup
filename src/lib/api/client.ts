
'use client';

/**
 * API Client avec persistance Firestore pour AHMED.
 * Remplace LocalStorage par une solution cloud robuste pour éviter la perte de données.
 */
import { FileSystemItem, Stats } from '@/types';
import { chat as serverChat } from '@/ai/flows/chat-flow';
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { deleteDocument } from '@/ai/flows/delete-document-flow';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();
const DEFAULT_USER_ID = 'AHMED_PRO_USER';

export const api = {
  async upload(file: File, parentId: string | null = null): Promise<{ success: boolean; chunks: number; docId: string }> {
    const db = firestore;
    
    // 1. Vérifier les doublons dans Firestore
    const docsRef = collection(db, 'users', DEFAULT_USER_ID, 'documents');
    const q = query(docsRef, where('name', '==', file.name), where('parentId', '==', parentId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error(`Le fichier "${file.name}" existe déjà dans ce dossier.`);
    }

    try {
      const text = await file.text();
      const result = await ingestDocument({
        fileName: file.name,
        fileContent: text,
        fileType: file.type || 'text/plain'
      });

      const docId = result.docId;
      const docRef = doc(db, 'users', DEFAULT_USER_ID, 'documents', docId);

      await setDoc(docRef, {
        id: docId,
        name: file.name,
        type: 'file',
        size: file.size,
        chunks: result.chunks,
        content: text,
        uploadedAt: new Date().toISOString(),
        parentId: parentId,
        userId: DEFAULT_USER_ID
      });

      return { success: true, chunks: result.chunks, docId };
    } catch (error: any) {
      console.error("[API_CLIENT] Upload failed:", error.message);
      throw error;
    }
  },

  async chat(query: string, history: any[] = []): Promise<{ answer: string; sources: string[] }> {
    try {
      const fs = await this.getFileSystem();
      const fileNames = this.getAllFileNames(fs);
      const allContent = this.getAllFileContents(fs);
      
      const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.text || '' }]
      }));
      
      const result = await serverChat({ 
        text: query, 
        history: genkitHistory,
        availableFiles: fileNames,
        documentContext: allContent
      });
      
      return { answer: result.answer, sources: result.sources || [] };
    } catch (error) {
      console.error("[API_CLIENT] Chat failed:", error);
      throw error;
    }
  },

  async clearAll(): Promise<boolean> {
    const db = firestore;
    const batch = writeBatch(db);
    
    const docsRef = collection(db, 'users', DEFAULT_USER_ID, 'documents');
    const foldersRef = collection(db, 'users', DEFAULT_USER_ID, 'folders');
    
    const [docsSnap, foldersSnap] = await Promise.all([getDocs(docsRef), getDocs(foldersRef)]);
    
    docsSnap.forEach(d => batch.delete(d.ref));
    foldersSnap.forEach(f => batch.delete(f.ref));
    
    await batch.commit();
    return true;
  },

  async deleteItem(id: string, name: string): Promise<{ success: boolean; purgedChunks: number }> {
    const db = firestore;
    // Supprimer récursivement si c'est un dossier (implémentation simplifiée)
    const docRef = doc(db, 'users', DEFAULT_USER_ID, 'documents', id);
    const folderRef = doc(db, 'users', DEFAULT_USER_ID, 'folders', id);
    
    await Promise.all([deleteDoc(docRef), deleteDoc(folderRef)]);
    await deleteDocument({ docId: id, fileName: name }).catch(() => {});
    
    return { success: true, purgedChunks: 1 };
  },

  async createFolder(name: string, parentId: string | null): Promise<FileSystemItem> {
    const db = firestore;
    const folderId = Math.random().toString(36).substring(7);
    const folderRef = doc(db, 'users', DEFAULT_USER_ID, 'folders', folderId);
    
    const newFolder = {
      id: folderId,
      name,
      type: 'folder' as const,
      parentId,
      userId: DEFAULT_USER_ID,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(folderRef, newFolder);
    return { ...newFolder, children: [] };
  },

  async getStats(): Promise<Stats> {
    const fs = await this.getFileSystem();
    const stats = { docs: 0, chunks: 0, size: 0 };
    
    const traverse = (items: FileSystemItem[]) => {
      items.forEach(i => {
        if (i.type === 'file') {
          stats.docs++;
          stats.chunks += (i.chunks || 0);
          stats.size += (i.size || 0);
        }
        if (i.children) traverse(i.children);
      });
    };
    
    traverse(fs);
    return {
      totalDocuments: stats.docs,
      totalChunks: stats.chunks,
      totalSize: stats.size,
      diskSpace: { total: "Cloud Firestore", used: `${(stats.size / 1024).toFixed(1)} KB`, free: "Illimité" }
    };
  },

  async getFileSystem(): Promise<FileSystemItem[]> {
    const db = firestore;
    const docsRef = collection(db, 'users', DEFAULT_USER_ID, 'documents');
    const foldersRef = collection(db, 'users', DEFAULT_USER_ID, 'folders');
    
    const [docsSnap, foldersSnap] = await Promise.all([getDocs(docsRef), getDocs(foldersRef)]);
    
    const allItems: FileSystemItem[] = [];
    foldersSnap.forEach(d => allItems.push({ ...d.data(), children: [] } as any));
    docsSnap.forEach(d => allItems.push(d.data() as any));
    
    // Reconstruire l'arborescence
    const buildTree = (parentId: string | null): FileSystemItem[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: item.type === 'folder' ? buildTree(item.id) : undefined
        }));
    };
    
    return buildTree(null);
  },

  private getAllFileNames(items: FileSystemItem[]): string[] {
    let names: string[] = [];
    items.forEach(item => {
      if (item.type === 'file') names.push(item.name);
      if (item.children) names = [...names, ...this.getAllFileNames(item.children)];
    });
    return names;
  },

  private getAllFileContents(items: FileSystemItem[]): string {
    let context = "";
    items.forEach(item => {
      if (item.type === 'file' && item.content) {
        context += `--- FICHIER: ${item.name} ---\n${item.content}\n\n`;
      }
      if (item.children) context += this.getAllFileContents(item.children);
    });
    return context;
  }
};
