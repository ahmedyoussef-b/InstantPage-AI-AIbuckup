
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api/client';
import { Send, Bot, User, Database, Sparkles, FileText, Brain, ShieldCheck, ListChecks, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    console.log(`[UI_CHAT] User initiated send: "${trimmed}"`);

    setLoading(true);
    if (!textOverride) setInput('');
    const userMsg: Message = { role: 'user', text: trimmed };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);

    try {
      const data = await api.chat(trimmed, messages);
      console.log(`[UI_CHAT] AI response received. Sources found: ${data.sources?.length || 0}`);
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer,
        sources: data.sources 
      }]);
    } catch (error) {
      console.error(`[UI_CHAT] Error sending message:`, error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Désolé, une erreur est survenue lors de la communication avec l\'assistant.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FileText className="w-4 h-4 text-blue-400" />, title: "Analyse de Documents", desc: "PDF, TXT, MD, JSON, CSV" },
    { icon: <Brain className="w-4 h-4 text-purple-400" />, title: "Mémoire Contextuelle", desc: "Se souvient de vos échanges" },
    { icon: <ShieldCheck className="w-4 h-4 text-green-400" />, title: "100% Local", desc: "Confidentialité totale" },
    { icon: <ListChecks className="w-4 h-4 text-orange-400" />, title: "Citations Sources", desc: "Transparence des réponses" }
  ];

  const suggestions = [
    "Quelles sont les conclusions du Rapport Annuel ?",
    "Résume-moi le fichier Cahier des charges.",
    "Y a-t-il des mentions de sécurité dans mes documents ?",
    "Compare les stratégies entre mes différents projets."
  ];

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Bonjour, comment puis-je vous aider ?</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Importez vos documents pour commencer une analyse intelligente et sécurisée.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {features.map((f, i) => (
                  <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-4 flex items-start gap-3 text-left">
                      <div className="mt-1">{f.icon}</div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase tracking-tighter">{f.title}</div>
                        <div className="text-xs text-gray-500">{f.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <HelpCircle className="w-3.5 h-3.5" /> Suggestions de questions
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-xs text-gray-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-blue-600/20 hover:border-blue-500/30 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </Avatar>
                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' ? 'bg-[#2f2f2f] text-white shadow-lg border border-white/5' : 'text-gray-200 bg-white/5'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-2 prose-headings:text-white prose-strong:text-blue-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    )}
                  </div>
                  
                  {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      <span className="text-[9px] text-gray-500 flex items-center gap-1 font-bold uppercase tracking-widest">
                        <Database className="w-3 h-3" /> Sources consultées :
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <Badge key={sIdx} variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold py-0 rounded-md">
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
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 rounded-2xl">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 md:p-8 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#2f2f2f] rounded-2xl border border-white/10 p-2 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-2xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez une question sur vos documents..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[52px] max-h-[200px] py-3 px-4 resize-none text-white placeholder:text-gray-500 text-sm"
              rows={1}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-3 bottom-3 bg-blue-600 text-white hover:bg-blue-500 rounded-xl disabled:opacity-30 transition-all w-9 h-9 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-3 text-center text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">
            Agentic Assistant • Ingestion RAG 1000ch • Modèle Local
          </p>
        </div>
      </div>
    </div>
  );
}
