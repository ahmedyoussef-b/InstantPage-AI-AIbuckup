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

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    if (confirm(`Voulez-vous vraiment supprimer '${name}' ? Cette action est irréversible.`)) {
      console.log(`[UI_ADMIN] Suppression de l'élément: ${id} (${name})`);
      try {
        await api.deleteItem(id);
        toast({ title: "Supprimé", description: `${name} a été retiré de la base.` });
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

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-1">
            <h2 className="text-lg font-black uppercase tracking-tight">📚 Explorateur de connaissances</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <Card className="bg-[#2f2f2f] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
            <CardContent className="p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-6">
                  <div className="relative">
                    <Database className="w-12 h-12 text-blue-600/20" />
                    <RotateCcw className="w-6 h-6 text-blue-500 animate-spin absolute -bottom-1 -right-1" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Synchronisation de la base...</p>
                </div>
              ) : fileSystem.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500 italic text-center space-y-4">
                  <Folder className="w-12 h-12 opacity-10" />
                  <p className="max-w-xs text-sm">La base de connaissances est vide. Créez des dossiers ou uploadez des fichiers depuis le chat.</p>
                </div>
              ) : (
                <div className="space-y-2">
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