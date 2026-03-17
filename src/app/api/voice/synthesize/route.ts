// app/api/voice/synthesize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ttsService from '@/lib/services/ttsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, provider, voice, language, speed, cache } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      );
    }

    const result = await ttsService.synthesize({
      text,
      provider,
      voice,
      language,
      speed,
      cache
    });

    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Erreur synthèse API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synthèse vocale' },
      { status: 500 }
    );
  }
}
