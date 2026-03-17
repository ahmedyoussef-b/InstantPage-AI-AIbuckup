'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Stats, Document } from '@/types';
import { 
  ArrowLeft, 
  Database, 
  FileText, 
  HardDrive, 
  LayoutDashboard, 
  RotateCcw, 
  Trash2, 
  Eye,
  Cpu,
  FileCode,
  Table,
  FileJson
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { 
    console.log('[UI_ADMIN] Component mounted. Loading initial data...');
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log('[UI_ADMIN] loadData: Fetching stats and documents...');
    try {
      const [statsData, docsData] = await Promise.all([
        api.getStats(), 
        api.getDocuments()
      ]);
      setStats(statsData);
      setDocuments(docsData);
      console.log('[UI_ADMIN] loadData success. Docs count:', docsData.length);
    } catch (err) {
      console.error('[UI_ADMIN] loadData error:', err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données d'administration."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer TOUTE la base de connaissances locale ?")) {
      console.log('[UI_ADMIN] User confirmed clear database.');
      try {
        await api.clearAll();
        console.log('[UI_ADMIN] Database clear complete.');
        toast({
          title: "Base nettoyée",
          description: "Tous les documents et segments ont été supprimés de ChromaDB."
        });
        loadData();
      } catch (e) {
        console.error('[UI_ADMIN] clear database error:', e);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Échec de la suppression."
        });
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(2) + ' KB';
    if (bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(2) + ' MB';
    return (bytes/(1024*1024*1024)).toFixed(2) + ' GB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
    if (ext === 'md') return <FileCode className="w-4 h-4 text-blue-400" />;
    if (ext === 'csv') return <Table className="w-4 h-4 text-green-400" />;
    if (ext === 'json') return <FileJson className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">📊 ADMINISTRATION</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadData}
            className="bg-white/5 border-white/10 hover:bg-white/10"
            title="Rafraîchir"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleClearAll}
            className="bg-white/5 border-white/10 hover:bg-red-500/20"
            title="Tout supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            asChild
            className="bg-white/5 border-white/10 hover:bg-white/10"
            title="Retour"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3 text-blue-400" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{stats?.totalDocuments || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-purple-400" /> Chunks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{stats?.totalChunks || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <HardDrive className="w-3 h-3 text-green-400" /> Taille
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{formatSize(stats?.totalSize || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3 text-yellow-400" /> RAM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{stats?.diskSpace?.used || '1.2 GB'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg font-bold uppercase tracking-tight">📚 Documents Indexés</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <Card className="bg-[#2f2f2f] border-white/5 text-white overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-20 text-center text-gray-500 flex flex-col items-center gap-4">
                  <RotateCcw className="w-8 h-8 animate-spin" />
                  Chargement de la base locale...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-20 text-center text-gray-500">
                  Aucun document indexé pour le moment.
                </div>
              ) : (
                <UiTable>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs font-bold uppercase py-4">Fichier</TableHead>
                      <TableHead className="text-gray-400 text-xs font-bold uppercase py-4 text-center">Taille</TableHead>
                      <TableHead className="text-gray-400 text-xs font-bold uppercase py-4 text-center">Segments (1000ch)</TableHead>
                      <TableHead className="text-gray-400 text-xs font-bold uppercase py-4 text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium py-4 flex items-center gap-3">
                          {getFileIcon(doc.name)}
                          {doc.name}
                        </TableCell>
                        <TableCell className="text-center text-gray-400 font-mono text-xs">{formatSize(doc.size)}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold">
                            {doc.chunks}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => console.log(`[UI_ADMIN] Inspecting chunks for document: ${doc.name}`)}
                            title="Inspecter les segments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UiTable>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
