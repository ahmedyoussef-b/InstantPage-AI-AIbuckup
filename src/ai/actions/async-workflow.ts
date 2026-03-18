'use server';
/**
 * @fileOverview AsyncWorkflow - Innovation 23.
 * Gestion des tâches longues en arrière-plan avec suivi de progression.
 */

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
}

export interface Workflow {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: WorkflowStep[];
  progress: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// Registre des workflows en mémoire (Simulation pour le prototype local)
const workflowRegistry = new Map<string, Workflow>();

/**
 * Soumet une nouvelle tâche asynchrone.
 */
export async function submitWorkflow(type: string, task: string): Promise<string> {
  const workflowId = `wf-${Math.random().toString(36).substring(7)}`;
  
  const workflow: Workflow = {
    id: workflowId,
    type,
    status: 'queued',
    progress: 0,
    steps: [
      { id: '1', label: 'Analyse initiale', status: 'pending', progress: 0 },
      { id: '2', label: 'Traitement des données', status: 'pending', progress: 0 },
      { id: '3', label: 'Synthèse finale', status: 'pending', progress: 0 }
    ]
  };

  workflowRegistry.set(workflowId, workflow);
  
  // Lancer le traitement en arrière-plan (sans attendre le résultat)
  processWorkflow(workflowId, task).catch(console.error);
  
  return workflowId;
}

/**
 * Récupère l'état d'un workflow.
 */
export async function getWorkflowStatus(workflowId: string): Promise<Workflow | null> {
  return workflowRegistry.get(workflowId) || null;
}

/**
 * Annule un workflow en cours.
 */
export async function cancelWorkflow(workflowId: string): Promise<boolean> {
  const workflow = workflowRegistry.get(workflowId);
  if (workflow && (workflow.status === 'running' || workflow.status === 'queued')) {
    workflow.status = 'cancelled';
    return true;
  }
  return false;
}

/**
 * Logique interne de traitement (Simulée pour le prototype)
 */
async function processWorkflow(id: string, task: string) {
  const workflow = workflowRegistry.get(id);
  if (!workflow) return;

  workflow.status = 'running';
  workflow.startedAt = Date.now();

  for (let i = 0; i < workflow.steps.length; i++) {
    if (workflow.status === 'cancelled') break;

    const step = workflow.steps[i];
    step.status = 'running';
    
    // Simulation de travail IA
    for (let p = 0; p <= 100; p += 25) {
      if (workflow.status === 'cancelled') break;
      step.progress = p;
      workflow.progress = Math.round(((i * 100) + p) / workflow.steps.length);
      await new Promise(r => setTimeout(resolve => r(resolve), 800)); // Délai simulé
    }

    step.status = 'completed';
  }

  if (workflow.status !== 'cancelled') {
    workflow.status = 'completed';
    workflow.completedAt = Date.now();
  }
}
