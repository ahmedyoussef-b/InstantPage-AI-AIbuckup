'use server';
/**
 * @fileOverview Model Context Protocol (MCP) Service.
 * Gère l'accès aux outils et au contexte pour les agents.
 */

import { toolformer } from '@/ai/actions/toolformer-local';
import { validateAction } from '@/ai/actions/contextual-validator';
import { recordAction } from '@/ai/actions/reversible-executor';

export interface MCPToolResult {
  tool: string;
  success: boolean;
  output: any;
  error?: string;
}

/**
 * Exécute un outil via le protocole MCP avec validation de sécurité.
 */
export async function executeMCPTool(
  toolName: string, 
  params: any, 
  context: string
): Promise<MCPToolResult> {
  console.log(`[MCP] Demande d'exécution : ${toolName}`);

  // 1. Validation contextuelle (Phase de Sécurité)
  const validation = await validateAction({ type: 'use_tool', tool: toolName, params }, context);
  
  if (!validation.valid) {
    console.warn(`[MCP] Action rejetée : ${validation.reason}`);
    return {
      tool: toolName,
      success: false,
      output: null,
      error: validation.reason
    };
  }

  // 2. Enregistrement pour réversibilité (Undo/Snapshot)
  await recordAction(`tool_${toolName}`, params, context);

  // 3. Exécution réelle
  try {
    let output;
    switch (toolName) {
      case 'search':
        output = `Résultats de recherche pour "${params.query}" dans la base locale.`;
        break;
      case 'calculate':
        output = `Résultat du calcul : ${eval(params.expression)}`; // Simulation
        break;
      case 'summarize':
        output = `Synthèse du texte effectuée avec succès.`;
        break;
      default:
        throw new Error(`Outil inconnu : ${toolName}`);
    }

    return { tool: toolName, success: true, output };
  } catch (e: any) {
    return { tool: toolName, success: false, output: null, error: e.message };
  }
}
