
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Stats, Document } from '@/types';
import { ArrowLeft, Database, FileText, HardDrive, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Admin Dashboard for managing the RAG knowledge base.
 * Displays ingestion stats and a list of indexed documents.
 */
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      const [statsData, docsData] = await Promise.all([
        api.getStats(), 
        api.getDocuments()
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

  if (loading) return <div className="p-8 text-white bg-[#171717] min-h-screen">Chargement des données...</div>;

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Administration</h1>
        </div>
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm">
          <ArrowLeft className="w-4 h-4" />
          Retour au Chat
        </Link>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#2f2f2f] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2f2f2f] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Chunks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalChunks || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2f2f2f] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Taille Totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatSize(stats?.totalSize || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2f2f2f] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> RAM Utilisée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.diskSpace?.used || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#2f2f2f] border-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Bibliothèque de Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucun document n'a encore été indexé.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400">Nom du fichier</TableHead>
                    <TableHead className="text-gray-400">Taille</TableHead>
                    <TableHead className="text-gray-400">Segments (Chunks)</TableHead>
                    <TableHead className="text-gray-400">Date d'import</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{formatSize(doc.size)}</TableCell>
                      <TableCell>{doc.chunks}</TableCell>
                      <TableCell className="text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
