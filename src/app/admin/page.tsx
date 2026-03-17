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
  AlertTriangle,
  Menu
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// --- Components Helpers ---

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
  if (ext === 'md') return <FileCode className="w-4 h-4 text-blue-400" />;
  if (ext === 'csv') return <Table className="w-4 h-4 text-green-400" />;
  if (ext === 'json') return <FileJson className="w-4 h-4 text-yellow-400" />;
  return <FileText className="w-4 h-4 text-gray-400" />;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
};

const TreeNode = ({ 
  item, 
  depth = 0, 
  onDelete, 
  onViewChunks 
}: { 
  item: FileSystemItem, 
  depth?: number,
  onDelete: (id: string, name: string) => void,
  onViewChunks: (id: string, name: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isFolder = item.type === 'folder';

  return (
    <div className="select-none">
      <div 
        className="flex items-center group hover:bg-white/5 py-2 px-2 md:px-3 rounded-xl cursor-pointer transition-all"
        style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
      >
        {isFolder ? (
          <button onClick={() => setIsOpen(!isOpen)} className="mr-1 md:mr-2 p-1 hover:bg-white/10 rounded-md transition-colors">
            {isOpen ? <ChevronDown className="w-3 md:w-4 h-3 md:h-4 text-gray-500" /> : <ChevronRight className="w-3 md:w-4 h-3 md:h-4 text-gray-500" />}
          </button>
        ) : (
          <div className="w-5 md:w-6 mr-1 md:mr-2" />
        )}

        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0" onClick={() => isFolder && setIsOpen(!isOpen)}>
          {isFolder ? <Folder className="w-4 md:w-5 h-4 md:h-5 text-blue-400 fill-blue-400/10" /> : getFileIcon(item.name)}
          <div className="flex flex-col min-w-0">
            <span className="text-xs md:text-sm font-semibold truncate">{item.name}</span>
            {!isFolder && (
              <span className="text-[9px] md:text-[10px] text-gray-500 font-medium truncate">
                {formatSize(item.size)} • {item.chunks} segments
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {!isFolder && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 md:h-8 md:w-8 text-gray-400 hover:text-blue-400"
              onClick={(e) => { e.stopPropagation(); onViewChunks(item.id, item.name); }}
            >
              <Layers className="w-3 md:w-4 h-3 md:h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 md:h-8 md:w-8 text-gray-400 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.name); }}
          >
            <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
          </Button>
        </div>
      </div>

      {isFolder && isOpen && item.children && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-300">
          {item.children.length === 0 ? (
            <div className="text-[10px] text-gray-600 italic py-1" style={{ paddingLeft: `${(depth + 1) * 0.75 + 1.5}rem` }}>
              (Vide)
            </div>
          ) : (
            item.children.map(child => (
              <TreeNode 
                key={child.id} 
                item={child} 
                depth={depth + 1} 
                onDelete={onDelete} 
                onViewChunks={onViewChunks}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Page ---

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
    setLoading(true);
    try {
      const [statsData, fsData] = await Promise.all([
        api.getStats(), 
        api.getFileSystem()
      ]);
      setStats(statsData);
      setFileSystem(fsData);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de rafraîchir la base." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      await api.clearAll();
      toast({ 
        title: "Base réinitialisée", 
        description: "Tous les fichiers ont été purgés." 
      });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "La réinitialisation a échoué." });
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer '${name}' ?`)) {
      try {
        const result = await api.deleteItem(id, name);
        toast({ 
          title: "Supprimé", 
          description: `${name} purgé.` 
        });
        loadData();
      } catch (e) {
        toast({ variant: "destructive", title: "Erreur", description: "La suppression a échoué." });
      }
    }
  };

  const handleViewChunks = async (docId: string, docName: string) => {
    try {
      const chunks = await api.getDocChunks(docId);
      setSelectedDocChunks(chunks);
      setViewingDocName(docName);
      setIsPreviewOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Segments inaccessibles." });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName, null);
      toast({ title: "Dossier créé", description: `'${newFolderName}' ajouté.` });
      setNewFolderName('');
      setIsDialogOpen(false);
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Echec création dossier." });
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-10 font-body">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 max-w-6xl mx-auto gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 md:p-3 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/20">
            <Database className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Administration</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base de Connaissances</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2 h-10 md:h-11 px-3 md:px-4 rounded-xl font-bold text-xs md:text-sm">
                <Eraser className="w-4 h-4" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#2f2f2f] border-white/10 text-white rounded-3xl mx-4">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                  <AlertDialogTitle className="text-lg md:text-xl font-black uppercase">Réinitialisation totale ?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-gray-400 text-sm">
                  Cette action purgera TOUS les fichiers. Les répertoires vides seront conservés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 mt-6">
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl font-bold">Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetDatabase}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-bold"
                >
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-10 md:h-11 px-4 md:px-6 rounded-xl font-bold text-xs md:text-sm flex-1 md:flex-none">
                <FolderPlus className="w-4 h-4" /> Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2f2f2f] border-white/10 text-white rounded-2xl mx-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Créer un répertoire</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <Input 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nom du dossier..."
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

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData} className="bg-white/5 border-white/10 h-10 md:h-11 w-10 md:w-11 rounded-xl">
              <RotateCcw className={`w-4 md:w-5 h-4 md:h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" asChild className="bg-white/5 border-white/10 h-10 md:h-11 w-10 md:w-11 rounded-xl">
              <Link href="/">
                <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Documents', val: stats?.totalDocuments, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Segments', val: stats?.totalChunks, icon: Database, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Taille', val: formatSize(stats?.totalSize), icon: HardDrive, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Moteur', val: stats?.diskSpace?.used, icon: Cpu, color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
          ].map((s, i) => (
            <Card key={i} className="bg-[#2f2f2f] border-white/5 text-white rounded-2xl overflow-hidden group hover:border-white/10 transition-all">
              <CardContent className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</span>
                  <div className={`p-1.5 md:p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-3 md:w-4 h-3 md:h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-black tracking-tighter">{s.val || '0'}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-11 md:h-12 rounded-xl flex w-full md:w-max">
            <TabsTrigger value="files" className="flex-1 md:flex-none rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold px-4 md:px-6 text-xs md:text-sm">
              📁 Fichiers
            </TabsTrigger>
            <TabsTrigger value="chunks" className="flex-1 md:flex-none rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold px-4 md:px-6 text-xs md:text-sm">
              🧱 Segments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <Card className="bg-[#2f2f2f] border-white/5 text-white rounded-2xl overflow-hidden min-h-[400px]">
              <CardContent className="p-4 md:p-8">
                {loading && fileSystem.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 md:py-32 text-gray-500">
                    <RotateCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">Chargement...</p>
                  </div>
                ) : fileSystem.length === 0 ? (
                  <div className="text-center py-20 md:py-32 text-gray-500 font-bold uppercase tracking-widest opacity-30 text-xs">La base est vide.</div>
                ) : (
                  <div className="space-y-1">
                    {fileSystem.map(item => (
                      <TreeNode 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDelete}
                        onViewChunks={handleViewChunks}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chunks">
             <div className="text-center py-20 md:py-32 text-gray-600 font-bold uppercase tracking-widest opacity-50 text-xs">
               Explorez les segments via l'onglet Fichiers.
             </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chunk Inspection Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-[#1e1e1e] border-white/10 text-white w-full max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl md:rounded-3xl mx-2">
          <DialogHeader className="p-4 md:p-8 border-b border-white/5 bg-[#252525]">
            <div className="flex items-center gap-4">
              <div className="p-2 md:p-3 bg-purple-600 rounded-xl">
                <Box className="w-5 md:w-6 h-5 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg md:text-xl font-black uppercase truncate">Segments</DialogTitle>
                <p className="text-[10px] md:text-xs text-gray-500 truncate">{viewingDocName}</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4 md:p-8">
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {selectedDocChunks.map((chunk) => (
                <div key={chunk.id} className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/20 px-2 md:px-3 font-black text-[9px] md:text-xs">SEGMENT #{chunk.index}</Badge>
                    <span className="text-[8px] md:text-[10px] text-gray-600 font-mono hidden sm:inline">{chunk.id}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-300 leading-relaxed pl-3 md:pl-4 border-l-2 border-purple-600/30">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
