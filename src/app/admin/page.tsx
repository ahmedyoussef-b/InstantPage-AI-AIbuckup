'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Stats, FileSystemItem, ChunkMetadata } from '@/types';
import { 
  ArrowLeft, 
  Database, 
  FileText, 
  HardDrive, 
  RotateCcw, 
  Trash2, 
  FolderPlus,
  Folder,
  ChevronRight,
  ChevronDown,
  Cpu,
  FileCode,
  Table,
  FileJson,
  Plus,
  Search,
  Layers,
  Box,
  Eraser,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocChunks, setSelectedDocChunks] = useState<ChunkMetadata[]>([]);
  const [viewingDocName, setViewingDocName] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    console.log('[UI_ADMIN] Chargement des données de la base...');
    setLoading(true);
    try {
      const [statsData, fsData] = await Promise.all([
        api.getStats(), 
        api.getFileSystem()
      ]);
      setStats(statsData);
      setFileSystem(fsData);
      console.log('[UI_ADMIN] Données chargées avec succès.');
    } catch (err) {
      console.error('[UI_ADMIN] Erreur de chargement:', err);
      toast({ variant: "destructive", title: "Erreur", description: "Chargement de la base échoué." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    console.log('[UI_ADMIN] Réinitialisation de la base (Fichiers & Chunks)...');
    setResetting(true);
    try {
      await api.clearAll();
      toast({ 
        title: "Base réinitialisée", 
        description: "Tous les fichiers et segments ont été supprimés. Les répertoires ont été conservés." 
      });
      loadData();
    } catch (e) {
      console.error('[UI_ADMIN] Erreur réinitialisation:', e);
      toast({ variant: "destructive", title: "Erreur", description: "La réinitialisation a échoué." });
    } finally {
      setResetting(false);
    }
  };

  const handleViewChunks = async (docId: string, docName: string) => {
    console.log(`[UI_ADMIN] Ouverture de l'explorateur de chunks pour: ${docName}`);
    try {
      const chunks = await api.getDocChunks(docId);
      setSelectedDocChunks(chunks);
      setViewingDocName(docName);
      setIsPreviewOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les segments." });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    console.log(`[UI_ADMIN] Création du dossier: ${newFolderName}`);
    try {
      await api.createFolder(newFolderName, null);
      toast({ title: "Dossier créé", description: `Le répertoire '${newFolderName}' a été ajouté.` });
      setNewFolderName('');
      setIsDialogOpen(false);
      loadData();
    } catch (e) {
      console.error('[UI_ADMIN] Erreur création dossier:', e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer le dossier." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer '${name}' ? Cette action supprimera également tous les segments (chunks) associés.`)) {
      console.log(`[UI_ADMIN] Suppression de l'élément: ${id} (${name})`);
      try {
        const result = await api.deleteItem(id, name);
        toast({ 
          title: "Supprimé", 
          description: `${name} et ses ${result.purgedChunks} segments ont été retirés de la base.` 
        });
        loadData();
      } catch (e) {
        console.error('[UI_ADMIN] Erreur suppression:', e);
        toast({ variant: "destructive", title: "Erreur", description: "La suppression a échoué." });
      }
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
    if (ext === 'md') return <FileCode className="w-4 h-4 text-blue-400" />;
    if (ext === 'csv') return <Table className="w-4 h-4 text-green-400" />;
    if (ext === 'json') return <FileJson className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const TreeNode = ({ item, depth = 0 }: { item: FileSystemItem, depth?: number }) => {
    const [isOpen, setIsOpen] = useState(depth === 0);
    const isFolder = item.type === 'folder';

    return (
      <div className="select-none">
        <div 
          className="flex items-center group hover:bg-white/5 py-2 px-3 rounded-xl cursor-pointer transition-all"
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          {isFolder ? (
            <button onClick={() => setIsOpen(!isOpen)} className="mr-2 p-1 hover:bg-white/10 rounded-md transition-colors">
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => isFolder && setIsOpen(!isOpen)}>
            {isFolder ? <Folder className="w-5 h-5 text-blue-400 fill-blue-400/10" /> : getFileIcon(item.name)}
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate">{item.name}</span>
              {!isFolder && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {formatSize(item.size)} • {item.chunks} segments • {new Date(item.uploadedAt!).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFolder && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400 hover:text-blue-400"
                onClick={(e) => { e.stopPropagation(); handleViewChunks(item.id, item.name); }}
              >
                <Layers className="w-4 h-4" />
              </Button>
            )}
            {isFolder && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-400">
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isFolder && isOpen && item.children && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-300">
            {item.children.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic py-2" style={{ paddingLeft: `${(depth + 1) * 1.5 + 2.5}rem` }}>
                (Dossier vide)
              </div>
            ) : (
              item.children.map(child => <TreeNode key={child.id} item={child} depth={depth + 1} />)
            )}
          </div>
        )}
      </div>
    );
  };

  const ChunkExplorerNode = ({ item }: { item: FileSystemItem }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (item.type === 'folder') {
      return (
        <div className="space-y-1">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
            <Folder className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-tight text-gray-300">{item.name}</span>
          </div>
          {isOpen && item.children && (
            <div className="ml-4 border-l border-white/5 pl-2">
              {item.children.map(child => <ChunkExplorerNode key={child.id} item={child} />)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        onClick={() => handleViewChunks(item.id, item.name)}
        className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg cursor-pointer group transition-all"
      >
        <Box className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{item.name}</span>
        <span className="ml-auto text-[10px] text-gray-600 font-mono">[{item.chunks} segments]</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-10 font-body">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 max-w-6xl mx-auto gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Administration</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Base de Connaissances Locale</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2 h-11 px-4 rounded-xl font-bold">
                <Eraser className="w-4 h-4" /> Reset Base
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#2f2f2f] border-white/10 text-white rounded-3xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                  <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Réinitialisation complète ?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-gray-400 text-sm">
                  Cette action va supprimer **tous les fichiers** et leurs segments vectoriels (chunks). 
                  <br /><br />
                  <span className="text-white font-bold italic">Seuls les dossiers et l'arborescence seront conservés.</span> Cette opération est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 mt-6">
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold">Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetDatabase}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-red-500/10"
                >
                  Confirmer le Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/10">
                <FolderPlus className="w-4 h-4" /> Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2f2f2f] border-white/10 text-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Créer un répertoire</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <Input 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nom du dossier (ex: Projets, Archives...)"
                  className="bg-black/20 border-white/10 text-white h-12 rounded-xl"
                  autoFocus
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Annuler</Button>
                <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-bold">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" onClick={loadData} className="bg-white/5 border-white/10 h-11 w-11 rounded-xl hover:bg-white/10">
            <RotateCcw className={`w-5 h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="icon" asChild className="bg-white/5 border-white/10 h-11 w-11 rounded-xl hover:bg-white/10">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Documents', val: stats?.totalDocuments, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Segments', val: stats?.totalChunks, icon: Database, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Taille Totale', val: formatSize(stats?.totalSize), icon: HardDrive, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Utilisation RAM', val: stats?.diskSpace?.used, icon: Cpu, color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
          ].map((s, i) => (
            <Card key={i} className="bg-[#2f2f2f] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden group hover:border-white/10 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{s.label}</span>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tighter">{s.val || '0'}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="files" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-12 rounded-xl">
              <TabsTrigger value="files" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold px-6">
                📁 Fichiers
              </TabsTrigger>
              <TabsTrigger value="chunks" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold px-6">
                🧱 Segments (Chunks)
              </TabsTrigger>
            </TabsList>
            <div className="h-px flex-1 bg-white/5 ml-6" />
          </div>

          <TabsContent value="files">
            <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
              <CardContent className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-6">
                    <RotateCcw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Chargement des fichiers...</p>
                  </div>
                ) : fileSystem.length === 0 ? (
                  <div className="text-center py-32 text-gray-500">La base est vide.</div>
                ) : (
                  <div className="space-y-2">
                    {fileSystem.map(item => <TreeNode key={item.id} item={item} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chunks">
            <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Search className="w-3 h-3" /> Arborescence des segments
                    </h3>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-1">
                        {fileSystem.map(item => <ChunkExplorerNode key={item.id} item={item} />)}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-purple-500/10 rounded-full mb-4">
                      <Layers className="w-8 h-8 text-purple-400 opacity-50" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2">Inspecteur de segments</h4>
                    <p className="text-xs text-gray-600 max-w-xs">
                      Sélectionnez un fichier dans la liste de gauche pour explorer ses segments individuels et vérifier la qualité du découpage RAG.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chunk Inspection Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col rounded-3xl">
          <DialogHeader className="p-8 border-b border-white/5 bg-[#252525]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Explorateur de Segments</DialogTitle>
                <p className="text-xs text-gray-500 font-medium">Document : <span className="text-blue-400">{viewingDocName}</span></p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8">
            <div className="grid grid-cols-1 gap-6">
              {selectedDocChunks.map((chunk) => (
                <div key={chunk.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/20 px-3 font-black">SEGMENT #{chunk.index}</Badge>
                      <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{chunk.id}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      Taille : {chunk.size} ch
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-purple-600/30 rounded-full" />
                    <p className="text-sm text-gray-300 leading-relaxed pl-4 whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 bg-[#252525] border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              Visualisation des segments indexés pour la recherche vectorielle (RAG 1000ch)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
