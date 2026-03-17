'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { 
  Upload as UploadIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileCode, 
  Table, 
  FileJson,
  FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { FileSystemItem } from '@/types';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, chunks?: number } | null>(null);
  const [folders, setFolders] = useState<{id: string, name: string}[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFolders = async () => {
      console.log('[UI_UPLOAD] Chargement des dossiers pour destination...');
      try {
        const fs = await api.getFileSystem();
        const extractedFolders: {id: string, name: string}[] = [];
        
        const traverse = (items: FileSystemItem[], prefix = '') => {
          items.forEach(item => {
            if (item.type === 'folder') {
              extractedFolders.push({ id: item.id, name: prefix + item.name });
              if (item.children) traverse(item.children, prefix + item.name + ' / ');
            }
          });
        };
        
        traverse(fs);
        setFolders(extractedFolders);
      } catch (e) {
        console.error("[UI_UPLOAD] Erreur chargement dossiers:", e);
      }
    };
    loadFolders();
  }, []);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
    if (ext === 'md') return <FileCode className="w-4 h-4 text-blue-400" />;
    if (ext === 'csv') return <Table className="w-4 h-4 text-green-400" />;
    if (ext === 'json') return <FileJson className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      console.log(`[UI_UPLOAD] Fichier sélectionné: ${selected.name} (${selected.size} bytes)`);
      setFile(selected);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const targetId = selectedFolderId === 'root' ? null : selectedFolderId;
    console.log(`[UI_UPLOAD] Upload lancé pour: ${file.name} vers dossierID: ${targetId || 'Racine'}`);
    
    setUploading(true);
    setStatus(null);
    
    try {
      const result = await api.upload(file, targetId);
      console.log(`[UI_UPLOAD] Succès ingestion. Chunks: ${result.chunks}, DocID: ${result.docId}`);
      
      setStatus({ 
        type: 'success', 
        message: `Upload réussi dans ${selectedFolderId === 'root' ? 'la racine' : 'le dossier sélectionné'}!`,
        chunks: result.chunks
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      console.error(`[UI_UPLOAD] Échec de l'upload:`, error);
      setStatus({ 
        type: 'error', 
        message: "Erreur lors de l'extraction ou de l'indexation du document." 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-white/5 bg-[#171717] p-6 shadow-2xl relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Folder Selection */}
            <div className="w-full md:w-64">
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="bg-[#2f2f2f] border-white/10 text-gray-300 h-12 rounded-xl focus:ring-blue-500/20">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-400" />
                    <SelectValue placeholder="Choisir un dossier" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#2f2f2f] border-white/10 text-white">
                  <SelectItem value="root" className="focus:bg-blue-600 focus:text-white">Racine (/) </SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id} className="focus:bg-blue-600 focus:text-white">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File selection and button */}
            <div className="flex-1 flex items-center gap-3 w-full">
              <div className="relative flex-1">
                <input
                  type="file"
                  ref={inputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md,.json,.csv"
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className="flex items-center justify-between w-full h-12 px-4 bg-[#2f2f2f] border border-white/10 rounded-xl cursor-pointer hover:bg-[#3a3a3a] transition-colors overflow-hidden group"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {file ? getFileIcon(file.name) : <UploadIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />}
                    <span className="truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                      {file ? file.name : 'Sélectionner document...'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Parcourir</div>
                </label>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-30 font-bold transition-all shadow-lg shadow-blue-500/10"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexation...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>

          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
              status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>
                {status.message} {status.chunks && <span className="font-bold">{status.chunks} segments créés.</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
