"use client"
import Chat from '@/components/chat/Chat';
import Upload from '@/components/upload/Upload';
import { Bot, LayoutDashboard, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="h-screen flex bg-[#171717] overflow-hidden">
      {/* Sidebar - ChatGPT Style */}
      <aside className="w-64 flex-col hidden md:flex border-r border-white/5 bg-[#171717]">
        <div className="p-4 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 mb-8 hover:bg-white/5 rounded-xl transition-all">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-white">Agentic AI</span>
          </Link>

          <div className="flex-1 space-y-1">
            <div className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider">
              Navigation
            </div>
            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-white bg-white/10 rounded-xl transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Assistant Chat
            </Link>
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Administration
            </Link>
          </div>

          <div className="pt-4 mt-auto border-t border-white/5">
            <Link 
              href="/settings" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121]">
        <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between md:hidden bg-[#171717]">
          <h1 className="font-semibold text-white text-sm">Agentic AI</h1>
          <Link href="/admin" className="text-gray-400">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          <Chat />
        </div>
        
        <Upload />
      </div>
    </main>
  )
}
