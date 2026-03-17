// app/api/procedure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProcedureHelp } from '@/ai/flows/procedure-help-flow';

// Stockage session (en production: Redis/Firestore)
// On garde une map simple pour la démo, mais Firestore serait idéal pour AHMED
const sessions = new Map();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, sessionId, problem } = body;
  
  // Charger la procédure
  const procedurePath = path.join(process.cwd(), 'data/procedures/demarrage-chaudiere.json');
  let procedureData;
  try {
    procedureData = await fs.readFile(procedurePath, 'utf-8');
  } catch (e) {
    return NextResponse.json({ error: 'Fichier de procédure introuvable' }, { status: 404 });
  }
  
  const procedure = JSON.parse(procedureData);
  
  switch(action) {
    case 'start':
      const newSessionId = Date.now().toString();
      const newSession = {
        id: newSessionId,
        procedureId: procedure.procedure.id,
        currentStep: 1,
        startedAt: new Date().toISOString(),
        completedSteps: []
      };
      sessions.set(newSessionId, newSession);
      
      return NextResponse.json({
        sessionId: newSessionId,
        currentStep: procedure.steps[0],
        progress: {
          current: 1,
          total: procedure.procedure.totalSteps,
          percent: Math.round(1 / procedure.procedure.totalSteps * 100)
        }
      });
      
    case 'next':
      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session invalide' }, { status: 404 });
      }
      
      session.completedSteps.push({
        step: session.currentStep,
        completedAt: new Date().toISOString()
      });
      
      session.currentStep++;
      
      if (session.currentStep > procedure.procedure.totalSteps) {
        sessions.delete(sessionId);
        return NextResponse.json({
          completed: true,
          summary: {
            stepsCompleted: session.completedSteps.length
          }
        });
      }
      
      const nextStepData = procedure.steps[session.currentStep - 1];
      
      return NextResponse.json({
        sessionId,
        currentStep: nextStepData,
        progress: {
          current: session.currentStep,
          total: procedure.procedure.totalSteps,
          percent: Math.round(session.currentStep / procedure.procedure.totalSteps * 100)
        }
      });
      
    case 'help':
      const currentSession = sessions.get(sessionId);
      if (!currentSession) return NextResponse.json({ error: 'Session invalide' }, { status: 404 });
      
      const step = procedure.steps[currentSession.currentStep - 1];
      
      // Appel au flux Genkit pour AHMED
      const helpResult = await getProcedureHelp({
        userName: 'AHMED',
        stepTitle: step.title,
        instruction: step.instruction,
        problem: problem,
        expectedValue: step.expectedValue
      });
      
      return NextResponse.json({
        help: helpResult.advice,
        step: step
      });
      
    case 'abort':
      sessions.delete(sessionId);
      return NextResponse.json({ aborted: true });
      
    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  }
}