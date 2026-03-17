import { NextRequest, NextResponse } from 'next/server';
import ttsService from '@/lib/services/ttsService';
import { cleanTextForTTS } from '@/lib/utils/textCleaner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { text, provider, voice, language, speed, cache } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Texte requis' },
        { status: 400 }
      );
    }

    // Nettoyage systématique du texte avant synthèse pour éviter de lire le Markdown
    const cleanText = cleanTextForTTS(text);

    const result = await ttsService.synthesize({
      text: cleanText,
      provider,
      voice,
      language,
      speed,
      cache
    });

    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Erreur synthèse API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synthèse vocale' },
      { status: 500 }
    );
  }
}
