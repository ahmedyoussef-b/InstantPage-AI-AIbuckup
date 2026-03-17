// components/procedure/StepByStepGuide.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, SkipForward } from 'lucide-react';

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

  // Démarrer la procédure
  const startProcedure = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentStep(data.currentStep);
      setProgress(data.progress);
    } catch (error) {
      console.error('Erreur démarrage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Passer à l'étape suivante
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
      
      const data = await response.json();
      
      if (data.completed) {
        setCompleted(true);
      } else {
        setCurrentStep(data.currentStep);
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Erreur étape suivante:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demander de l'aide
  const requestHelp = async () => {
    if (!problemDescription.trim()) {
      alert('Veuillez décrire le problème');
      return;
    }
    
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
      
      const data = await response.json();
      setHelpResponse(data.help);
      setHelpRequested(true);
    } catch (error) {
      console.error('Erreur demande aide:', error);
    } finally {
      setLoading(false);
    }
  };

  // Annuler la procédure
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
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Guide de démarrage chaudière</h2>
        <p className="text-gray-400 mb-6">15 étapes - Environ 45 minutes</p>
        <Button 
          onClick={startProcedure}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
        >
          {loading ? 'Chargement...' : 'Démarrer la procédure'}
        </Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Procédure terminée !</h2>
        <p className="text-gray-400 mb-6">La chaudière est prête.</p>
        <Button onClick={startProcedure}>Nouvelle procédure</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Étape {progress?.current}/{progress?.total}</span>
          <span>{progress?.percent}%</span>
        </div>
        <Progress value={progress?.percent} className="h-2" />
      </div>

      {/* Carte étape courante */}
      <Card className="bg-white/5 border-blue-500/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {currentStep?.number}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{currentStep?.title}</h3>
              
              {/* Instruction */}
              <div className="bg-blue-600/20 p-4 rounded-lg mb-4">
                <p className="text-white">{currentStep?.instruction}</p>
              </div>
              
              {/* Valeur attendue */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Valeur attendue</p>
                  <p className="text-green-400 font-bold">{currentStep?.expectedValue}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Vérification</p>
                  <p className="text-white">{currentStep?.verificationMethod}</p>
                </div>
              </div>
              
              {/* Avertissement sécurité */}
              {currentStep?.safetyWarning && (
                <div className="bg-yellow-600/20 border border-yellow-500/30 p-3 rounded-lg mb-4">
                  <p className="text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {currentStep.safetyWarning}
                  </p>
                </div>
              )}
              
              {/* Temps estimé */}
              <p className="text-gray-400 text-sm">⏱️ ~{currentStep?.timeEstimate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone d'aide */}
      {!helpRequested ? (
        <Card className="bg-white/5 border-orange-500/30">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              Besoin d'aide ?
            </h4>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Décrivez le problème rencontré..."
              className="w-full bg-gray-800 text-white p-3 rounded-lg mb-2"
              rows={2}
            />
            <Button
              onClick={requestHelp}
              disabled={loading || !problemDescription.trim()}
              variant="outline"
              className="w-full"
            >
              Obtenir de l'aide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-600/20 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-green-400 whitespace-pre-wrap">{helpResponse}</p>
            <Button
              onClick={() => setHelpRequested(false)}
              variant="ghost"
              className="mt-2"
            >
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Boutons de contrôle */}
      <div className="flex gap-3">
        <Button
          onClick={nextStep}
          disabled={loading || helpRequested}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Étape suivante
        </Button>
        
        <Button
          onClick={abortProcedure}
          variant="destructive"
          className="flex-1"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}