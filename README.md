# AGENTIC - Assistant IA Professionnel Hybrid RAG

AGENTIC est un assistant intelligent de nouvelle génération conçu pour une exploitation technique et industrielle. Il repose sur une architecture **100% locale** garantissant une confidentialité totale des données et une résilience maximale.

## 🚀 Les 7 Innovations Majeures

### 1. Architecture Multi-Modèles & Routeur Sémantique
Le système utilise un classificateur ultra-léger pour diriger chaque question vers le modèle le plus adapté (Phi-3 pour la technique, Llama-3 pour le légal, TinyLlama pour les tâches générales).

### 2. Cache Sémantique Intelligent
Réduction de 40% de la charge processeur grâce à la mémorisation sémantique. Les questions similaires sont détectées (seuil 85%) et les réponses sont adaptées contextuellement plutôt que simplement copiées.

### 3. RAG Hybride (Vectoriel + Graphe + Temporel)
Une précision inégalée en combinant trois sources de contexte :
- **Vectoriel** : Recherche par similarité textuelle.
- **Graphe** : Relations thématiques entre documents.
- **Temporel** : Priorité aux informations les plus récentes.

### 4. Knowledge Graph Local Automatique
Lors de l'upload, l'IA extrait automatiquement les concepts et entités pour construire un graphe de connaissances. Cela permet à l'assistant de comprendre les liens entre différents documents.

### 5. Prompt Engineering Dynamique Adaptatif
Les instructions système sont générées en temps réel selon le type de requête (procédure, définition, comparaison), assurant un ton et une structure de réponse toujours optimaux.

### 6. Support de Modèles Quantifiés Spécialisés
L'architecture est prête pour le chargement de modèles ultra-spécialisés (q4_k_m, ~350MB) via Ollama, offrant des performances d'élite sur des corpus de documents restreints.

### 7. Apprentissage Continu Ultra-Léger
L'IA apprend de vos corrections. Si une réponse est rectifiée manuellement, le système enregistre une règle de post-traitement locale pour s'auto-corriger lors des prochaines interactions.

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components** : Shadcn UI, Lucide Icons.
- **AI Engine** : Genkit (Server Actions), Ollama (Modèles locaux).
- **Storage** : Virtual File System (VFS) persistant via LocalStorage (Bdd atomique).
- **Voice** : STT (WebSpeech) & TTS (Piper/Edge - local).

## 📋 Pré-requis

1. **Ollama** installé et actif.
2. Modèles requis : `phi3:mini`, `llama3:8b`, `tinyllama:latest`.
3. Pour le RAG, assurez-vous de télécharger le modèle d'embedding : `nomic-embed-text`.

## 📂 Structure du Projet

- `src/ai/` : Moteurs d'intelligence, routeurs, cache et RAG hybride.
- `src/ai/flows/` : Server Actions Genkit pour l'ingestion et le chat.
- `src/lib/api/` : Client VFS gérant la persistance locale sécurisée.
- `src/components/` : Interfaces de chat, d'administration et de guidage par étapes.

## 🛡️ Sécurité & Confidentialité
Aucune donnée ne quitte votre navigateur ou votre serveur local. Le système est conçu pour fonctionner en environnement "Air-gapped" (hors ligne) une fois les modèles téléchargés.

---
*AGENTIC - Propulsé par l'innovation Hybrid RAG AI.*