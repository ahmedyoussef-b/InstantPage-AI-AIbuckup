'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api/client';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, Loader2, FileCode, Table, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, chunks?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setFile(selected);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const result = await api.upload(file);
      setStatus({ 
        type: 'success', 
        message: `Upload réussi!`,
        chunks: result.chunks
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
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
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
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
                  <span className="truncate max-w-[200px] sm:max-w-md">
                    {file ? file.name : 'Ingérer PDF, TXT, MD, JSON, CSV...'}
                  </span>
                </div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Parcourir</div>
              </label>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-30 font-bold transition-all"
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

          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
              status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>
                {status.message} {status.chunks && <span className="font-bold">{status.chunks} chunks créés.</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
