export interface Message {
  role: 'user' | 'ai';
  text: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  chunks: number;
  uploadedAt: string;
}

export interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalSize: number;
  diskSpace: { total: string; used: string; free: string };
}