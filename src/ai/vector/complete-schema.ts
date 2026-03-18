// src/ai/vector/complete-schema.ts
export const VectorCollections = {
    // 📄 DOCUMENTS - Base
    documents: {
      description: "Fichiers uploadés par l'utilisateur",
      fields: ['content', 'filename', 'type', 'uploadDate'],
      updateFrequency: 'on_upload'
    },
    
    // 💬 INTERACTIONS - Toutes les conversations
    interactions: {
      description: "Questions/réponses complètes",
      fields: ['query', 'response', 'userId', 'timestamp', 'satisfaction'],
      updateFrequency: 'real_time'
    },
    
    // 🧠 CONCEPTS - Extraits des documents et interactions
    concepts: {
      description: "Concepts clés identifiés",
      fields: ['name', 'definition', 'source', 'importance', 'relatedDocs'],
      updateFrequency: 'periodic'
    },
    
    // 🔗 RELATIONS - Liens entre concepts
    relations: {
      description: "Relations sémantiques",
      fields: ['source', 'target', 'type', 'strength'],
      updateFrequency: 'periodic'
    },
    
    // 📚 LEÇONS - Apprentissages de l'IA
    learnings: {
      description: "Ce que l'IA a appris",
      fields: ['content', 'context', 'importance', 'confidence', 'verificationCount'],
      updateFrequency: 'after_feedback'
    },
    
    // ⚡ ACTIONS - Historique des actions
    actions: {
      description: "Actions exécutées",
      fields: ['decision', 'action', 'result', 'success', 'userId'],
      updateFrequency: 'after_action'
    },
    
    // 🔍 RAISONNEMENTS - Démarches logiques
    reasonings: {
      description: "Chaînes de raisonnement réussies",
      fields: ['query', 'steps', 'conclusion', 'success'],
      updateFrequency: 'after_success'
    },
    
    // 👤 PROFIL UTILISATEUR - Patterns personnalisés
    userPatterns: {
      description: "Préférences et habitudes",
      fields: ['userId', 'pattern', 'frequency', 'lastUsed'],
      updateFrequency: 'continuous'
    },
    
    // 🏷️ TAGS - Métadonnées riches
    tags: {
      description: "Tags pour tous les éléments",
      fields: ['name', 'items', 'count'],
      updateFrequency: 'continuous'
    }
  };
  
  // Exemple d'insertion enrichie
  async function insertRichInteraction(interaction: any) {
    // 1. Vectoriser l'interaction complète
    const embedding = await getEmbedding(
      `${interaction.query} ${interaction.response}`
    );
    
    // 2. Insérer dans interactions
    await vectorDB.insert({
      collection: 'interactions',
      vector: embedding,
      metadata: {
        query: interaction.query,
        response: interaction.response,
        userId: interaction.userId,
        timestamp: Date.now(),
        satisfaction: interaction.feedback
      }
    });
    
    // 3. Extraire et insérer les concepts
    const concepts = await extractConcepts(interaction.query);
    for (const concept of concepts) {
      const conceptEmbedding = await getEmbedding(concept);
      
      await vectorDB.insert({
        collection: 'concepts',
        vector: conceptEmbedding,
        metadata: {
          name: concept,
          source: 'interaction',
          sourceId: interaction.id,
          importance: 0.7
        }
      });
    }
    
    // 4. Si l'interaction était réussie, sauvegarder le raisonnement
    if (interaction.success) {
      await vectorDB.insert({
        collection: 'reasonings',
        vector: embedding,
        metadata: {
          query: interaction.query,
          steps: interaction.reasoningSteps,
          conclusion: interaction.response,
          success: true
        }
      });
    }
  }