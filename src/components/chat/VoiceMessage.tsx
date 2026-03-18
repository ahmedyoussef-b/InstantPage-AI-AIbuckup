// components/chat/VoiceMessage.tsx (version avec Apprentissage Continu)
'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Edit3, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useVoice } from '@/hooks/useVoice';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface VoiceMessageProps {
  text: string;
  role: 'user' | 'ai';
  messageId: string;
  autoPlay?: boolean;
}

export default function VoiceMessage({ text, role, messageId, autoPlay }: VoiceMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const { toast } = useToast();
  const { play, pause, stop, isPlaying: globalPlaying, currentText } = useVoice();

  const displayText = (() => {
    if (typeof text === 'string') {
      try {
        const parsed = JSON.parse(text);
        return parsed.answer || parsed.text || text;
      } catch {
        return text;
      }
    }
    return String(text);
  })();

  useEffect(() => {
    if (autoPlay && role === 'ai' && !globalPlaying) {
      handlePlay();
    }
  }, [autoPlay, role]);

  const handlePlay = async () => {
    if (globalPlaying && currentText === text) {
      pause();
      setIsPlaying(false);
    } else {
      await play(displayText);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };

  const startEditing = () => {
    setEditedText(displayText);
    setIsEditing(true);
  };

  const submitCorrection = async () => {
    if (!editedText.trim() || editedText === displayText) {
      setIsEditing(false);
      return;
    }

    try {
      await api.submitCorrection(displayText, editedText);
      toast({
        title: "Apprentissage enregistré",
        description: "L'IA utilisera cette correction pour s'améliorer.",
      });
      setIsEditing(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la correction.",
      });
    }
  };

  const isMessagePlaying = globalPlaying && currentText === displayText;

  return (
    <div 
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative max-w-[85%] md:max-w-[80%]">
        {role === 'ai' && (
          <div className="absolute -left-10 top-0 w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <span className="text-xs font-bold text-blue-400">AI</span>
          </div>
        )}

        <div className={`
          relative rounded-2xl p-4 md:p-5 shadow-lg
          ${role === 'user' 
            ? 'bg-blue-600 text-white ml-auto' 
            : 'bg-white/10 text-white backdrop-blur-sm'
          }
        `}>
          {isEditing ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Corriger la réponse :</p>
              <Textarea 
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="bg-black/20 border-white/10 text-white text-sm min-h-[100px] rounded-xl focus-visible:ring-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 rounded-lg text-gray-400">
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button size="sm" onClick={submitCorrection} className="h-8 bg-blue-600 hover:bg-blue-500 rounded-lg text-white">
                  <Check className="w-4 h-4 mr-1" /> Valider
                </Button>
              </div>
            </div>
          ) : (
            <>
              {role === 'ai' ? (
                <ReactMarkdown className="prose prose-invert max-w-none text-sm leading-relaxed">
                  {displayText}
                </ReactMarkdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayText}</p>
              )}
            </>
          )}

          {role === 'ai' && !isEditing && (
            <div className={`
              absolute -right-12 top-0 flex flex-col gap-2
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              <button
                onClick={isMessagePlaying ? handleStop : handlePlay}
                className="w-8 h-8 bg-gray-700/80 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors shadow-lg"
                title={isMessagePlaying ? 'Arrêter' : 'Lire'}
              >
                {isMessagePlaying ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white pl-0.5" />
                )}
              </button>
              <button
                onClick={startEditing}
                className="w-8 h-8 bg-gray-700/80 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                title="Corriger l'IA"
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}

          {isMessagePlaying && (
            <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full overflow-hidden">
              <div className="w-full h-full bg-blue-400 animate-pulse" />
            </div>
          )}
        </div>

        <div className="absolute -bottom-5 left-0 text-[8px] text-gray-500 flex items-center gap-3">
          {role === 'ai' && (
            <button
              onClick={handlePlay}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              <span>Synthèse vocale</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
