import { io } from '../../server';

export type Round0Task = 'HTML' | 'CSS' | 'PYTHON';

interface Round0State {
  tasks: Record<number, { // teamId
    HTML: boolean;
    CSS: boolean;
    PYTHON: boolean;
    startTime: number;
    completedAt: number | null;
  }>;
}

class Round0Manager {
  private state: Round0State = {
    tasks: {}
  };

  getTeamState(teamId: number) {
    if (!this.state.tasks[teamId]) {
      this.state.tasks[teamId] = {
        HTML: false,
        CSS: false,
        PYTHON: false,
        startTime: Date.now(),
        completedAt: null
      };
    }
    return this.state.tasks[teamId];
  }

  completeTask(teamId: number, task: Round0Task) {
    const tState = this.getTeamState(teamId);
    tState[task] = true;

    // Broadcast update to the team
    io.emit(`team_${teamId}_r0_task_update`, { state: tState });

    if (tState.HTML && tState.CSS && tState.PYTHON && !tState.completedAt) {
      tState.completedAt = Date.now();
      io.emit(`team_${teamId}_r0_complete`, { success: true });
    }

    return tState;
  }

  bypass(teamId: number) {
    const tState = this.getTeamState(teamId);
    tState.HTML = true;
    tState.CSS = true;
    tState.PYTHON = true;
    tState.completedAt = Date.now();
    io.emit(`team_${teamId}_r0_complete`, { success: true });
    return tState;
  }
}

export const round0Manager = new Round0Manager();
