/**
 * @fileOverview PersonalizedRecommender - Système de recommandation piloté par le profil utilisateur.
 */

import { Recommendation, RecommendationContext, UserProfile, Candidate, ScoredCandidate } from './types';

export class PersonalizedRecommender {
  /**
   * Génère des recommandations personnalisées basées sur l'expertise et l'historique.
   */
  async recommend(userId: string, context: RecommendationContext): Promise<Recommendation[]> {
    const profile = await this.getMockProfile(userId);
    
    const candidates: Candidate[] = [
      { id: 'rec-1', title: "Réviser la procédure gaz", description: "Basé sur votre dernière interaction, une révision de la vanne HV701 est suggérée.", category: "Maintenance", confidence: 0.92 },
      { id: 'rec-2', title: "Nouvelle doc : Pompe à chaleur", description: "Un nouveau manuel sur les PAC a été ajouté à la base.", category: "Document", confidence: 0.85 }
    ];

    const scored = candidates.map(c => ({
      ...c,
      score: this.calculateScore(c, profile),
      reasons: ["Sujet lié à vos activités récentes", "Expertise intermédiaire détectée"]
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, context.limit || 5);
  }

  private calculateScore(candidate: Candidate, profile: UserProfile): number {
    let score = candidate.confidence;
    if (profile.expertise === 'expert' && candidate.category === 'Maintenance') score += 0.05;
    return Math.min(score, 1.0);
  }

  private async getMockProfile(userId: string): Promise<UserProfile> {
    return {
      userId,
      interests: ['maintenance', 'thermique'],
      expertise: 'intermediate',
      preferences: { conciseness: 0.8 },
      recentTopics: ['chaudière', 'vanne'],
      documentTypes: ['pdf', 'json'],
      lastUpdated: Date.now()
    };
  }
}
