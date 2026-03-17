import { config } from 'dotenv';
config();

import '@/ai/flows/generate-homepage-content-draft.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/ingest-document-flow.ts';
import '@/ai/flows/delete-document-flow.ts';
import '@/ai/flows/procedure-help-flow.ts';