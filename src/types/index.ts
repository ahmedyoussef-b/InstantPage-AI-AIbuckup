export interface Message {
  role: 'user' | 'ai';
  text: string;
}

export interface ChunkMetadata {
  id: string;
  docId: string;
  index: number;
  text: string;
  size: number;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  chunks?: number;
  content?: string; // Ajout du contenu textuel pour le RAG
  uploadedAt?: string;
  parentId: string | null;
  children?: FileSystemItem[];
}

export interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalSize: number;
  diskSpace: { total: string; used: string; free: string };
}
