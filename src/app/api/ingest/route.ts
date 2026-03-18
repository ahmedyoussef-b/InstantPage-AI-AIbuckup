// src/app/api/ingest/route.ts - Version améliorée
import { NextRequest } from 'next/server';
import { DocumentProcessor } from '@/ai/ingest/document-processor';
import { VectorStore } from '@/ai/vector/vector-store';
import { LearningSystem } from '@/ai/learning/learning-system';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;
  
  // PHASE 1: Traitement du document
  const processor = new DocumentProcessor();
  const documents = await processor.process(file);
  
  // PHASE 2: Génération des embeddings
  const vectorStore = new VectorStore();
  const embeddings = await vectorStore.generateEmbeddings(documents);
  
  // PHASE 3: Stockage vectoriel multi-collections
  await vectorStore.store({
    collection: 'documents',
    vectors: embeddings,
    metadata: {
      filename: file.name,
      userId,
      timestamp: Date.now(),
      type: file.type,
      size: file.size
    }
  });
  
  // PHASE 4: Extraction de connaissances pour apprentissage
  const learningSystem = new LearningSystem();
  const concepts = await learningSystem.extractConcepts(documents);
  
  await vectorStore.store({
    collection: 'concepts',
    vectors: concepts.map(c => c.embedding),
    metadata: concepts.map(c => ({
      ...c,
      sourceDocument: file.name,
      userId
    }))
  });
  
  // PHASE 5: Mise à jour du profil utilisateur
  await learningSystem.updateUserProfile(userId, {
    documentTypes: [file.type],
    topics: concepts.map(c => c.topic),
    lastUpload: Date.now()
  });
  
  return Response.json({
    success: true,
    documentId: documents.id,
    pages: documents.pages,
    concepts: concepts.length,
    suggestions: await generateInitialSuggestions(documents)
  });
}