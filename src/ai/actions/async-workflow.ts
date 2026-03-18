// src/ai/actions/async-workflow.ts
export class AsyncWorkflowManager {
    private activeWorkflows: Map<string, Workflow> = new Map();
    private workflowQueue: Workflow[] = [];
    private maxConcurrent = 3;
    
    async submitWorkflow(workflow: Workflow): Promise<string> {
      const workflowId = generateId();
      
      workflow.id = workflowId;
      workflow.status = 'queued';
      workflow.submittedAt = Date.now();
      
      this.workflowQueue.push(workflow);
      
      // Démarrer le processeur si disponible
      this.processQueue();
      
      return workflowId;
    }
    
    async getStatus(workflowId: string): Promise<WorkflowStatus> {
      const workflow = this.activeWorkflows.get(workflowId) || 
                       this.workflowQueue.find(w => w.id === workflowId);
      
      if (!workflow) {
        return { status: 'not_found' };
      }
      
      return {
        status: workflow.status,
        progress: workflow.progress,
        estimatedTimeRemaining: this.estimateTimeRemaining(workflow),
        currentStep: workflow.currentStep,
        result: workflow.result
      };
    }
    
    private async processQueue() {
      if (this.activeWorkflows.size >= this.maxConcurrent) return;
      
      while (this.workflowQueue.length > 0 && this.activeWorkflows.size < this.maxConcurrent) {
        const workflow = this.workflowQueue.shift()!;
        workflow.status = 'running';
        workflow.startedAt = Date.now();
        
        this.activeWorkflows.set(workflow.id, workflow);
        
        // Exécuter sans attendre (asynchrone)
        this.executeWorkflow(workflow).finally(() => {
          this.activeWorkflows.delete(workflow.id);
          this.processQueue(); // Traiter la file d'attente
        });
      }
    }
    
    private async executeWorkflow(workflow: Workflow) {
      try {
        for (let i = 0; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];
          
          // Mettre à jour la progression
          workflow.currentStep = step;
          workflow.progress = (i / workflow.steps.length) * 100;
          
          // Notifier les listeners
          this.notifyProgress(workflow);
          
          // Exécuter l'étape
          step.result = await this.executeStep(step);
          
          // Vérifier si l'utilisateur a demandé l'annulation
          if (workflow.cancelled) {
            workflow.status = 'cancelled';
            this.notifyCompletion(workflow);
            return;
          }
        }
        
        workflow.status = 'completed';
        workflow.completedAt = Date.now();
        this.notifyCompletion(workflow);
        
      } catch (error) {
        workflow.status = 'failed';
        workflow.error = error;
        this.notifyCompletion(workflow);
      }
    }
    
    async cancelWorkflow(workflowId: string): Promise<boolean> {
      const workflow = this.activeWorkflows.get(workflowId);
      if (workflow) {
        workflow.cancelled = true;
        return true;
      }
      
      // Supprimer de la file d'attente si présent
      const queueIndex = this.workflowQueue.findIndex(w => w.id === workflowId);
      if (queueIndex >= 0) {
        this.workflowQueue.splice(queueIndex, 1);
        return true;
      }
      
      return false;
    }
    
    private notifyProgress(workflow: Workflow) {
      // Émettre un événement pour l'interface utilisateur
      this.eventEmitter.emit('workflow-progress', {
        id: workflow.id,
        progress: workflow.progress,
        step: workflow.currentStep
      });
    }
    
    private estimateTimeRemaining(workflow: Workflow): number | null {
      if (workflow.status !== 'running' || !workflow.startedAt) return null;
      
      const elapsed = Date.now() - workflow.startedAt;
      const progress = workflow.progress / 100;
      
      if (progress === 0) return null;
      
      return Math.round(elapsed / progress - elapsed);
    }
  }
  
  // Interface utilisateur pour les workflows asynchrones
  class WorkflowUI {
    async renderWorkflowStatus(workflowId: string) {
      const status = await workflowManager.getStatus(workflowId);
      
      if (status.status === 'running') {
        return `
  ⚙️ Workflow en cours...
  Progression: ${status.progress}%
  Étape actuelle: ${status.currentStep}
  Temps restant estimé: ${this.formatTime(status.estimatedTimeRemaining)}
  [⏸️ Pause] [⏹️ Annuler]
        `;
      }
      
      if (status.status === 'completed') {
        return `
  ✅ Workflow terminé!
  Résultat: ${JSON.stringify(status.result)}
  Temps total: ${this.formatTime(status.completedAt - status.startedAt)}
        `;
      }
    }
  }