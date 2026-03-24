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
├── 📁 data/                    # 🗄️ PERSISTANCE & CACHE (Local)
│   ├── 📁 procedures/          # Guides techniques JSON
│   ├── 📁 stt/                 # Modèles et cache Speech-to-Text
│   └── 📁 tts/                 # Modèles et cache vocal
├── 📁 models/                  # 🤖 MODÈLES IA LOCAUX (NER, etc.)
├── 📁 src/
│   ├── 📁 ai/                  # 🧠 LE CERVEAU (Elite 32 Logic)
│   │   ├── 📁 actions/         # (toolformer-local.ts, async-workflow.ts, predictive-engine.ts, etc.)
│   │   ├── 📁 agent/           # (agent-core.ts, task-planner.ts, task-executor.ts, agent-learner.ts)
│   │   ├── 📁 flows/           # (chat-flow.ts, ingest-document-flow.ts, agent-flow.ts)
│   │   ├── 📁 integration/     # (complete-loop.ts, self-improvement.ts, phase-vectors)
│   │   ├── 📁 learning/        # (episodic-memory.ts, implicit-rl.ts, meta-learning.ts)
│   │   ├── 📁 mcp/             # (service.ts)
│   │   ├── 📁 ml/              # (inference-engine.ts, model-trainer.ts, recommender.ts)
│   │   ├── 📁 orchestration/   # (agentic-loop.ts, multi-agent-system.ts)
│   │   ├── 📁 rag/             # (intelligent-retriever.ts, context-assembler.ts, local-llm.ts)
│   │   ├── 📁 reasoning/       # (dynamic-cot.ts, metacognition.ts, confidence-scorer.ts)
│   │   ├── 📁 training/        # (training-pipeline.ts, model-evaluator.ts, continuous-training.ts)
│   │   └── 📁 vector/          # (complete-schema.ts, dynamic-revectorization.ts, chroma-manager.ts [PLANNED])
│   ├── 📁 app/                 # 📱 ROUTAGE & PAGES (Next.js 15 App Router)
│   ├── 📁 components/          # 🧩 COMPOSANTS UI & FEATURE-BASED
│   ├── 📁 hooks/               # 🎣 HOOKS REACT PERSONNALISÉS
│   ├── 📁 lib/                 # 🛠️ UTILITAIRES & CONFIGURATION
│   └── 📁 types/               # 🏷️ DÉFINITIONS TYPESCRIPT GLOBAL
```

## 🧠 Architecture d'Intégration ChromaDB (Évolution)

### 1. Points d'Extension Nécessaires
Actuellement, AGENTIC utilise probablement un système vectoriel interne. Nous allons ajouter ChromaDB comme couche de persistance unifiée tout en conservant l'architecture existante.

### 2. Vue d'Ensemble de l'Intégration
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC - ELITE 32 CORE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   Chat Flow     │    │  Ingest Flow    │    │     Agent Flow          │ │
│  │ (chat-flow.ts) │───▶│(ingest-doc...) │───▶│  (agent-core.ts)        │ │
│  └────────┬────────┘    └────────┬────────┘    └───────────┬─────────────┘ │
│           │                      │                         │               │
│           ▼                      ▼                         ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ChromaDB Adapter Layer (NEW)                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ChromaDBManager.ts - Gestionnaire unifié                   │   │   │
│  │  │  • Collections Manager                                      │   │   │
│  │  │  • Metadata Schema Validator                                │   │   │
│  │  │  • Connection Pool                                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ChromaDB (Local)                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │   │
│  │  │   Documents  │ │   Episodic   │ │   Knowledge  │               │   │
│  │  │  Collection  │ │   Memory     │ │    Graph     │               │   │
│  │  │              │ │  Collection  │ │  Collection  │               │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Ollama (Local Embeddings)                               │   │
│  │  • nomic-embed-text (Document embeddings)                           │   │
│  │  • llm (Mistral/Llama pour raisonnement)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

---
*AGENTIC - Propulsé par l'innovation Elite AI. 100% Local. 100% Privé.*
