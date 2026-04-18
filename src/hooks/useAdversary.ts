/**
 * useAdversary — Client-side hook for the Adversary AI NPC system
 * 
 * Listens for adversary events via Socket.IO and manages:
 * - Visual glitch overlays (signal interference)
 * - Guidance hint banners
 * - Active adversary actions state
 */

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface AdversaryEvent {
  target_team_id: number;
  target_team_name: string;
  action_type: 'signal_interference' | 'evidence_encrypt' | 'puzzle_scramble' | 'guidance_hint';
  metadata: Record<string, any>;
  timestamp: string;
}

interface AdversaryState {
  isGlitching: boolean;
  glitchMessage: string | null;
  guidanceHint: string | null;
  activeActions: any[];
}

export function useAdversary() {
  const [state, setState] = useState<AdversaryState>({
    isGlitching: false,
    glitchMessage: null,
    guidanceHint: null,
    activeActions: [],
  });

  // Get current team ID from localStorage
  const getTeamId = useCallback((): number | null => {
    try {
      const team = localStorage.getItem('team');
      if (team) return JSON.parse(team).id;
    } catch {}
    return null;
  }, []);

  // Fetch active adversary actions on mount
  const fetchActions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/team/adversary-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const actions = await res.json();
        setState(prev => ({ ...prev, activeActions: actions }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchActions();

    const socket: Socket = io();
    const teamId = getTeamId();

    socket.on('adversary_action', (event: AdversaryEvent) => {
      // Only react if this action targets our team
      if (teamId && event.target_team_id === teamId) {
        if (event.action_type === 'signal_interference') {
          // Trigger visual glitch effect
          setState(prev => ({
            ...prev,
            isGlitching: true,
            glitchMessage: event.metadata.message || '⚡ SIGNAL INTERFERENCE DETECTED',
          }));

          // Auto-clear after duration
          const duration = event.metadata.duration_ms || 5000;
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              isGlitching: false,
              glitchMessage: null,
            }));
          }, duration);
        } else if (event.action_type === 'guidance_hint') {
          // Show guidance hint
          setState(prev => ({
            ...prev,
            guidanceHint: event.metadata.message || '💡 The Adversary offers guidance...',
          }));

          // Auto-clear after 15 seconds
          setTimeout(() => {
            setState(prev => ({ ...prev, guidanceHint: null }));
          }, 15000);
        } else {
          // Evidence encrypt, puzzle scramble, etc. — refresh actions
          fetchActions();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [getTeamId, fetchActions]);

  const dismissGuidance = useCallback(() => {
    setState(prev => ({ ...prev, guidanceHint: null }));
  }, []);

  const resolveAction = useCallback(async (actionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/team/resolve-action/${actionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchActions();
      }
      return await res.json();
    } catch {
      return { success: false };
    }
  }, [fetchActions]);

  return {
    ...state,
    dismissGuidance,
    resolveAction,
    refreshActions: fetchActions,
  };
}
