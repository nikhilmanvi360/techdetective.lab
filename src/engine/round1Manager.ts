import { io } from '../../server';

export type Round1SubPhase = 'MONOLOGUE' | 'ACTIVE' | 'SUMMARY';

interface Round1State {
  subPhase: Round1SubPhase;
  monologueData: any;
  startTime: number | null;
}

class Round1Manager {
  private state: Round1State = {
    subPhase: 'ACTIVE',
    monologueData: {
      intro: "Welcome to the Bureau Network.",
      objective: "Scan the environment. Secure the evidence.",
      warning: "The syndicate is watching."
    },
    startTime: null
  };

  getState() {
    return this.state;
  }

  transition(phase: Round1SubPhase) {
    this.state.subPhase = phase;
    if (phase === 'ACTIVE' && !this.state.startTime) {
      this.state.startTime = Date.now();
    }
    io.emit('r1_phase_update', { phase });
  }

  updateMonologue(data: any) {
    this.state.monologueData = { ...this.state.monologueData, ...data };
    io.emit('r1_monologue_update', this.state.monologueData);
  }
}

export const round1Manager = new Round1Manager();
