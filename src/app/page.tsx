'use client';

import { useState } from 'react';
import Chat from '@/components/chat/Chat';
import Upload from '@/components/upload/Upload';
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  HelpCircle, 
  HardDrive, 
  Menu, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Main entry point for the Agentic Personal Assistant.
 * Consolidates the chat interface and document ingestion into a single, clean root route.
 */
export default function HomePage() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="p-4 md:p-6 flex flex-col h-full bg-[#171717] overflow-hidden">
      <Link href="/" className={cn(
        "flex items-center gap-3 px-2 py-1 mb-10 hover:opacity-80 transition-all group shrink-0",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="font-bold text-white tracking-tighter text-lg leading-none">AGENTIC</div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Assistant Pro</div>
          </div>
        )}
      </Link>

      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
        <div className="space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-bold text-gray-600 px-3 py-2 uppercase tracking-[0.2em] mb-2 animate-in fade-in">
              Navigation
            </div>
          )}
          <Link 
            href="/" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600/10 border border-blue-500/20 rounded-xl transition-all",
              collapsed && "justify-center px-0 border-none bg-transparent hover:bg-blue-600/10"
            )}
            title="Chat Intelligent"
          >
            <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
            {!collapsed && <span className="truncate">Chat Intelligent</span>}
          </Link>
          <Link 
            href="/admin" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all group",
              collapsed && "justify-center px-0"
            )}
            title="Base de Connaissances"
          >
            <HardDrive className="w-4 h-4 group-hover:text-purple-400 transition-colors shrink-0" />
            {!collapsed && <span className="truncate">Base de Connaissances</span>}
          </Link>
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-bold text-gray-600 px-3 py-2 uppercase tracking-[0.2em] mb-2 animate-in fade-in">
              Support
            </div>
          )}
          <Link 
            href="/help" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all",
              collapsed && "justify-center px-0"
            )}
            title="Centre d'Aide"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Centre d'Aide</span>}
          </Link>
          <Link 
            href="/settings" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all",
              collapsed && "justify-center px-0"
            )}
            title="Paramètres"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Paramètres</span>}
          </Link>
        </div>
      </div>

      <div className="pt-6 mt-auto border-t border-white/5 space-y-4 shrink-0">
        {!collapsed ? (
          <>
            <div className="px-3 py-2 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Sécurité
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase">Local</Badge>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 animate-in slide-in-from-bottom-2">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Version Alpha</div>
              <div className="text-[10px] text-gray-400 leading-tight">Moteur RAG + TTS Intégré.</div>
            </div>
          </>
        ) : (
          <div className="flex justify-center py-2" title="Mode Sécurisé Local">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="h-screen flex bg-[#171717] overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar - Navigation and Branding (Desktop) */}
      <aside className={cn(
        "flex-col hidden lg:flex border-r border-white/5 bg-[#171717] transition-all duration-300 relative z-30",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-12 z-50 bg-[#171717] border border-white/5 rounded-full h-8 w-8 hover:bg-blue-600 hover:text-white shadow-xl transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Main Chat Interface Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121]">
        {/* Mobile Header */}
        <header className="h-16 border-b border-white/5 flex items-center px-4 justify-between lg:hidden bg-[#171717] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-none w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-bold text-white text-sm uppercase tracking-widest">Agentic Assistant</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" asChild className="text-gray-400">
              <Link href="/admin">
                <HardDrive className="w-5 h-5" />
              </Link>
            </Button>
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
