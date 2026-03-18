
'use client';

/**
 * StepByStepGuide - Interface de guidage interactif pour AHMED.
 * Protégé contre les erreurs de JSON vide.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

interface Procedure {
  procedure: {
    id: string;
    nom: string;
    description: string;
    version: string;
    duree_estimee: string;
    niveau_securite: string;
  };
  phases: Phase[];
}

interface Phase {
  numero: number;
  nom: string;
  description: string;
  etapes: Etape[];
}

interface Etape {
  numero: number;
  titre: string;
  instruction: string;
  valeur_attendue?: string;
  methode_verification?: string;
  consigne_securite?: string;
  duree_estimee: string;
}

export default function StepByStepGuide() {
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
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

  const phase = procedure.phases[currentPhase];
  const etape = phase.etapes[currentStep];
  const totalSteps = procedure.phases.reduce((acc, p) => acc + p.etapes.length, 0);
  const currentGlobalStep = procedure.phases.slice(0, currentPhase).reduce((acc, p) => acc + p.etapes.length, 0) + currentStep + 1;
  const progress = (currentGlobalStep / totalSteps) * 100;

  const handleNext = () => {
    setHelpResponse(null);
    if (currentStep + 1 < phase.etapes.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentPhase + 1 < procedure.phases.length) {
      setCurrentPhase(currentPhase + 1);
      setCurrentStep(0);
    } else {
      alert("Félicitations AHMED, procédure terminée !");
    }
  };

  const askHelp = async () => {
    setIsAskingHelp(true);
    try {
      const res = await fetch('/api/procedure', {
        method: 'POST',
        body: JSON.stringify({ action: 'help', problem: 'Besoin de précisions' })
      });
      const data = await res.json();
      setHelpResponse(data.help || "Aucune aide disponible.");
    } catch {
      setHelpResponse("Désolé AHMED, je n'ai pas pu contacter l'assistant.");
    } finally {
      setIsAskingHelp(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{procedure.procedure.nom}</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Session pour AHMED</p>
        </div>
        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20">Phase {phase.numero}</Badge>
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
              {etape.numero}
            </div>
            <div className="space-y-4 flex-1">
              <h3 className="text-lg md:text-xl font-black text-white leading-tight">{etape.titre}</h3>
              <div className="p-4 bg-white/5 rounded-xl border-l-4 border-blue-500">
                <p className="text-sm md:text-base text-gray-200 leading-relaxed italic">"{etape.instruction}"</p>
              </div>

              {etape.valeur_attendue && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Cible</p>
                    <p className="text-sm font-bold text-white">{etape.valeur_attendue}</p>
                  </div>
                  <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Vérification</p>
                    <p className="text-sm font-bold text-white">{etape.methode_verification}</p>
                  </div>
                </div>
              )}

              {etape.consigne_securite && (
                <div className="p-3 bg-red-600/10 rounded-xl border border-red-500/20 flex gap-3 items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[10px] md:text-xs font-bold text-red-400 uppercase leading-tight">{etape.consigne_securite}</p>
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
              Aide AHMED
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
