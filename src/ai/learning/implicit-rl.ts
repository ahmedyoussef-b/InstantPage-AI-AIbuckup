/**
 * @fileOverview ImplicitRL - Innovation 26.
 * Apprentissage par renforcement basé sur les signaux implicites de l'utilisateur.
 * Transforme les interactions en vecteurs de récompense pour ajuster le comportement.
 */

export interface UserPreferenceProfile {
  conciseness: number; // 0 à 1
  technicality: number; // 0 à 1
  formality: number; // 0 à 1
  lastUpdated: number;
}

export type RewardSignal = 
  | 'CORRECTION'      // Récompense négative forte
  | 'ACCEPTANCE'      // Récompense positive
  | 'REFORMULATION'   // Récompense négative faible
  | 'USAGE'           // Récompense positive (l'utilisateur a utilisé l'info)
  | 'HESITATION';     // Signal neutre/négatif

export class ImplicitRLEngine {
  private profile: UserPreferenceProfile = {
    conciseness: 0.5,
    technicality: 0.7,
    formality: 0.6,
    lastUpdated: Date.now()
  };

  private learningRate = 0.05;

  /**
   * Traite un signal de récompense et met à jour le profil de préférences.
   */
  async processSignal(signal: RewardSignal, context: any): Promise<void> {
    console.log(`[AI][RL] Signal reçu : ${signal}`);
    
    switch (signal) {
      case 'CORRECTION':
        // Si l'utilisateur corrige, on ajuste le profil à l'opposé de la réponse fournie
        this.adjustProfile(context, -2);
        break;
      case 'ACCEPTANCE':
        this.adjustProfile(context, 1);
        break;
      case 'REFORMULATION':
        this.adjustProfile(context, -0.5);
        break;
      case 'USAGE':
        this.adjustProfile(context, 1.5);
        break;
    }
    
    this.saveProfile();
  }

  /**
   * Génère une directive de système basée sur les préférences apprises.
   */
  getSystemDirective(): string {
    const p = this.profile;
    let directive = "\n[PRÉFÉRENCES APPRISES] : ";
    
    if (p.conciseness > 0.7) directive += "Sois extrêmement concis. ";
    else if (p.conciseness < 0.3) directive += "Donne des explications détaillées. ";
    
    if (p.technicality > 0.8) directive += "Utilise un jargon technique expert. ";
    else if (p.technicality < 0.4) directive += "Vulgarise les concepts complexes. ";
    
    return directive;
  }

  private adjustProfile(context: any, weight: number) {
    // Logique simplifiée : on déduit les traits de la réponse du contexte
    // Dans une version complète, on analyserait la réponse via LLM
    const impact = this.learningRate * weight;
    
    // Simulation d'ajustement
    if (context.isLong) this.profile.conciseness -= impact;
    if (context.isTechnical) this.profile.technicality += impact;
    
    // Bornage
    this.profile.conciseness = Math.max(0, Math.min(1, this.profile.conciseness));
    this.profile.technicality = Math.max(0, Math.min(1, this.profile.technicality));
    this.profile.lastUpdated = Date.now();
  }

  private saveProfile() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('AGENTIC_RL_PROFILE_V1', JSON.stringify(this.profile));
  }

  loadProfile() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('AGENTIC_RL_PROFILE_V1');
    if (stored) this.profile = JSON.parse(stored);
  }
}

export const implicitRL = new ImplicitRLEngine();
