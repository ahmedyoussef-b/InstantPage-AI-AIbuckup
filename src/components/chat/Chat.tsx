'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api/client';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  role: 'user' | 'ai';
  text: string;
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
    setMessages(prev => [...prev, userMsg]);

    try {
      const data = await api.chat(trimmed);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
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
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Comment puis-je vous aider aujourd'hui ?</h2>
              <p className="text-gray-400 max-w-sm">Posez des questions sur vos documents téléchargés.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </Avatar>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' ? 'bg-[#2f2f2f] text-white' : 'text-gray-200'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <Avatar className="w-8 h-8 bg-white/10">
                <Bot className="w-5 h-5" />
              </Avatar>
              <div className="p-4 rounded-2xl animate-pulse bg-white/5 w-12 h-10" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 md:p-8 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#2f2f2f] rounded-2xl border border-white/10 p-2 focus-within:ring-1 focus-within:ring-white/20 transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Envoyez un message..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[50px] max-h-[200px] py-3 px-4 resize-none text-white placeholder:text-gray-500"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-3 bottom-3 bg-white text-black hover:bg-gray-200 rounded-xl disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-500">
            L'IA peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
}