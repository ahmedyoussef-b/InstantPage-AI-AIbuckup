// components/chat/VoiceMessage.tsx (version avec auto-play)
'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useVoice } from '@/hooks/useVoice';

interface VoiceMessageProps {
  text: string;
  role: 'user' | 'ai';
  messageId: string;
  autoPlay?: boolean;
}

export default function VoiceMessage({ text, role, messageId, autoPlay }: VoiceMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { play, pause, stop, isPlaying: globalPlaying, currentText } = useVoice();

   // ✅ Extraire le texte si c'est un objet JSON
   const displayText = (() => {
    if (typeof text === 'string') {
      try {
        // Essayer de parser si c'est du JSON
        const parsed = JSON.parse(text);
        return parsed.answer || parsed.text || text;
      } catch {
        // Pas du JSON, retourner tel quel
        return text;
      }
    }
    return String(text);
  })();
  // Auto-play pour les messages AI
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
      await play(text);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };

  const isMessagePlaying = globalPlaying && currentText === text;

  return (
    <div 
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative max-w-[80%]">
        {/* Avatar pour l'IA */}
        {role === 'ai' && (
          <div className="absolute -left-10 top-0 w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <span className="text-xs font-bold text-blue-400">AI</span>
          </div>
        )}

        {/* Bulle de message */}
        <div className={`
          relative rounded-2xl p-4 
          ${role === 'user' 
            ? 'bg-blue-600 text-white ml-auto' 
            : 'bg-white/10 text-white'
          }
        `}>
          {/* ✅ Afficher le texte extrait avec ReactMarkdown */}
          {role === 'ai' ? (
            <ReactMarkdown className="prose prose-invert max-w-none text-sm">
              {displayText}
            </ReactMarkdown>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
          )}

          {/* Boutons de contrôle vocal (visibles au hover) */}
          {role === 'ai' && (
            <div className={`
              absolute -right-10 top-1/2 transform -translate-y-1/2
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              <button
                onClick={isMessagePlaying ? handleStop : handlePlay}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                aria-label={isMessagePlaying ? 'Arrêter' : 'Lire'}
              >
                {isMessagePlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          )}

          {/* Indicateur de lecture en cours */}
          {isMessagePlaying && (
            <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full overflow-hidden">
              <div className="w-full h-full bg-blue-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Métadonnées */}
        <div className="absolute -bottom-5 left-0 text-[8px] text-gray-500">
          {role === 'ai' && (
            <button
              onClick={handlePlay}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              {isMessagePlaying ? (
                <Volume2 className="w-3 h-3" />
              ) : (
                <VolumeX className="w-3 h-3" />
              )}
              <span>Synthèse vocale</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}