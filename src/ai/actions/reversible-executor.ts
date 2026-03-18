'use server';
/**
 * @fileOverview ReversibleExecutor - Innovation 19.
 * Permet l'annulation et le rétablissement des actions de l'IA avec gestion de snapshots.
 */

export interface ActionRecord {
  id: string;
  type: string;
  params: any;
  snapshotId: string;
  timestamp: number;
  status: 'executed' | 'undone' | 'failed';
}

// Stockage temporaire en mémoire (Simulation pour le prototype local)
// Dans une version de production, cela serait lié au VFS ou à une DB.
const actionHistory: ActionRecord[] = [];
const snapshots: Map<string, string> = new Map();

/**
 * Enregistre une action et crée un snapshot du contexte.
 */
export async function recordAction(type: string, params: any, context: string): Promise<string> {
  const actionId = `act-${Math.random().toString(36).substring(7)}`;
  const snapshotId = `snap-${Date.now()}`;
  
  // Capturer l'état actuel
  snapshots.set(snapshotId, context);
  
  const record: ActionRecord = {
    id: actionId,
    type,
    params,
    snapshotId,
    timestamp: Date.now(),
    status: 'executed'
  };
  
  actionHistory.push(record);
  console.log(`[AI][REVERSIBLE] Action enregistrée: ${type} (${actionId})`);
  
  return actionId;
}

/**
 * Annule la dernière action réversible.
 */
export async function undoLastAction(): Promise<{ success: boolean; restoredContext?: string; message: string }> {
  const lastAction = actionHistory.findLast(a => a.status === 'executed');
  
  if (!lastAction) {
    return { success: false, message: "Aucune action à annuler dans l'historique." };
  }
  
  const snapshot = snapshots.get(lastAction.snapshotId);
  if (!snapshot) {
    return { success: false, message: "Snapshot introuvable pour cette action." };
  }
  
  lastAction.status = 'undone';
  console.log(`[AI][REVERSIBLE] Annulation de l'action: ${lastAction.id}`);
  
  return { 
    success: true, 
    restoredContext: snapshot, 
    message: `L'action "${lastAction.type}" a été annulée avec succès.` 
  };
}

/**
 * Génère une visualisation textuelle de l'historique pour l'utilisateur.
 */
export async function getActionHistoryReport(): Promise<string> {
  if (actionHistory.length === 0) return "Aucune action effectuée dans cette session.";
  
  let report = "### 📜 Historique des Actions (Innovation 19)\n\n";
  
  actionHistory.forEach((act, i) => {
    const statusIcon = act.status === 'executed' ? '✅' : '↩️';
    const time = new Date(act.timestamp).toLocaleTimeString('fr-FR');
    report += `${i + 1}. ${statusIcon} **${act.type}** - ${time} [${act.id}]\n`;
    if (act.status === 'undone') report += `   *(Annulé)*\n`;
  });
  
  return report;
}
