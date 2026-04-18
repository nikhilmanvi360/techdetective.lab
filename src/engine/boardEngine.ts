import { supabase } from '../lib/supabase';

export interface BoardNode {
  id: number;
  case_id: number;
  team_id: number;
  type: 'suspect' | 'clue' | 'timeline';
  content: {
    label: string;
    description?: string;
    color?: string;
    icon?: string;
    timestamp?: string;
  };
  x: number;
  y: number;
}

export interface BoardLink {
  id: number;
  source_node_id: number;
  target_node_id: number;
}

export async function getBoardState(teamId: number, caseId: number) {
  const { data: nodes } = await supabase
    .from('investigation_nodes')
    .select('*')
    .eq('team_id', teamId)
    .eq('case_id', caseId);

  const { data: links } = await supabase
    .from('investigation_links')
    .select('*')
    .eq('team_id', teamId);

  return { nodes: nodes || [], links: links || [] };
}

export async function addNode(teamId: number, caseId: number, type: string, content: any, x: number, y: number) {
  const { data, error } = await supabase
    .from('investigation_nodes')
    .insert([{
      team_id: teamId,
      case_id: caseId,
      type,
      content,
      x,
      y
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNodePosition(teamId: number, nodeId: number, x: number, y: number) {
  const { error } = await supabase
    .from('investigation_nodes')
    .update({ x, y })
    .eq('id', nodeId)
    .eq('team_id', teamId);

  if (error) throw error;
}

export async function deleteNode(teamId: number, nodeId: number) {
  const { error } = await supabase
    .from('investigation_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('team_id', teamId);

  if (error) throw error;
}

export async function createLink(teamId: number, sourceId: number, targetId: number) {
  const { data, error } = await supabase
    .from('investigation_links')
    .insert([{
      team_id: teamId,
      source_node_id: sourceId,
      target_node_id: targetId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLink(teamId: number, linkId: number) {
  const { error } = await supabase
    .from('investigation_links')
    .delete()
    .eq('id', linkId)
    .eq('team_id', teamId);

  if (error) throw error;
}
