import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, StickyNote, Activity, Plus, X, Link as LinkIcon, 
  Trash2, MousePointer2, Move, Clock, ShieldAlert, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { useSound } from '../hooks/useSound';

interface BoardNode {
  id: number;
  type: 'suspect' | 'clue' | 'timeline';
  content: {
    label: string;
    description?: string;
    color?: string;
  };
  x: number;
  y: number;
}

interface BoardLink {
  id: number;
  source_node_id: number;
  target_node_id: number;
}

export default function InvestigationBoard() {
  const { caseId } = useParams();
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [links, setLinks] = useState<BoardLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragNodeId, setDragNodeId] = useState<number | null>(null);
  const [linkingSourceId, setLinkingSourceId] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const throttleRef = useRef<number>(0);
  const { playSound } = useSound();

  const fetchBoard = useCallback(async () => {
    if (!caseId) {
      console.warn('Board: Missing caseId in URL parameters');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/board/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
          setNodes(data.nodes);
          setLinks(data.links);
        } else {
          console.error('Board API Error: Invalid data format', data);
          setNodes([]);
          setLinks([]);
        }
      } else if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          console.error(`Board API Error (${res.status}):`, errorData.error || 'Unknown error');
        } else {
          console.error(`Board API Error (${res.status}): Received non-JSON response. Server might be misconfigured.`);
        }
      } else {
        console.warn('Board: Received success status but non-JSON response.');
      }
    } catch (err) {
      console.error('Board: Network error fetching state', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchBoard();

    const socket = io();
    socketRef.current = socket;
    const team = JSON.parse(localStorage.getItem('team') || '{}');

    socket.on('board_update', (update: any) => {
      if (update.teamId === team.id) {
        if (update.type === 'node_moved') {
          setNodes(prev => prev.map(n => n.id === update.nodeId ? { ...n, x: update.x, y: update.y } : n));
        } else if (update.type === 'node_added') {
          setNodes(prev => prev.some(n => n.id === update.node.id) ? prev : [...prev, update.node]);
          playSound('ping');
        } else if (update.type === 'node_deleted') {
          setNodes(prev => prev.filter(n => n.id !== update.nodeId));
          setLinks(prev => prev.filter(l => l.source_node_id !== update.nodeId && l.target_node_id !== update.nodeId));
        } else if (update.type === 'link_added') {
          setLinks(prev => prev.some(l => l.id === update.link.id) ? prev : [...prev, update.link]);
          playSound('success');
        } else if (update.type === 'link_deleted') {
          setLinks(prev => prev.filter(l => l.id !== update.linkId));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [caseId, fetchBoard, playSound]);

  const handleAddNode = async (type: BoardNode['type']) => {
    playSound('click');
    const label = window.prompt(`Enter ${type} label:`);
    if (!label) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/board/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caseId,
          type,
          content: { label, description: 'Added by operative' },
          x: 50,
          y: 50
        })
      });
      
      if (res.ok) {
        const newNode = await res.json();
        setNodes(prev => prev.some(n => n.id === newNode.id) ? prev : [...prev, newNode]);
        setShowAddMenu(false);
      }
    } catch (err) {
      console.error('Failed to add node');
    }
  };

  const handleUpdatePosition = async (nodeId: number, x: number, y: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/board/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ x, y })
      });
    } catch (err) {
      console.error('Failed to update node position');
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (!window.confirm('Delete this investigation node?')) return;
    playSound('click');
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/board/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setLinks(prev => prev.filter(l => l.source_node_id !== nodeId && l.target_node_id !== nodeId));
    } catch (err) {
      console.error('Failed to delete node');
    }
  };

  const handleLinkNodes = async (targetId: number) => {
    if (!linkingSourceId || linkingSourceId === targetId) {
      setLinkingSourceId(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/board/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceId: linkingSourceId, targetId })
      });
      
      if (res.ok) {
        const newLink = await res.json();
        setLinks(prev => prev.some(l => l.id === newLink.id) ? prev : [...prev, newLink]);
        setLinkingSourceId(null);
        playSound('success');
      }
    } catch (err) {
      console.error('Failed to create link');
    }
  };

  const getNodeStyles = (type: BoardNode['type']) => {
    switch (type) {
      case 'suspect': return 'border-cyber-red bg-cyber-red/10 text-cyber-red';
      case 'clue': return 'border-cyber-blue bg-cyber-blue/10 text-cyber-blue';
      case 'timeline': return 'border-cyber-amber bg-cyber-amber/10 text-cyber-amber';
      default: return 'border-cyber-line bg-black/50 text-white';
    }
  };

  const getNodeIcon = (type: BoardNode['type']) => {
    switch (type) {
      case 'suspect': return <Users className="w-4 h-4" />;
      case 'clue': return <Activity className="w-4 h-4" />;
      case 'timeline': return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
      <span className="font-display text-cyber-blue uppercase tracking-widest text-xs">Reconstructing_Board_Matrix...</span>
    </div>
  );

  return (
    <div className="relative h-[calc(100vh-160px)] w-full overflow-hidden bg-black/90 border border-cyber-line corner-brackets">
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-black/60 border-b border-cyber-line backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyber-blue/10 border border-cyber-blue/30">
            <ShieldAlert className="w-5 h-5 text-cyber-blue flicker-anim" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest">Shared_Investigation_Log</h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase">Synchronized_Terminal_Output</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/40 text-cyber-blue text-xs font-display uppercase tracking-widest hover:bg-cyber-blue/40 transition-all"
          >
            <Plus className="w-4 h-4" /> Add_Intel
          </button>
        </div>
      </div>

      {/* Toolbox Popover */}
      <AnimatePresence>
        {showAddMenu && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute top-20 right-4 z-30 p-4 bg-black border border-cyber-blue/40 space-y-2 shadow-2xl"
          >
            <button onClick={() => handleAddNode('suspect')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10 border border-transparent hover:border-cyber-red/20 transition-all">
              <Users className="w-4 h-4" /> Suspect_Pin
            </button>
            <button onClick={() => handleAddNode('clue')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10 border border-transparent hover:border-cyber-blue/20 transition-all">
              <Activity className="w-4 h-4" /> Evidence_Node
            </button>
            <button onClick={() => handleAddNode('timeline')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-cyber-amber hover:bg-cyber-amber/10 border border-transparent hover:border-cyber-amber/20 transition-all">
              <Clock className="w-4 h-4" /> Timeline_Marker
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Area with scroll/pan container */}
      <div 
        ref={boardRef}
        className="relative w-full h-full overflow-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] p-[1000px]"
      >
        <div className="relative w-[2000px] h-[2000px]">
          {/* Cyber Grid Pattern */}
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          
          {/* SVG Links Layer - Now using Bézier Curves */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {links.map(link => {
              const source = nodes.find(n => n.id === link.source_node_id);
              const target = nodes.find(n => n.id === link.target_node_id);
              if (!source || !target) return null;
              
              const startX = (source.x / 100) * 2000;
              const startY = (source.y / 100) * 2000;
              const endX = (target.x / 100) * 2000;
              const endY = (target.y / 100) * 2000;
              
              // Calculate curved path (Bézier)
              const dx = Math.abs(endX - startX) * 0.5;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              
              return (
                <g key={link.id} className="opacity-80">
                  <path
                    d={pathData}
                    stroke="#ef4444"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="6 3"
                    filter="url(#glow)"
                    className="transition-all duration-75 ease-out"
                  />
                  <circle cx={startX} cy={startY} r="3" fill="#ef4444" />
                  <circle cx={endX} cy={endY} r="3" fill="#ef4444" />
                </g>
              );
            })}
          </svg>

          {/* Nodes Layer */}
          {nodes.map(node => (
            <motion.div
              key={node.id}
              drag
              dragMomentum={false}
              onDragStart={() => setDragNodeId(node.id)}
              onDrag={(e, info) => {
                // Real-time throttled socket emission
                const now = Date.now();
                if (socketRef.current && (now - (throttleRef.current || 0) > 30)) {
                  const x = Math.min(Math.max(node.x + (info.offset.x / 2000) * 100, 2), 98);
                  const y = Math.min(Math.max(node.y + (info.offset.y / 2000) * 100, 2), 98);
                  const team = JSON.parse(localStorage.getItem('team') || '{}');
                  socketRef.current.emit('node_dragging', { 
                    teamId: team.id,
                    nodeId: node.id,
                    x, y 
                  });
                  throttleRef.current = now;
                }
              }}
              onDragEnd={(_, info) => {
                const newX = Math.min(Math.max(node.x + (info.offset.x / 2000) * 100, 2), 98);
                const newY = Math.min(Math.max(node.y + (info.offset.y / 2000) * 100, 2), 98);
                handleUpdatePosition(node.id, newX, newY);
                setDragNodeId(null);
                playSound('click');
              }}
              initial={false}
              style={{ 
                left: `${node.x}%`, 
                top: `${node.y}%`,
                position: 'absolute',
                x: '-50%',
                y: '-50%',
              }}
              className={`cursor-grab active:cursor-grabbing p-4 border-2 min-w-[180px] shadow-2xl backdrop-blur-xl z-20 group ${getNodeStyles(node.type)} ${linkingSourceId === node.id ? 'ring-4 ring-white animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  {getNodeIcon(node.type)}
                  <span className="text-[9px] font-display font-bold uppercase tracking-[0.2em]">{node.type}</span>
                </div>
                <div className="flex items-center gap-1 pointer-events-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLinkingSourceId(node.id); }} 
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Connect Data"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} 
                    className="p-1 hover:bg-white/20 rounded transition-colors text-cyber-red"
                    title="Purge Intel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="text-base font-display font-bold text-white mb-1 uppercase tracking-tighter leading-none">
                {node.content.label.replace(' ', '_')}
              </div>
              <div className="text-[10px] font-mono opacity-50 leading-tight border-t border-white/10 pt-2 mt-2">
                {node.content.description || 'NO_ADDITIONAL_METADATA'}
              </div>

              {/* Linking Button Overlay */}
              {linkingSourceId !== null && linkingSourceId !== node.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLinkNodes(node.id); }}
                  className="absolute inset-0 bg-cyber-blue border-2 border-white flex items-center justify-center animate-pulse z-50 text-[10px] font-display font-bold text-white tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                  ESTABLISH_LINK
                </button>
              )}

              {/* Decorative terminal garnish */}
              <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <Move className="w-2 h-2" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white/20" />
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white/20" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Helper Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-black/80 border border-cyber-line text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">
        {linkingSourceId ? 'Select target node to establish digital link...' : 'Drag nodes to organize intel | Use Link icon to connect threads'}
      </div>
    </div>
  );
}
