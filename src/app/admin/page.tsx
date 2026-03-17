'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Stats, FileSystemItem } from '@/types';
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
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      toast({ variant: "destructive", title: "Erreur", description: "Chargement échoué." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName, null);
      toast({ title: "Succès", description: `Dossier '${newFolderName}' créé.` });
      setNewFolderName('');
      setIsDialogOpen(false);
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Création échouée." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer définitivement '${name}' ?`)) {
      try {
        await api.deleteItem(id);
        toast({ title: "Supprimé", description: `${name} a été retiré de la base.` });
        loadData();
      } catch (e) {
        toast({ variant: "destructive", title: "Erreur", description: "Suppression échouée." });
      }
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
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
    const [isOpen, setIsOpen] = useState(false);
    const isFolder = item.type === 'folder';

    return (
      <div className="select-none">
        <div 
          className="flex items-center group hover:bg-white/5 py-1 px-2 rounded-lg cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {isFolder ? (
            <button onClick={() => setIsOpen(!isOpen)} className="mr-1 hover:bg-white/10 rounded p-0.5">
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
          ) : (
            <div className="w-5 mr-1" />
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => isFolder && setIsOpen(!isOpen)}>
            {isFolder ? <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" /> : getFileIcon(item.name)}
            <span className="truncate text-sm font-medium">{item.name}</span>
            {!isFolder && (
              <span className="text-[10px] text-gray-500 font-mono ml-2">
                {formatSize(item.size)} • {item.chunks} segments
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-blue-400">
                <Plus className="w-3 h-3" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isFolder && isOpen && item.children && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-200">
            {item.children.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic py-1" style={{ paddingLeft: `${(depth + 1) * 1.5 + 2}rem` }}>
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

  return (
    <div className="min-h-screen bg-[#171717] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BASE DE CONNAISSANCES</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 gap-2">
                <FolderPlus className="w-4 h-4" /> Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2f2f2f] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Créer un nouveau dossier</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nom du dossier..."
                  className="bg-black/20 border-white/10 text-white"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-500">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" onClick={loadData} className="bg-white/5 border-white/10">
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </Button>
          
          <Button variant="outline" size="icon" asChild className="bg-white/5 border-white/10">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Documents', val: stats?.totalDocuments, icon: FileText, color: 'text-blue-400' },
            { label: 'Segments', val: stats?.totalChunks, icon: Database, color: 'text-purple-400' },
            { label: 'Taille', val: formatSize(stats?.totalSize), icon: HardDrive, color: 'text-green-400' },
            { label: 'Utilisation', val: stats?.diskSpace?.used, icon: Cpu, color: 'text-yellow-400' }
          ].map((s, i) => (
            <Card key={i} className="bg-[#2f2f2f] border-white/5 text-white shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-black">{s.val || '0'}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg font-bold uppercase tracking-tight">📁 Explorateur de fichiers</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-2xl overflow-hidden min-h-[400px]">
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                  <RotateCcw className="w-8 h-8 animate-spin" />
                  Synchronisation de la base locale...
                </div>
              ) : fileSystem.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 italic">
                  Aucune donnée indexée. Commencez par uploader des fichiers.
                </div>
              ) : (
                <div className="space-y-1">
                  {fileSystem.map(item => <TreeNode key={item.id} item={item} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
