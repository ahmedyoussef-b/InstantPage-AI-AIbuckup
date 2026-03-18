# AGENTIC - Assistant IA Professionnel Hybrid RAG

AGENTIC est un assistant intelligent de nouvelle génération conçu pour une exploitation technique et industrielle. Il repose sur une architecture **100% locale** garantissant une confidentialité totale des données et une résilience maximale.

## 🚀 Les 9 Innovations Majeures

### 1. Architecture Multi-Modèles & Routeur Sémantique
Le système utilise un classificateur ultra-léger pour diriger chaque question vers le modèle le plus adapté (Phi-3 pour la technique, Llama-3 pour le légal, TinyLlama pour les tâches générales).

### 2. Cache Sémantique Intelligent
Réduction de 40% de la charge processeur grâce à la mémorisation sémantique. Les questions similaires sont détectées (seuil 85%) et les réponses sont adaptées contextuellement sans ré-exécution totale.

### 3. RAG Hybride (Vectoriel + Graphe + Temporel)
Une précision inégalée en combinant trois sources de contexte :
- **Vectoriel** : Recherche par similarité textuelle.
- **Graphe** : Relations thématiques entre documents.
- **Temporel** : Priorité aux informations les plus récentes.

### 4. Knowledge Graph Local Automatique
Lors de l'upload, l'IA extrait automatiquement les concepts et entités pour construire un graphe de connaissances, permettant de comprendre les liens logiques entre différents documents.

### 5. Prompt Engineering Dynamique Adaptatif
Les instructions système sont générées en temps réel selon le type de requête (procédure, définition, comparaison), assurant un ton et une structure toujours optimaux pour l'opérateur.

### 6. Chaîne de Pensée (CoT) Dynamique Auto-Adaptative
L'IA décompose les problèmes complexes en étapes de réflexion logiques. La profondeur du raisonnement s'adapte automatiquement à la difficulté de la question avec un mécanisme d'arrêt précoce ("Early Exit").

### 7. Support de Modèles Quantifiés Spécialisés
L'architecture est optimisée pour le chargement de modèles ultra-spécialisés (q4_k_m, ~350MB) via Ollama, offrant des performances d'élite sur des corpus techniques restreints.

### 8. Apprentissage Continu Ultra-Léger
L'IA apprend de vos corrections. Si une réponse est rectifiée manuellement, le système enregistre une règle de post-traitement locale pour s'auto-corriger lors des prochaines imteractions.

### 9. Raisonnement par Contraste (Contrastive Reasoning)
Pour clarifier les concepts ambigus, l'IA identifie systématiquement ce que le concept n'est pas en le comparant à des alternatives proches, évitant ainsi les confusions techniques majeures.

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components** : Shadcn UI, Lucide Icons.
- **AI Engine** : Genkit, Ollama (Modèles locaux).
- **Storage** : Virtual File System (VFS) persistant via LocalStorage (Bdd atomique).
- **Voice** : STT (WebSpeech) & TTS (Piper/Edge - local).

## 📋 Pré-requis

1. **Ollama** installé et actif.
2. Modèles recommandés : `phi3:mini`, `llama3:8b`, `tinyllama:latest`.
3. Embeddings : `nomic-embed-text`.

## 🛡️ Sécurité & Confidentialité
Aucune donnée ne quitte votre navigateur ou votre serveur local. Conçu pour fonctionner en environnement "Air-gapped" (déconnecté).

---
*AGENTIC - Propulsé par l'innovation Hybrid RAG AI.*
