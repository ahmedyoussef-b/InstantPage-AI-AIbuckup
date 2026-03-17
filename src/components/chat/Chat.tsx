
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api/client';
import { Send, Bot, User, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sources?: string[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setInput('');
    const userMsg: Message = { role: 'user', text: trimmed };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);

    try {
      const data = await api.chat(trimmed, messages);
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer,
        sources: data.sources 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Désolé, une erreur est survenue lors de la communication avec l\'assistant.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Assistant Agentique</h2>
              <p className="text-gray-400 max-w-sm">
                Posez vos questions en français. Je peux analyser vos documents, me souvenir du contexte et citer mes sources.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mt-4">
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Mémoire Contextuelle</div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Recherche Auto RAG</div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Formatage Markdown</div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Citations de Sources</div>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </Avatar>
                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' ? 'bg-[#2f2f2f] text-white shadow-lg' : 'text-gray-200 bg-white/5'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-2 prose-headings:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    )}
                  </div>
                  
                  {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      <span className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Sources utilisées :
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <Badge key={sIdx} variant="outline" className="text-[9px] bg-blue-500/10 border-blue-500/20 text-blue-400 font-normal py-0">
                          {src}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <Avatar className="w-8 h-8 bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-400" />
              </Avatar>
              <div className="flex items-center gap-1 px-4 py-2 bg-white/5 rounded-2xl">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 md:p-8 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#2f2f2f] rounded-2xl border border-white/10 p-2 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-2xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez une question sur vos documents ou discutez..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[50px] max-h-[200px] py-3 px-4 resize-none text-white placeholder:text-gray-500 text-sm"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-3 bottom-3 bg-white text-black hover:bg-gray-200 rounded-xl disabled:opacity-30 transition-all w-8 h-8"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-600">
            Assistant Agentique multilingue avec RAG dynamique.
          </p>
        </div>
      </div>
    </div>
  );
}
