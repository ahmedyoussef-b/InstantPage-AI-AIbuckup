'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Step {
  number: number;
  title: string;
  instruction: string;
  expectedValue: string;
  verificationMethod: string;
  safetyWarning?: string;
  timeEstimate: string;
}

interface ProcedureProgress {
  current: number;
  total: number;
  percent: number;
}

export default function StepByStepGuide() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [progress, setProgress] = useState<ProcedureProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [helpResponse, setHelpResponse] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const startProcedure = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (!response.ok) throw new Error('Erreur lors du démarrage de la procédure');
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentStep(data.currentStep);
      setProgress(data.progress);
      setCompleted(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de démarrer la procédure."
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    setLoading(true);
    setHelpRequested(false);
    setHelpResponse('');
    
    try {
      const response = await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'next', 
          sessionId 
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors du passage à l\'étape suivante');
      }
      
      const data = await response.json();
      
      if (data.completed) {
        setCompleted(true);
      } else {
        setCurrentStep(data.currentStep);
        setProgress(data.progress);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Session expirée",
        description: "La session a été perdue. Veuillez recommencer la procédure."
      });
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const requestHelp = async () => {
    if (!problemDescription.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'help', 
          sessionId,
          problem: problemDescription
        })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la demande d\'aide');
      
      const data = await response.json();
      setHelpResponse(data.help);
      setHelpRequested(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'aide",
        description: "Impossible d'obtenir l'aide de l'IA pour le moment."
      });
    } finally {
      setLoading(false);
    }
  };

  const abortProcedure = async () => {
    if (confirm('Êtes-vous sûr de vouloir annuler la procédure ?')) {
      await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abort', sessionId })
      });
      
      setSessionId(null);
      setCurrentStep(null);
      setProgress(null);
      setCompleted(false);
    }
  };

  if (!sessionId && !completed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
          <AlertCircle className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Guide Démarrage Chaudière</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Bonjour AHMED. Ce guide interactif vous accompagnera étape par étape dans la mise en service.
        </p>
        <Button 
          onClick={startProcedure}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Démarrer la mission'}
        </Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="text-center p-12 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Mission Accomplie</h2>
        <p className="text-gray-400 mb-8 font-medium">La chaudière est désormais opérationnelle, AHMED.</p>
        <Button onClick={startProcedure} variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 px-8">
          Nouvelle Procédure
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Progression</p>
            <p className="text-xl font-black text-white">Étape {progress?.current} <span className="text-gray-600">/ {progress?.total}</span></p>
          </div>
          <span className="text-sm font-mono text-blue-400 font-bold">{progress?.percent}%</span>
        </div>
        <Progress value={progress?.percent} className="h-2 bg-white/5" />
      </div>

      <Card className="bg-[#2a2a2a] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-blue-600 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-inner">
              {currentStep?.number}
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{currentStep?.title}</h3>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
              <p className="text-gray-200 leading-relaxed font-medium">{currentStep?.instruction}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valeur attendue</p>
                <p className="text-green-400 font-black text-lg">{currentStep?.expectedValue}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Méthode</p>
                <p className="text-white font-bold text-sm">{currentStep?.verificationMethod}</p>
              </div>
            </div>
            
            {currentStep?.safetyWarning && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-400 text-xs font-bold leading-tight uppercase">{currentStep.safetyWarning}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <span>Temps estimé : {currentStep?.timeEstimate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!helpRequested ? (
        <Card className="bg-white/5 border-orange-500/20 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h4 className="font-black text-xs text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Difficulté technique ?
            </h4>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Décrivez précisément ce qui bloque..."
              className="w-full bg-black/20 border border-white/5 text-white p-4 rounded-xl text-sm placeholder:text-gray-600 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
              rows={2}
            />
            <Button
              onClick={requestHelp}
              disabled={loading || !problemDescription.trim()}
              className="w-full bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-600/30 rounded-xl font-bold py-5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Demander conseil à l'IA"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-blue-600/10 border-blue-600/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <CardContent className="p-6">
             <div className="flex items-center gap-2 mb-4">
               <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                 <span className="text-[10px] font-bold text-white">AI</span>
               </div>
               <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Conseil d'expert</span>
             </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-6 italic">"{helpResponse}"</p>
            <Button
              onClick={() => setHelpRequested(false)}
              variant="ghost"
              className="text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 text-gray-500"
            >
              Fermer l'assistance
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          onClick={nextStep}
          disabled={loading || helpRequested}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold h-14 rounded-2xl shadow-lg shadow-green-600/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Valider l'étape</>}
        </Button>
        
        <Button
          onClick={abortProcedure}
          variant="ghost"
          className="flex-1 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl font-bold"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
