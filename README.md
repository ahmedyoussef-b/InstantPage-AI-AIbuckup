# AGENTIC - Assistant IA Professionnel Elite 32 (AI Complete)

AGENTIC est un assistant intelligent de nouvelle génération conçu pour une exploitation technique et industrielle. Il repose sur une architecture **100% locale** et une **Boucle Cognitive Elite 32** intégrée dans un framework Next.js 15 haute performance.

## 🚀 Cycle de Vie d'un Document (Pipeline Elite 32)

Lorsqu'un utilisateur uploade un document, celui-ci traverse les phases suivantes :

### 1. PHASE D'INGESTION (Ingest Pipeline)
*   **Extraction & Nettoyage** : Le texte est extrait et normalisé (PDF, MD, JSON).
*   **Segmentation (Chunking)** : Le document est découpé en segments sémantiques de ~1000 caractères.
*   **Vectorisation Locale** : Chaque segment est transformé en vecteurs via `nomic-embed-text` (Ollama).
*   **Extraction de Graphe** : L'IA identifie les entités et relations clés (Sujet -> Relation -> Objet).
*   **Hiérarchisation (Innovation 32.1)** : Les concepts sont classés par niveau (Parent/Enfant) pour comprendre la structure technique.

### 2. PHASE DE RÉCUPÉRATION (HybridRAG Retrieval)
Lorsqu'une question est posée :
*   **Analyse d'Intention** : L'IA détermine s'il faut une réponse informative (RAG) ou une action (Agent).
*   **Recherche Multi-Strate** : Le système interroge simultanément :
    1.  La base vectorielle des **Documents** (Savoir froid).
    2.  La **Mémoire Épisodique** (Interactions passées).
    3.  Le **Graphe de Connaissances** (Relations conceptuelles).
*   **Pondération Dynamique** : Les sources sont scorées selon leur pertinence sémantique.

### 3. PHASE DE RAISONNEMENT (Metacognitive Reasoning)
*   **Assemblage Contextuel** : Les sources les plus fiables sont fusionnées dans un prompt structuré.
*   **Auto-Évaluation** : L'IA vérifie si le contexte est suffisant pour répondre sans halluciner.
*   **Génération Citée** : La réponse est générée avec des renvois précis aux sources [Source X].

### 4. PHASE D'APPRENTISSAGE (Continuous Learning)
*   **Vectorisation de l'Échange** : La réponse réussie devient elle-même une source de connaissance.
*   **Enrichissement Dynamique (Innovation 5.3)** : Les documents originaux sont annotés avec les questions et corrections des utilisateurs.
*   **Optimisation Nocturne** : Le modèle subit un micro-ajustement (Fine-tuning LoRA) basé sur les leçons du jour.

## 🗺️ Cartographie de la Structure

```text
📁 RACINE DU PROJET
├── 📁 data/                    # 🗄️ BASE VECTORIELLE & PERSISTANCE (Local)
│   ├── 📁 chromadb/            # Index vectoriel ChromaDB
│   ├── 📁 procedures/          # Guides techniques JSON
│   ├── 📁 images/              # Base de données Vision (MobileNet)
│   └── 📁 tts/                 # Modèles et cache vocal
├── 📁 src/
│   ├── 📁 ai/                  # 🧠 LE CERVEAU (Elite 32 Logic)
│   │   ├── 📁 agent/           # Orchestration Agentic & MCP
│   │   ├── 📁 rag/             # Intelligent Retriever & Context Assembler
│   │   ├── 📁 reasoning/       # CoT, Méta-cognition, Arbre Latent
│   │   ├── 📁 learning/        # Mémoire Épisodique & RL Implicite
│   │   └── 📁 training/        # Pipeline ML (LoRA, Fine-tuning local)
│   ├── 📁 app/                 # 📱 ROUTAGE & INTERFACE (Next.js 15)
│   └── 📁 components/          # 🧩 COMPOSANTS UI (Shadcn + Features)
```

---
*AGENTIC - Propulsé par l'innovation Elite AI. 100% Local. 100% Privé.*
