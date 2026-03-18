// src/ai/learning/curriculum.ts
export class AdaptiveCurriculum {
    private topics: Map<string, Topic> = new Map();
    private userMastery: Map<string, number> = new Map();
    private learningPath: LearningPath[] = [];
    
    async initializeCurriculum(domain: string) {
      // 1. Analyser le domaine pour identifier les concepts
      const concepts = await this.extractConcepts(domain);
      
      // 2. Construire le graphe de dépendances
      const dependencyGraph = await this.buildDependencyGraph(concepts);
      
      // 3. Créer un curriculum progressif
      this.learningPath = this.buildLearningPath(dependencyGraph);
      
      // 4. Initialiser les niveaux de maîtrise
      for (const topic of this.learningPath) {
        this.userMastery.set(topic.id, 0);
      }
    }
    
    async getNextTopic(userId: string): Promise<Topic | null> {
      // 1. Trouver les prochains sujets disponibles
      const available = this.learningPath.filter(topic => 
        this.isAvailable(topic) && 
        this.userMastery.get(topic.id)! < 0.8 // Pas encore maîtrisé
      );
      
      if (available.length === 0) return null;
      
      // 2. Choisir le sujet optimal (ni trop facile, ni trop dur)
      const optimal = this.selectOptimalTopic(available);
      
      // 3. Adapter la difficulté au niveau de l'utilisateur
      const adapted = await this.adaptDifficulty(optimal, userId);
      
      return adapted;
    }
    
    async assessProgress(userId: string, interaction: Interaction): Promise<void> {
      const topicId = interaction.topicId;
      const currentMastery = this.userMastery.get(topicId) || 0;
      
      // Évaluer la performance
      const performance = await this.evaluatePerformance(interaction);
      
      // Mettre à jour le niveau de maîtrise
      const newMastery = this.updateMastery(currentMastery, performance);
      this.userMastery.set(topicId, newMastery);
      
      // Si maîtrise suffisante, débloquer les sujets suivants
      if (newMastery >= 0.8) {
        await this.unlockNextTopics(topicId);
      }
      
      // Adapter le curriculum si nécessaire
      await this.adaptCurriculum(userId);
    }
    
    private async adaptDifficulty(topic: Topic, userId: string): Promise<Topic> {
      const masteryLevel = this.getAverageMastery(userId);
      
      // Ajuster la difficulté au niveau de l'utilisateur
      if (masteryLevel < 0.3) {
        // Débutant: versions simplifiées
        return this.simplifyTopic(topic);
      } else if (masteryLevel > 0.7) {
        // Avancé: versions plus complexes
        return this.enhanceTopic(topic);
      }
      
      return topic;
    }
    
    private async simplifyTopic(topic: Topic): Promise<Topic> {
      const prompt = `Sujet: "${topic.name}"
  Description: "${topic.description}"
  
  Crée une version simplifiée de ce sujet pour un débutant:
  - Utilise un langage plus simple
  - Ajoute plus d'exemples
  - Évite les concepts avancés
  - Inclus des analogies
  
  Format JSON: {
    "name": "string",
    "description": "string",
    "examples": ["string"],
    "analogies": ["string"]
  }`;
      
      const simplified = await this.model.generate(prompt);
      return JSON.parse(simplified);
    }
    
    private async buildDependencyGraph(concepts: Concept[]): Promise<Graph> {
      const graph = new Graph();
      
      for (const concept of concepts) {
        // Identifier les prérequis pour chaque concept
        const prerequisites = await this.identifyPrerequisites(concept);
        
        for (const prereq of prerequisites) {
          graph.addEdge(prereq, concept.id);
        }
      }
      
      return graph;
    }
    
    private async identifyPrerequisites(concept: Concept): Promise<string[]> {
      const prompt = `Concept: "${concept.name}"
  Description: "${concept.description}"
  
  Quels sont les 1-3 concepts qu'il faut maîtriser avant celui-ci?
  Liste les IDs des concepts prérequis:`;
      
      const response = await this.model.generate(prompt);
      return this.parsePrerequisites(response);
    }
    
    private selectOptimalTopic(available: Topic[]): Topic {
      // Zone proximale de développement: ni trop facile, ni trop dur
      const userLevel = this.getUserLevel();
      
      return available.reduce((optimal, topic) => {
        const distance = Math.abs(topic.difficulty - userLevel);
        const optimalDistance = Math.abs(optimal.difficulty - userLevel);
        return distance < optimalDistance ? topic : optimal;
      });
    }
    
    private async evaluatePerformance(interaction: Interaction): Promise<number> {
      const factors = {
        correctAnswers: interaction.correctAnswers || 0,
        timeSpent: Math.min(interaction.timeSpent / 30000, 1), // Normalisé à 30s
        helpRequested: interaction.helpRequested ? -0.3 : 0,
        confidence: interaction.userConfidence || 0.5
      };
      
      return (
        factors.correctAnswers * 0.5 +
        (1 - factors.timeSpent) * 0.2 +
        factors.confidence * 0.3 +
        factors.helpRequested
      );
    }
  }