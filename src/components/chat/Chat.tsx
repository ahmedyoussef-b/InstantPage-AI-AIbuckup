'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Send, Sparkles, FileText, Brain, ShieldCheck, ListChecks, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import VoiceMessage from '@/components/chat/VoiceMessage';
import VoiceControls from '@/components/chat/VoiceControls';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sources?: string[];
  id: string;
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

    setLoading(true);
    if (!textOverride) setInput('');
    
    const userMsgId = Math.random().toString(36).substring(7);
    const userMsg: Message = { role: 'user', text: trimmed, id: userMsgId };
    setMessages(prev => [...prev, userMsg]);

    try {
      const data = await api.chat(trimmed, messages);
      const aiMsgId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer,
        sources: data.sources,
        id: aiMsgId
      }]);
    } catch (error) {
      const errId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Désolé, une erreur est survenue lors de la communication avec l\'assistant.',
        id: errId
      }]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FileText className="w-4 h-4 text-blue-400" />, title: "Analyse Docs", desc: "PDF, TXT, MD, JSON" },
    { icon: <Brain className="w-4 h-4 text-purple-400" />, title: "Mémoire", desc: "Suivi contextuel" },
    { icon: <ShieldCheck className="w-4 h-4 text-green-400" />, title: "100% Local", desc: "Confidentialité" },
    { icon: <ListChecks className="w-4 h-4 text-orange-400" />, title: "Sources", desc: "Réponses citées" }
  ];

  const suggestions = [
    "Conclusions de mes documents ?",
    "Résumé des derniers fichiers ?",
    "Mentions de sécurité ?",
    "Analyse des stratégies ?"
  ];

  return (
    <div className="flex flex-col h-full bg-[#212121] relative">
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-20">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              
              <div className="space-y-2 px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">Bonjour, comment puis-je vous aider ?</h2>
                <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto">
                  Importez vos documents pour commencer une analyse intelligente et sécurisée.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl px-4">
                {features.map((f, i) => (
                  <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-3 md:p-4 flex items-start gap-3 text-left">
                      <div className="mt-1 shrink-0">{f.icon}</div>
                      <div>
                        <div className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tighter">{f.title}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{f.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="w-full max-w-2xl space-y-3 px-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest justify-center sm:justify-start">
                  <HelpCircle className="w-3.5 h-3.5" /> Suggestions
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-[10px] md:text-xs text-gray-300 bg-white/5 border border-white/10 px-3 md:px-4 py-2 rounded-xl hover:bg-blue-600/20 hover:border-blue-500/30 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6 md:space-y-8">
            {messages.map((msg) => (
              <VoiceMessage 
                key={msg.id}
                text={msg.text}
                role={msg.role}
                messageId={msg.id}
              />
            ))}
          </div>

          {loading && (
            <div className="flex gap-4 animate-in fade-in duration-300">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
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

      <div className="p-4 md:p-8 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#2f2f2f] rounded-2xl border border-white/10 p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-2xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez une question..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[48px] md:min-h-[52px] max-h-[200px] py-2 md:py-3 px-3 md:px-4 resize-none text-white placeholder:text-gray-500 text-sm"
              rows={1}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              size="icon"
              className="bg-blue-600 text-white hover:bg-blue-500 rounded-xl disabled:opacity-30 transition-all w-9 h-9 md:w-10 md:h-10 shrink-0 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[9px] md:text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em] px-4">
            Agentic Assistant • Synthèse Vocale Active • Moteur Local
          </p>
        </div>
      </div>

      <VoiceControls />
    </div>
  );
}
