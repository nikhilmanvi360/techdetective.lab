import { supabase } from '../lib/supabase';
import { manualTrigger } from './adversary';
import type { Server as SocketIOServer } from 'socket.io';

export interface ShopItem {
 id: string;
 name: string;
 description: string;
 cost: number;
 icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
 {
 id: 'intel_draft',
 name: 'Intel_Draft',
 description: 'Expedite a tactical hint for the active puzzle without any score penalty.',
 cost: 40,
 icon: 'FileSearch'
 },
 {
 id: 'evidence_decrypter',
 name: 'Evidence_Decrypter',
 description: 'Instantly bypass the lock on any piece of evidence in the current case.',
 cost: 80,
 icon: 'Unlock'
 },
 {
 id: 'emp_jammer',
 name: 'EMP_Jammer',
 description: 'Trigger a localized EMP strike on a rival team\'s terminal (10s glitch).',
 cost: 150,
 icon: 'Radio'
 },
 {
 id: 'data_shield',
 name: 'Data_Shield',
 description: 'Protect your terminal from the next Adversary or Rival EMP attack.',
 cost: 300,
 icon: 'Shield'
 }
];

export async function processPurchase(
 io: SocketIOServer,
 teamId: number,
 itemId: string,
 metadata: any = {}
): Promise<{ success: boolean; message: string }> {
 const item = SHOP_ITEMS.find(i => i.id === itemId);
 if (!item) return { success: false, message: 'Item not found' };

  const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single();
  if (!team) return { success: false, message: 'Team not found' };

  // Call the atomic RPC
  const { data: rpcResult, error: rpcError } = await supabase.rpc('purchase_item_v2', {
    p_team_id: teamId,
    p_cost: item.cost,
    p_item_type: itemId, // Pass the string ID as item_type
    p_item_id: 0,        // Pass 0 for item_id since our IDs are strings
    p_case_id: 0
  });

  if (rpcError || !rpcResult?.success) {
     return { success: false, message: rpcResult?.error || 'Insufficient XP balance or transactional error' };
  }

  // 2. Process special item logic
  if (itemId === 'emp_jammer') {
    if (!metadata.targetTeamId) return { success: false, message: 'Target team required' };
    
    await manualTrigger(
      io, 
      metadata.targetTeamId, 
      'signal_interference', `⚡ EMP Strike initiated by team "${team.name}"!`
    );
  }

 // 4. Global broadcast for spectacle
 io.emit('live_event', {
 message: `💀 Black Market:"${team.name}" purchased ${item.name}!`,
 type: 'case',
 timestamp: new Date().toISOString()
 });

 return { success: true, message: `Successfully purchased ${item.name}` };
}

export async function getPurchasedEvidence(teamId: number, caseId: number): Promise<number[]> {
 const { data: events } = await supabase
 .from('score_events')
 .select('metadata')
 .eq('team_id', teamId)
 .eq('event_type', 'shop_purchase');

 if (!events) return [];

 return events
 .filter(e => e.metadata?.item_id === 'evidence_decrypter' && e.metadata?.case_id === caseId)
 .map(e => e.metadata?.evidence_id)
 .filter(Boolean);
}

export async function getPurchasedHints(teamId: number, caseId: number): Promise<number[]> {
 const { data: events } = await supabase
 .from('score_events')
 .select('metadata')
 .eq('team_id', teamId)
 .eq('event_type', 'shop_purchase');

 if (!events) return [];

 return events
 .filter(e => e.metadata?.item_id === 'intel_draft' && e.metadata?.case_id === caseId)
 .map(e => e.metadata?.puzzle_id)
 .filter(Boolean);
}

export async function hasActiveShield(teamId: number): Promise<boolean> {
 const { data: event } = await supabase
 .from('score_events')
 .select('id')
 .eq('team_id', teamId)
 .eq('event_type', 'shop_purchase')
 .eq('metadata->>item_id', 'data_shield')
 .eq('metadata->>consumed', 'false')
 .limit(1)
 .single();

 return !!event;
}

export async function consumeShield(teamId: number): Promise<void> {
 const { data: event } = await supabase
 .from('score_events')
 .select('id, metadata')
 .eq('team_id', teamId)
 .eq('event_type', 'shop_purchase')
 .eq('metadata->>item_id', 'data_shield')
 .eq('metadata->>consumed', 'false')
 .limit(1)
 .single();

 if (event) {
 const newMetadata = { ...event.metadata, consumed: true, consumed_at: new Date().toISOString() };
 await supabase
 .from('score_events')
 .update({ metadata: newMetadata })
 .eq('id', event.id);
 }
}
