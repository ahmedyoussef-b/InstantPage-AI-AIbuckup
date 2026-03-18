'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { 
  Send, 
  Sparkles, 
  FileText, 
  Brain, 
  ShieldCheck, 
  ListChecks, 
  HelpCircle, 
  Mic, 
  MicOff,
  Activity,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import VoiceMessage from '@/components/chat/VoiceMessage';
import VoiceControls from '@/components/chat/VoiceControls';
import { useVoiceEnhanced } from '@/hooks/useVoiceEnhanced';
import StepByStepGuide from '@/components/procedure/StepByStepGuide';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sources?: string[];
  id: string;
  isAgentMission?: boolean;
  steps?: any[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'chat' | 'procedure'>('chat');

  const handleSendMessage = async (textOverride?: string) => {
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
      
      let answerText = '';
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          answerText = parsed.answer || data;
        } catch {
          answerText = data;
        }
      } else if (data && typeof data === 'object') {
        answerText = data.answer || JSON.stringify(data);
      } else {
        answerText = String(data);
      }
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: answerText,
        sources: data.sources,
        id: aiMsgId,
        isAgentMission: data.isAgentMission,
        steps: data.steps
      }]);

      if (data.isAgentMission) {
        setExpandedMissionId(aiMsgId);
      }
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

  const {
    isListening,
    isSpeaking,
    interimTranscript,
    volume,
    startListening,
    stopListening,
    autoPlayResponse
  } = useVoiceEnhanced(handleSendMessage);

  useEffect(() => {
    if (interimTranscript) setInput(interimTranscript);
  }, [interimTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicClick = async () => {
    if (isListening) await stopListening();
    else await startListening();
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] relative">
      <div className="bg-[#2a2a2a] border-b border-gray-700 p-2 flex justify-center gap-2">
        <Button
          onClick={() => setMode('chat')}
          variant={mode === 'chat' ? 'default' : 'ghost'}
          className={mode === 'chat' ? 'bg-blue-600' : ''}
        >
          <Brain className="w-4 h-4 mr-2" /> Chat Intelligent
        </Button>
        <Button
          onClick={() => setMode('procedure')}
          variant={mode === 'procedure' ? 'default' : 'ghost'}
          className={mode === 'procedure' ? 'bg-green-600' : ''}
        >
          <ListChecks className="w-4 h-4 mr-2" /> Mode Procédure
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-20">
          {mode === 'chat' ? (
            <>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <Activity className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="space-y-2 px-4">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Bonjour, prêt pour une mission ?</h2>
                    <p className="text-xs text-gray-400">Posez une question technique ou demandez à l'Agent d'organiser une tâche complexe.</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6 md:space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    <VoiceMessage 
                      text={msg.text}
                      role={msg.role}
                      messageId={msg.id}
                      autoPlay={autoPlayResponse && msg.role === 'ai' && msg === messages[messages.length - 1]}
                    />
                    
                    {/* Visualisation du Plan Agentic */}
                    {msg.isAgentMission && msg.steps && (
                      <div className="ml-12 mr-12 bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
                        <button 
                          onClick={() => setExpandedMissionId(expandedMissionId === msg.id ? null : msg.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Rapport d'Exécution Agentic MCP</span>
                          </div>
                          {expandedMissionId === msg.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>
                        
                        {expandedMissionId === msg.id && (
                          <div className="p-4 border-t border-white/5 space-y-3">
                            {msg.steps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-xl">
                                {step.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-200">{step.description}</p>
                                  {step.output && <p className="text-[10px] text-gray-500 mt-1 italic">{step.output}</p>}
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 flex justify-end">
                              <Badge className="bg-purple-600/20 text-purple-400 border-none text-[8px] font-black uppercase">Apprentissage démonstration actif</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {loading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="h-8 w-24 bg-white/5 rounded-2xl" />
                </div>
              )}
            </>
          ) : (
            <StepByStepGuide />
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {mode === 'chat' && (
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent sticky bottom-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-[#2f2f2f] rounded-2xl border border-white/10 p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-2xl">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isListening ? "🎤 Écoute en cours..." : "Posez une question ou demandez une mission..."}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[48px] md:min-h-[52px] max-h-[200px] py-2 md:py-3 px-3 md:px-4 resize-none text-white placeholder:text-gray-500 text-sm"
                rows={1}
              />
              <div className="relative flex items-center gap-2">
                <Button onClick={handleMicClick} variant="ghost" size="icon" className={`relative w-9 h-9 rounded-xl shrink-0 transition-all ${isListening ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button onClick={() => handleSendMessage()} disabled={loading || !input.trim()} size="icon" className="bg-blue-600 text-white hover:bg-blue-500 rounded-xl w-9 h-9 shrink-0 shadow-lg">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <VoiceControls />
    </div>
  );
}
