'use client';

/**
 * StepByStepGuide - Interface de guidage interactif.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Procedure {
  procedure: {
    id: string;
    title: string;
    totalSteps: number;
  };
  steps: Etape[];
}

interface Etape {
  number: number;
  title: string;
  instruction: string;
  expectedValue: string;
  verificationMethod: string;
  safetyWarning?: string;
  timeEstimate: string;
}

export default function StepByStepGuide() {
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [helpResponse, setHelpResponse] = useState<string | null>(null);
  const [isAskingHelp, setIsAskingHelp] = useState(false);

  useEffect(() => {
    loadProcedure();
  }, []);

  const loadProcedure = async () => {
    try {
      setLoading(true);
      const res = await fetch('/data/procedures/demarrage-chaudiere.json');
      if (!res.ok) throw new Error("Fichier de procédure inaccessible.");
      const data = await res.json();
      setProcedure(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error || !procedure) return <div className="p-10 text-red-400 text-center"><AlertCircle className="mx-auto mb-2" /> {error}</div>;

  const etape = procedure.steps[currentStepIdx];
  const progress = ((currentStepIdx + 1) / procedure.procedure.totalSteps) * 100;

  const handleNext = () => {
    setHelpResponse(null);
    if (currentStepIdx + 1 < procedure.procedure.totalSteps) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      alert("Procédure terminée avec succès.");
    }
  };

  const askHelp = async () => {
    setIsAskingHelp(true);
    try {
      const response = await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'help', problem: 'Besoin de précisions techniques', sessionId: 'PRO_SESSION' })
      });
      
      if (!response.ok) throw new Error("Erreur serveur");
      const data = await response.json();
      setHelpResponse(data.help || "Aucune aide disponible.");
    } catch {
      setHelpResponse("Désolé, je n'ai pas pu contacter l'assistant technique.");
    } finally {
      setIsAskingHelp(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{procedure.procedure.title}</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Session de guidage</p>
        </div>
        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20">Étape {etape.number}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 bg-white/5" />
      </div>

      <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">
              {etape.number}
            </div>
            <div className="space-y-4 flex-1">
              <h3 className="text-lg md:text-xl font-black text-white leading-tight">{etape.title}</h3>
              <div className="p-4 bg-white/5 rounded-xl border-l-4 border-blue-500">
                <p className="text-sm md:text-base text-gray-200 leading-relaxed italic">"{etape.instruction}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Cible</p>
                  <p className="text-sm font-bold text-white">{etape.expectedValue}</p>
                </div>
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                  <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Vérification</p>
                  <p className="text-sm font-bold text-white">{etape.verificationMethod}</p>
                </div>
              </div>

              {etape.safetyWarning && (
                <div className="p-3 bg-red-600/10 rounded-xl border border-red-500/20 flex gap-3 items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[10px] md:text-xs font-bold text-red-400 uppercase leading-tight">{etape.safetyWarning}</p>
                </div>
              )}
            </div>
          </div>

          {helpResponse && (
            <div className="animate-in zoom-in-95 duration-300 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-sm text-blue-100">
              <p className="font-black uppercase text-[10px] text-blue-400 mb-2">Conseil de l'assistant :</p>
              {helpResponse}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 text-white font-black h-12 rounded-xl flex-1 uppercase tracking-tighter">
              <CheckCircle className="w-4 h-4 mr-2" /> Étape Effectuée
            </Button>
            <Button 
              variant="outline" 
              onClick={askHelp} 
              disabled={isAskingHelp}
              className="border-white/10 hover:bg-white/5 h-12 rounded-xl text-gray-400 font-bold uppercase tracking-tighter"
            >
              {isAskingHelp ? <Loader2 className="animate-spin w-4 h-4" /> : <HelpCircle className="w-4 h-4 mr-2" />}
              Aide Technique
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
