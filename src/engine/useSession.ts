import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CampaignAction, CampaignState } from './campaignStore';
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

  // Leave session cleanup
  const leaveSession = useCallback(() => {
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
    if (!isHost) {
      console.log('Received full state sync from host');
      dispatchLocal({ type: 'INITIALIZE_STATE', state: payload.state });
    }
  }, [isHost, dispatchLocal]);

  // Join or Create logic
  const setupChannel = useCallback((code: string, host: boolean) => {
    leaveSession();
    
    const channel = supabase.channel(`session:${code}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: host ? 'host' : 'client' }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const hostPresent = state['host']?.length > 0;
        const clientPresent = state['client']?.length > 0;
        setPartnerConnected(host ? clientPresent : hostPresent);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (host && key === 'client') {
          // Send full state to the new client
          channel.send({
            type: 'broadcast',
            event: 'SYNC_STATE',
            payload: { state: localState }
          });
        }
      })
      .on('broadcast', { event: 'ACTION' }, (payload) => {
        const action = payload.payload as CampaignAction;
        // Don't re-broadcast what we just received
        dispatchLocal(action);
      })
      .on('broadcast', { event: 'SYNC_STATE' }, handleStateSync)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            pos: localState.playerPos
          });
        }
      });

    channelRef.current = channel;
    setSessionCode(code);
    setIsHost(host);
  }, [leaveSession, localState, dispatchLocal, handleStateSync]);

  const createSession = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setupChannel(code, true);
    return code;
  }, [setupChannel]);

  const joinSession = useCallback(async (code: string) => {
    setupChannel(code.toUpperCase(), false);
    return true;
  }, [setupChannel]);

  const broadcastAction = useCallback((action: CampaignAction) => {
    if (channelRef.current && sessionCode) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ACTION',
        payload: action
      });
    }
  }, [sessionCode]);

  // Sync our position to presence when we move
  useEffect(() => {
    if (channelRef.current && partnerConnected) {
      channelRef.current.track({ pos: localState.playerPos });
    }
  }, [localState.playerPos, partnerConnected]);

  // Listen to partner presence changes to update P2 position
  useEffect(() => {
    if (!channelRef.current) return;
    const channel = channelRef.current;
    
    const presenceHandler = channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const partnerKey = isHost ? 'client' : 'host';
      if (state[partnerKey] && state[partnerKey][0]) {
        const p2Data = state[partnerKey][0] as any;
        if (p2Data.pos) {
          dispatchLocal({ type: 'SET_P2_POS', pos: p2Data.pos });
        }
      } else {
        dispatchLocal({ type: 'SET_P2_POS', pos: null });
      }
    });

    return () => {
      // presenceHandler.unsubscribe(); // already handled by global channel cleanup
    };
  }, [isHost, dispatchLocal, partnerConnected]);

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
