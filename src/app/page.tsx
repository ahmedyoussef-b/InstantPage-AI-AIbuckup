'use client';

import Chat from '@/components/chat/Chat';
import Upload from '@/components/upload/Upload';
import { Bot, LayoutDashboard, Settings, MessageSquare, ShieldCheck, HelpCircle, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

/**
 * Main entry point for the Agentic Personal Assistant.
 * Consolidates the chat interface and document ingestion into a single, clean root route.
 */
export default function HomePage() {
  return (
    <main className="h-screen flex bg-[#171717] overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar - Navigation and Branding */}
      <aside className="w-72 flex-col hidden md:flex border-r border-white/5 bg-[#171717] transition-all">
        <div className="p-6 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-3 px-2 py-1 mb-10 hover:opacity-80 transition-all group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tighter text-lg leading-none">AGENTIC</div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Assistant Pro</div>
            </div>
          </Link>

          <div className="flex-1 space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-600 px-3 py-2 uppercase tracking-[0.2em] mb-2">
                Navigation
              </div>
              <Link 
                href="/" 
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600/10 border border-blue-500/20 rounded-xl transition-all"
              >
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Chat Intelligent
              </Link>
              <Link 
                href="/admin" 
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all group"
              >
                <HardDrive className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                Base de Connaissances
              </Link>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-600 px-3 py-2 uppercase tracking-[0.2em] mb-2">
                Support
              </div>
              <Link 
                href="/help" 
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Centre d'Aide
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </Link>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-white/5 space-y-4">
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Sécurité
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase">Local</Badge>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Version Alpha</div>
              <div className="text-[10px] text-gray-400 leading-tight">Moteur RAG + TTS Intégré.</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121]">
        <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between md:hidden bg-[#171717]">
          <h1 className="font-bold text-white text-sm uppercase tracking-widest">Agentic Assistant</h1>
          <div className="flex gap-4">
            <Link href="/help" className="text-gray-400">
              <HelpCircle className="w-5 h-5" />
            </Link>
            <Link href="/admin" className="text-gray-400">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          <Chat />
        </div>
        
        {/* Document Ingestion Component */}
        <Upload />
      </div>
    </main>
  );
}
