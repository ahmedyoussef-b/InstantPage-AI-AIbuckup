'use client';

import { useState, useEffect } from 'react';
import { useVoice } from '@/hooks/useVoice';
import { VoiceInfo } from '@/types/voice';
import { 
  Volume2, 
  Settings2, 
  X, 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  Trash2, 
  Mic, 
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VoiceControls() {
  const {
    isPlaying,
    isPaused,
    queue,
    volume,
    speed,
    pause,
    resume,
    stop,
    setVolume,
    setSpeed,
    clearQueue
  } = useVoice();

  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('fr-FR-female-1');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch('/api/voice/voices')
      .then(res => res.json())
      .then(data => setVoices(data.voices || []))
      .catch(err => console.error("Erreur chargement voix:", err));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Panneau de contrôle */}
      {showSettings && (
        <div className="w-80 bg-[#171717] rounded-3xl shadow-2xl border border-white/10 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Synthèse Vocale</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="h-8 w-8 rounded-full hover:bg-white/10">
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          
          {/* État de lecture */}
          {(isPlaying || isPaused) && (
            <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  {isPlaying ? '• Lecture active' : '• En pause'}
                </span>
                <div className="flex gap-1">
                  {isPlaying ? (
                    <Button variant="ghost" size="icon" onClick={pause} className="h-7 w-7 text-white hover:bg-white/10">
                      <PauseCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={resume} className="h-7 w-7 text-white hover:bg-white/10">
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={stop} className="h-7 w-7 text-red-400 hover:bg-red-400/10">
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {queue.length > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-medium">File d'attente: {queue.length}</span>
                  <Button variant="ghost" size="sm" onClick={clearQueue} className="h-6 px-2 text-[9px] font-black uppercase text-red-400">
                    <Trash2 className="w-3 h-3 mr-1" /> Vider
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Volume</label>
                <span className="text-[10px] text-blue-400 font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(vals) => setVolume(vals[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vitesse</label>
                <span className="text-[10px] text-blue-400 font-mono">{speed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[speed]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(vals) => setSpeed(vals[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Voix & Moteur</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-blue-400" />
                    <SelectValue placeholder="Choisir une voix" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                  {voices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id} className="focus:bg-blue-600 focus:text-white">
                      {voice.name} ({voice.language})
                    </SelectItem>
                  ))}
                  {voices.length === 0 && (
                    <SelectItem value="default" disabled className="text-gray-500 italic">Chargement des voix...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
            <Badge variant="outline" className="text-[8px] border-white/10 text-gray-500 uppercase font-black">Moteur: Piper (Local)</Badge>
            <span className="text-[8px] text-gray-600 uppercase font-black">Version 1.2</span>
          </div>
        </div>
      )}

      {/* Bouton Trigger Principal */}
      <Button
        onClick={() => setShowSettings(!showSettings)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 group ${
          showSettings ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {showSettings ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Volume2 className={`w-6 h-6 text-white transition-transform ${isPlaying ? 'animate-pulse scale-110' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>
        )}
      </Button>
    </div>
  );
}
