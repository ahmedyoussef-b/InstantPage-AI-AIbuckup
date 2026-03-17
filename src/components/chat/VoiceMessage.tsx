'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useVoice } from '@/hooks/useVoice';
import { Volume2, Square, Bot, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  text: string;
  role: 'user' | 'ai';
  messageId: string;
}

export default function VoiceMessage({ text, role, messageId }: VoiceMessageProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const { play, stop, isPlaying: globalPlaying, currentText } = useVoice();

  const handlePlay = async () => {
    if (globalPlaying && currentText === text) {
      stop();
      setLocalIsPlaying(false);
    } else {
      setLocalIsPlaying(true);
      await play(text);
      // On réinitialise l'état local quand useVoice signale la fin (via globalPlaying)
    }
  };

  const isActuallyPlaying = globalPlaying && currentText === text;

  return (
    <div className={`flex gap-4 ${role === 'user' ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex gap-4 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className={`w-8 h-8 flex items-center justify-center shrink-0 ${role === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
          {role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </Avatar>

        <div className="relative group/bubble flex flex-col gap-2">
          <div className={`p-4 rounded-2xl relative ${
            role === 'user' ? 'bg-[#2f2f2f] text-white shadow-lg border border-white/5' : 'text-gray-200 bg-white/5'
          }`}>
            {role === 'ai' ? (
              <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-2 prose-headings:text-white prose-strong:text-blue-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{text}</p>
            )}

            {/* Bouton de lecture flottant */}
            <Button
              onClick={handlePlay}
              variant="secondary"
              size="icon"
              className={`absolute -right-12 top-0 h-8 w-8 rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 shadow-xl ${
                isActuallyPlaying ? 'bg-red-600/20 text-red-400 border-red-500/20' : 'bg-blue-600/20 text-blue-400 border-blue-500/20'
              }`}
              aria-label={isActuallyPlaying ? 'Arrêter la lecture' : 'Lire le message'}
            >
              {isActuallyPlaying ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
