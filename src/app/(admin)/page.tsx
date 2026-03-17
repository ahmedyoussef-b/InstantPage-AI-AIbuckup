'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalSize: number;
  diskSpace: { total: string; used: string; free: string };
}

interface Document {
  id: string;
  name: string;
  size: number;
  chunks: number;
  uploadedAt: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsData, docsData] = await Promise.all([
        api.getStats(), api.getDocuments()
      ]);
      setStats(statsData);
      setDocuments(docsData);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(2) + ' KB';
    if (bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(2) + ' MB';
    return (bytes/(1024*1024*1024)).toFixed(2) + ' GB';
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen bg-chat-bg text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">📊 Administration</h1>
        <Link href="/" className="px-4 py-2 bg-chat-ai rounded-lg">← Retour</Link>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-chat-ai p-4 rounded-lg">
          <p className="text-gray-400">Documents</p>
          <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
        </div>
        <div className="bg-chat-ai p-4 rounded-lg">
          <p className="text-gray-400">Chunks</p>
          <p className="text-2xl font-bold">{stats?.totalChunks || 0}</p>
        </div>
        <div className="bg-chat-ai p-4 rounded-lg">
          <p className="text-gray-400">Taille</p>
          <p className="text-2xl font-bold">{formatSize(stats?.totalSize || 0)}</p>
        </div>
        <div className="bg-chat-ai p-4 rounded-lg">
          <p className="text-gray-400">RAM utilisée</p>
          <p className="text-2xl font-bold">{stats?.diskSpace?.used || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-chat-ai rounded-lg p-4">
        <h2 className="text-xl mb-4">📚 Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-400">Aucun document</p>
        ) : (
          <table className="w-full">
            <thead><tr><th>Nom</th><th>Taille</th><th>Chunks</th><th>Date</th></tr></thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-t border-chat-border">
                  <td className="py-2">{doc.name}</td>
                  <td>{formatSize(doc.size)}</td>
                  <td>{doc.chunks}</td>
                  <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}