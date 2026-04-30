import { io } from '../../server';

export type Round3SubPhase = 'CHALLENGE' | 'DEBRIEF';

interface Round3State {
  currentSubPhase: Round3SubPhase;
  startTime: number | null;
  phaseBSubmissions: Map<number, any>; // teamId -> submission
  phaseCMitigations: Map<number, boolean>; // teamId -> success
}

let state: Round3State = {
  currentSubPhase: 'CHALLENGE',
  startTime: Date.now(),
  phaseBSubmissions: new Map(),
  phaseCMitigations: new Map(),
};

export class Round3Manager {
  static getState() {
    return state;
  }

  static getClientState(teamId: number) {
    return {
      subPhase: state.currentSubPhase,
      startTime: state.startTime,
      mySubmission: state.phaseBSubmissions.get(teamId),
      myMitigation: state.phaseCMitigations.get(teamId),
    };
  }

  static transition(nextSubPhase: Round3SubPhase) {
    state.currentSubPhase = nextSubPhase;
    io.emit('r3_sub_phase_update', { subPhase: nextSubPhase });
    Round3Manager.saveState();
  }

  static submitPhaseB(teamId: number, data: any) {
    state.phaseBSubmissions.set(teamId, data);
    Round3Manager.saveState();
    return { success: true };
  }

  static submitPhaseC(teamId: number, success: boolean) {
    state.phaseCMitigations.set(teamId, success);
    Round3Manager.saveState();
    return { success: true };
  }

  static reset() {
    state = {
      currentSubPhase: 'CHALLENGE',
      startTime: Date.now(),
      phaseBSubmissions: new Map(),
      phaseCMitigations: new Map(),
    };
    Round3Manager.saveState();
  }

  static async saveState() {
    try {
      const { supabase } = await import('../lib/supabase');
      const dataToSave = {
        currentSubPhase: state.currentSubPhase,
        startTime: state.startTime,
        phaseBSubmissions: Array.from(state.phaseBSubmissions.entries()),
        phaseCMitigations: Array.from(state.phaseCMitigations.entries()),
      };
      
      await supabase.from('adversary_actions').upsert({
        id: 9999,
        target_team_id: 1, 
        action_type: 'round3_state_v2',
        metadata: dataToSave
      });
    } catch (e) {
      console.error('Failed to save Round3 state', e);
    }
  }

  static async loadState() {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.from('adversary_actions').select('metadata').eq('id', 9999).single();
      if (data && data.metadata) {
        const d = data.metadata as any;
        state = {
          currentSubPhase: d.currentSubPhase || 'CHALLENGE',
          startTime: d.startTime || Date.now(),
          phaseBSubmissions: new Map(d.phaseBSubmissions || []),
          phaseCMitigations: new Map(d.phaseCMitigations || []),
        };
      }
    } catch (e) {
      console.error('Failed to load Round3 state', e);
    }
  }
}

