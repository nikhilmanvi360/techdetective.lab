import { io } from '../../server';

export type Round3SubPhase = 'MONOLOGUE' | 'BRIEFING' | 'CHALLENGE' | 'NEURAL_LINK' | 'REVEAL' | 'DEBRIEF';

interface Round3State {
  currentSubPhase: Round3SubPhase;
  startTime: number | null;
  monologueData: {
    eventName: string;
    round1Action: string;
    round2Action: string;
    suspectAnswer: string;
    timestamp: string;
    rank: string;
    points: number;
    redHerring: string;
    twistReveal: string;
    realQuestion: string;
    duration: number;
    aiName: string;
  } | null;
  phaseBSubmissions: Map<number, any>; // teamId -> submission
  phaseCMitigations: Map<number, boolean>; // teamId -> success
  globalMitigationPoints: number;
  suspectVotes: Record<string, number>;
  neuralLink: {
    masterKey: string;
    currentKey: string[];
    assignments: Record<number, { segment: string; index: number }>; // teamId -> {chars, startPos}
  };
}

let state: Round3State = {
  currentSubPhase: 'MONOLOGUE',
  startTime: null,
  monologueData: null,
  phaseBSubmissions: new Map(),
  phaseCMitigations: new Map(),
  globalMitigationPoints: 0,
  suspectVotes: {},
  neuralLink: {
    masterKey: "AF88B2C4D9E1F0A3B5C7D9E0F2A4B6C8", // 32 chars
    currentKey: Array(32).fill('_'),
    assignments: {}
  }
};

export class Round3Manager {
  static getState() {
    return state;
  }

  static transition(nextSubPhase: Round3SubPhase) {
    state.currentSubPhase = nextSubPhase;
    if (nextSubPhase === 'MONOLOGUE') {
      state.startTime = Date.now();
    }
    io.emit('r3_sub_phase_update', { subPhase: nextSubPhase });
  }

  static setMonologueData(data: any) {
    state.monologueData = data;
    io.emit('r3_monologue_data_update', data);
  }

  static submitPhaseB(teamId: number, data: any) {
    state.phaseBSubmissions.set(teamId, data);
    
    // Track votes for majority branching
    const suspect = data.culprit?.toUpperCase() || 'UNKNOWN';
    state.suspectVotes[suspect] = (state.suspectVotes[suspect] || 0) + 1;
    
    io.emit('r3_global_vote_update', { suspectVotes: state.suspectVotes });
    return { success: true };
  }

  static submitPhaseC(teamId: number, success: boolean) {
    state.phaseCMitigations.set(teamId, success);
    if (success) {
      state.globalMitigationPoints += 10; // Each success adds to global pool
      io.emit('r3_global_mitigation_update', { points: state.globalMitigationPoints });
    }
    return { success: true };
  }

  static getMajoritySuspect(correctSuspect: string) {
    let maxVotes = 0;
    let majoritySuspect = 'NONE';
    
    for (const [suspect, votes] of Object.entries(state.suspectVotes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        majoritySuspect = suspect;
      }
    }
    
    return {
      suspect: majoritySuspect,
      isCorrect: majoritySuspect === correctSuspect.toUpperCase(),
      voteCount: maxVotes,
      totalVotes: Array.from(state.phaseBSubmissions.values()).length
    };
  }

  static assignNeuralFragment(teamId: number, index: number) {
    if (!state.neuralLink.assignments[teamId]) {
        const segment = state.neuralLink.masterKey.substring(index, index + 2);
        state.neuralLink.assignments[teamId] = { segment, index };
    }
    return state.neuralLink.assignments[teamId];
  }

  static submitNeuralSegment(teamId: number, segment: string) {
    const assignment = state.neuralLink.assignments[teamId];
    if (!assignment) return { success: false, message: "No assignment found." };

    if (assignment.segment === segment.toUpperCase()) {
        // Success: Fill the slots
        const updated = [...state.neuralLink.currentKey];
        updated[assignment.index] = segment[0].toUpperCase();
        updated[assignment.index + 1] = segment[1].toUpperCase();
        state.neuralLink.currentKey = updated;
        
        io.emit('r3_neural_update', { currentKey: state.neuralLink.currentKey, teamId });
        return { success: true };
    } else {
        // ERROR: RESET THE ENTIRE KEY
        state.neuralLink.currentKey = Array(32).fill('_');
        io.emit('r3_neural_reset', { teamId, message: "CRITICAL COLLISION: SYSTEM RESET" });
        return { success: false, message: "Incorrect segment. System reset." };
    }
  }

  static reset() {
    state = {
      currentSubPhase: 'MONOLOGUE',
      startTime: null,
      monologueData: null,
      phaseBSubmissions: new Map(),
      phaseCMitigations: new Map(),
      globalMitigationPoints: 0,
      suspectVotes: {},
      neuralLink: {
        masterKey: "AF88B2C4D9E1F0A3B5C7D9E0F2A4B6C8",
        currentKey: Array(32).fill('_'),
        assignments: {}
      }
    };
  }
}
