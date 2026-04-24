import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CampaignAction, CampaignState, normalizeCampaignState } from './campaignStore';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSessionReturn {
  sessionCode: string | null;
  isHost: boolean;
  partnerConnected: boolean;
  createSession: () => string;
  joinSession: (code: string) => Promise<boolean>;
  broadcastAction: (action: CampaignAction) => void;
  leaveSession: () => void;
}

export function useSession(
  localState: CampaignState,
  dispatchLocal: (action: CampaignAction) => void
): UseSessionReturn {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(localState);

  useEffect(() => {
    latestStateRef.current = localState;
  }, [localState]);

  // Leave session cleanup
  const leaveSession = useCallback(() => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSessionCode(null);
    setIsHost(false);
    setPartnerConnected(false);
    dispatchLocal({ type: 'SET_P2_POS', pos: null });
  }, [dispatchLocal]);

  // Handle incoming state sync from host (for late joiners)
  const handleStateSync = useCallback((payload: any) => {
    if (!isHost && payload?.state) {
      console.log('Received full state sync from host');
      dispatchLocal({ type: 'INITIALIZE_STATE', state: normalizeCampaignState({ ...payload.state, p2Pos: null }) });
    }
  }, [isHost, dispatchLocal]);

  // Join or Create logic
  const setupChannel = useCallback(async (code: string, host: boolean) => {
    leaveSession();

    const channel = supabase.channel(`session:${code}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: host ? 'host' : 'client' }
      }
    });

    // ALL listeners MUST be defined BEFORE .subscribe()
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const hostPresent = state['host']?.length > 0;
        const clientPresent = state['client']?.length > 0;
        setPartnerConnected(host ? clientPresent : hostPresent);
        
        // Sync P2 position from presence
        const partnerKey = host ? 'client' : 'host';
        if (state[partnerKey] && state[partnerKey][0]) {
          const p2Data = state[partnerKey][0] as any;
          if (p2Data.pos) {
            dispatchLocal({ type: 'SET_P2_POS', pos: p2Data.pos });
          }
        } else {
          dispatchLocal({ type: 'SET_P2_POS', pos: null });
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (host && key === 'client' && latestStateRef.current) {
          // Send full state to the new client
          channel.send({
            type: 'broadcast',
            event: 'SYNC_STATE',
            payload: { state: latestStateRef.current }
          });
        }
      })
      .on('broadcast', { event: 'ACTION' }, (payload) => {
        const action = payload.payload as CampaignAction;
        dispatchLocal(action);
      });
    channel.on('broadcast', { event: 'SYNC_STATE' }, handleStateSync);

    channelRef.current = channel;
    setSessionCode(code);
    setIsHost(host);

    return await new Promise<boolean>((resolve) => {
      let resolved = false;
      const finish = (ok: boolean) => {
        if (resolved) return;
        resolved = true;
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        resolve(ok);
      };

      joinTimeoutRef.current = setTimeout(() => {
        leaveSession();
        finish(false);
      }, 5000);

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ pos: latestStateRef.current.playerPos });
          finish(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          leaveSession();
          finish(false);
        }
      });
    });
  }, [leaveSession, dispatchLocal, handleStateSync]);

  const createSession = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    void setupChannel(code, true);
    return code;
  }, [setupChannel]);

  const joinSession = useCallback(async (code: string) => {
    const sanitized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(sanitized)) {
      return false;
    }
    return setupChannel(sanitized, false);
  }, [setupChannel]);

  const broadcastAction = useCallback((action: CampaignAction) => {
    if (channelRef.current && sessionCode && partnerConnected) {
      // Use broadcast only if channel is ready, otherwise Supabase warns
      channelRef.current.send({
        type: 'broadcast',
        event: 'ACTION',
        payload: action
      });
    }
  }, [sessionCode, partnerConnected]);

  // Sync our position to presence when we move
  useEffect(() => {
    if (channelRef.current && partnerConnected) {
      channelRef.current.track({ pos: localState.playerPos });
    }
  }, [localState.playerPos, partnerConnected]);

  return {
    sessionCode,
    isHost,
    partnerConnected,
    createSession,
    joinSession,
    broadcastAction,
    leaveSession
  };
}
