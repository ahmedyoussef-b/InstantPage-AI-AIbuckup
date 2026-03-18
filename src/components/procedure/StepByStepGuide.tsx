// components/procedure/StepByStepGuide.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, SkipForward, Download, Play, Pause } from 'lucide-react';

// ============================================
// INTERFACES CORRIGÉES
// ============================================

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
  duree_estimee: string;
  etapes: Etape[];
}

interface Etape {
  numero: number;
  titre: string;
  instruction: string;
  valeur_attendue?: string | Record<string, any>;
  methode_verification?: string;
  consigne_securite?: string;
  duree_estimee: string;
  action_suivante?: string;
  actions_detaillees?: string[];
  conditions?: Condition[];
  seuils?: Record<string, any>;
  verifications?: Verification[];
  cas?: Cas[];
}

interface Condition {
  numero?: number;
  description: string;
  etat_requis: string;
  verification?: string;
  seuil?: string;           // ← AJOUTÉ
  capteurs?: string;        // ← AJOUTÉ
  valeur_mesuree?: string;  // ← AJOUTÉ
}

interface Verification {
  parametre: string;
  conditions?: string;
  seuil?: string;
  capteurs?: string;
  valeur_mesuree?: string;
}

interface Cas {
  type: string;
  action?: string;
  condition?: string;
  conditions?: (Condition & { seuil?: string; capteurs?: string })[];
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function StepByStepGuide() {
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [helpRequested, setHelpRequested] = useState(false);
  const [helpResponse, setHelpResponse] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // Charger la procédure depuis le fichier JSON
  useEffect(() => {
    const loadProcedure = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/procedures/demarrage-chaudiere.json');
        if (!response.ok) {
          throw new Error(`Erreur chargement: ${response.status}`);
        }
        const data = await response.json();
        setProcedure(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        console.error('Erreur chargement procédure:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProcedure();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Chargement de la procédure...</p>
      </div>
    );
  }

  if (error || !procedure) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erreur de chargement</h3>
        <p className="text-gray-400 mb-4">{error || 'Procédure non trouvée'}</p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const currentPhaseData = procedure.phases[currentPhase];
  const currentEtape = currentPhaseData?.etapes[currentStep];
  const totalSteps = procedure.phases.reduce((acc, phase) => acc + phase.etapes.length, 0);
  const stepsCompleted = completedSteps.length;
  const progress = (stepsCompleted / totalSteps) * 100;

  const handleNext = () => {
    // Marquer l'étape comme complétée
    const stepId = `${currentPhase}-${currentStep}`;
    setCompletedSteps(prev => [...prev, stepId]);

    // Passer à l'étape suivante
    if (currentStep + 1 < currentPhaseData.etapes.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentPhase + 1 < procedure.phases.length) {
      setCurrentPhase(currentPhase + 1);
      setCurrentStep(0);
    } else {
      // Procédure terminée
      alert('✅ Procédure terminée avec succès !');
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const requestHelp = async () => {
    if (!problemDescription.trim()) {
      alert('Veuillez décrire le problème');
      return;
    }

    setHelpRequested(true);
    setHelpResponse("Analyse du problème en cours...");

    try {
      // Appel à l'IA locale pour obtenir de l'aide
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Problème sur étape ${currentEtape?.numero}: ${currentEtape?.titre}\nDescription: ${problemDescription}\nDonne des conseils pratiques pour résoudre ce problème.`,
          context: JSON.stringify(currentEtape)
        })
      });
      
      const data = await response.json();
      setHelpResponse(data.answer);
    } catch (error) {
      setHelpResponse("Erreur de communication avec l'assistant. Veuillez réessayer.");
    }
  };

  // Fonction pour afficher une valeur de manière sécurisée
  const displayValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* En-tête procédure */}
      <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
        <h2 className="text-2xl font-bold text-white mb-2">{procedure.procedure.nom}</h2>
        <p className="text-gray-300 mb-2">{procedure.procedure.description}</p>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">Version: {procedure.procedure.version}</span>
          <span className="text-gray-400">Durée: {procedure.procedure.duree_estimee}</span>
          <span className="text-yellow-400 font-semibold">⚠️ {procedure.procedure.niveau_securite}</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progression: {stepsCompleted}/{totalSteps} étapes</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Phase courante */}
      <div className="bg-purple-600/20 p-3 rounded-lg border border-purple-500/30">
        <h3 className="font-semibold text-purple-400">
          Phase {currentPhaseData.numero}: {currentPhaseData.nom}
        </h3>
        <p className="text-sm text-gray-400">{currentPhaseData.description}</p>
      </div>

      {/* Étape courante */}
      <Card className="bg-white/5 border-blue-500/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {currentEtape.numero}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4">{currentEtape.titre}</h3>
              
              {/* Instruction */}
              <div className="bg-blue-600/20 p-4 rounded-lg mb-4">
                <p className="text-white">{currentEtape.instruction}</p>
              </div>

              {/* Actions détaillées */}
              {currentEtape.actions_detaillees && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Actions à réaliser :</p>
                  <ul className="list-disc list-inside space-y-1">
                    {currentEtape.actions_detaillees.map((action, idx) => (
                      <li key={idx} className="text-white text-sm">{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valeur attendue */}
              {currentEtape.valeur_attendue && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Valeur attendue</p>
                    <p className="text-green-400 font-bold">
                      {displayValue(currentEtape.valeur_attendue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Vérification</p>
                    <p className="text-white">{currentEtape.methode_verification}</p>
                  </div>
                </div>
              )}

              {/* Conditions */}
              {currentEtape.conditions && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Conditions à vérifier :</p>
                  <div className="space-y-2">
                    {currentEtape.conditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-800/50 p-2 rounded">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-green-500"
                          onChange={(e) => {
                            // Gérer la validation
                          }}
                        />
                        <span className="text-sm text-white">{cond.description}</span>
                        <span className="text-xs text-gray-400 ml-auto">{cond.etat_requis}</span>
                        {cond.seuil && (
                          <span className="text-xs text-yellow-400">(seuil: {cond.seuil})</span>
                        )}
                        {cond.capteurs && (
                          <span className="text-xs text-blue-400">[{cond.capteurs}]</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Champs de saisie pour valeurs mesurées */}
              {currentEtape.verifications?.map((verif, idx) => (
                <div key={idx} className="mb-3">
                  <label className="text-sm text-gray-400 block mb-1">
                    {verif.parametre} 
                    {verif.seuil && ` (seuil: ${verif.seuil})`}
                    {verif.capteurs && ` [${verif.capteurs}]`}
                  </label>
                  <input
                    type="text"
                    placeholder="Saisir valeur mesurée..."
                    className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                    value={inputValues[`${currentEtape.numero}-${idx}`] || ''}
                    onChange={(e) => handleInputChange(`${currentEtape.numero}-${idx}`, e.target.value)}
                  />
                </div>
              ))}

              {/* Seuils */}
              {currentEtape.seuils && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Object.entries(currentEtape.seuils).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-gray-400 text-sm">{key.toUpperCase()}</p>
                      <p className="text-yellow-400 font-bold">{displayValue(value)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cas particuliers */}
              {currentEtape.cas && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Cas particuliers :</p>
                  {currentEtape.cas.map((cas, idx) => (
                    <div key={idx} className="bg-gray-800/50 p-3 rounded mb-2">
                      <p className="font-semibold text-purple-400">{cas.type}</p>
                      {cas.action && <p className="text-sm text-white">Action: {cas.action}</p>}
                      {cas.conditions && cas.conditions.map((c, i) => (
                        <div key={i} className="text-xs text-gray-300 mt-1">
                          {c.description}
                          {c.seuil && <span className="text-yellow-400"> (seuil: {c.seuil})</span>}
                          {c.capteurs && <span className="text-blue-400"> [{c.capteurs}]</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Consigne sécurité */}
              {currentEtape.consigne_securite && (
                <div className="bg-red-600/20 border border-red-500/30 p-3 rounded-lg">
                  <p className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {currentEtape.consigne_securite}
                  </p>
                </div>
              )}

              {/* Durée estimée */}
              <p className="text-gray-400 text-sm mt-4">⏱️ Durée: {currentEtape.duree_estimee}</p>
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
              disabled={!problemDescription.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
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
              onClick={() => {
                setHelpRequested(false);
                setProblemDescription('');
              }}
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
          onClick={handleNext}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Étape suivante
        </Button>
        
        <Button
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir annuler la procédure ?')) {
              setCurrentPhase(0);
              setCurrentStep(0);
              setCompletedSteps([]);
              setInputValues({});
            }
          }}
          variant="destructive"
          className="flex-1"
        >
          Annuler
        </Button>
      </div>

      {/* Résumé des étapes */}
      <div className="text-xs text-gray-500 text-center">
        Étape {stepsCompleted + 1}/{totalSteps} • Phase {currentPhase + 1}/{procedure.phases.length}
      </div>
    </div>
  );
}