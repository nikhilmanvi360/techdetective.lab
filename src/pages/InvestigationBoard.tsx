import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, StickyNote, Activity, Plus, X, Link as LinkIcon, 
  Trash2, Move, Clock, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { useSound } from '../hooks/useSound';

interface BoardNode {
  id: number;
  type: 'suspect' | 'clue' | 'timeline';
  content: { label: string; description?: string; color?: string; };
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
    if (!caseId) { setLoading(false); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/board/${caseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
          setNodes(data.nodes); setLinks(data.links);
        } else { setNodes([]); setLinks([]); }
      }
    } catch (err) {} finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => {
    fetchBoard();
    const socket = io();
    socketRef.current = socket;
    const team = JSON.parse(localStorage.getItem('team') || '{}');

    socket.on('board_update', (update: any) => {
      if (update.teamId === team.id) {
        if (update.type === 'node_moved') setNodes(prev => prev.map(n => n.id === update.nodeId ? { ...n, x: update.x, y: update.y } : n));
        else if (update.type === 'node_added') { setNodes(prev => prev.some(n => n.id === update.node.id) ? prev : [...prev, update.node]); playSound('ping'); }
        else if (update.type === 'node_deleted') { setNodes(prev => prev.filter(n => n.id !== update.nodeId)); setLinks(prev => prev.filter(l => l.source_node_id !== update.nodeId && l.target_node_id !== update.nodeId)); }
        else if (update.type === 'link_added') { setLinks(prev => prev.some(l => l.id === update.link.id) ? prev : [...prev, update.link]); playSound('success'); }
        else if (update.type === 'link_deleted') setLinks(prev => prev.filter(l => l.id !== update.linkId));
      }
    });
    return () => { socket.disconnect(); };
  }, [caseId, fetchBoard, playSound]);

  const handleAddNode = async (type: BoardNode['type']) => {
    playSound('click');
    const label = window.prompt(`Enter ${type} label:`);
    if (!label) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/board/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ caseId, type, content: { label, description: 'Added by operative' }, x: 50, y: 50 })
      });
      if (res.ok) {
        const newNode = await res.json();
        setNodes(prev => prev.some(n => n.id === newNode.id) ? prev : [...prev, newNode]);
        setShowAddMenu(false);
      }
    } catch (err) {}
  };

  const handleUpdatePosition = async (nodeId: number, x: number, y: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/board/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ x, y })
      });
    } catch (err) {}
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (!window.confirm('Remove this evidence from board?')) return;
    playSound('click');
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/board/nodes/${nodeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setLinks(prev => prev.filter(l => l.source_node_id !== nodeId && l.target_node_id !== nodeId));
    } catch (err) {}
  };

  const handleLinkNodes = async (targetId: number) => {
    if (!linkingSourceId || linkingSourceId === targetId) { setLinkingSourceId(null); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/board/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sourceId: linkingSourceId, targetId })
      });
      if (res.ok) {
        const newLink = await res.json();
        setLinks(prev => prev.some(l => l.id === newLink.id) ? prev : [...prev, newLink]);
        setLinkingSourceId(null);
        playSound('success');
      }
    } catch (err) {}
  };

  const getNodeStyles = (type: BoardNode['type']) => {
    switch (type) {
      case 'suspect': return 'paper-card p-4 border bg-[#eadda5] text-black'; // Sticky note style
      case 'clue': return 'bg-[#fdfaf1] border-8 border-white shadow-xl text-black rotate-1'; // Polaroid style
      case 'timeline': return 'bg-white border-l-4 border-red-800 p-4 shadow-md text-black -rotate-1'; // Index card style
      default: return 'paper-card bg-white text-black';
    }
  };

  const getNodeIcon = (type: BoardNode['type']) => {
    switch (type) {
      case 'suspect': return <Users className="w-5 h-5 opacity-60" />;
      case 'clue': return <BadgeInfo className="w-5 h-5 opacity-60" />;
      case 'timeline': return <Clock className="w-5 h-5 opacity-60" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="typewriter-text text-[#8b0000] uppercase tracking-widest text-lg font-bold">Unpacking Evidence Board...</div>
    </div>
  );

  return (
    <div className="relative h-[calc(100vh-160px)] w-full overflow-hidden border-4 border-[#3c2a1e] rounded shadow-2xl bg-cover bg-center" style={{ backgroundImage: "url('/background.png')" }}>
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-[rgba(255,255,255,0.9)] border-b-2 border-black shadow">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-black">
            <ShieldAlert className="w-6 h-6 text-[#8b0000]" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-black uppercase tracking-widest">Shared Investigation Board</h2>
            <p className="text-[10px] font-sans text-gray-600 uppercase font-bold tracking-widest">Operation Intel Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-black border-2 border-black text-white text-xs font-display uppercase tracking-widest hover:bg-transparent hover:text-black transition-all"
          >
            <Plus className="w-4 h-4" /> Pin Intel
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
            className="absolute top-20 right-4 z-30 p-4 bg-[#fdfbf2] border-2 border-black space-y-2 shadow-2xl"
          >
            <button onClick={() => handleAddNode('suspect')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-black hover:bg-gray-200 border-b border-[rgba(0,0,0,0.1)] transition-all">
              <Users className="w-4 h-4" /> Suspect Profile
            </button>
            <button onClick={() => handleAddNode('clue')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-black hover:bg-gray-200 border-b border-[rgba(0,0,0,0.1)] transition-all">
              <Activity className="w-4 h-4" /> Evidence Polaroid
            </button>
            <button onClick={() => handleAddNode('timeline')} className="w-full text-left p-3 flex items-center gap-3 text-xs font-display uppercase tracking-widest text-black hover:bg-gray-200 transition-all">
              <Clock className="w-4 h-4" /> Timeline Card
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Area with scroll/pan container */}
      <div ref={boardRef} className="relative w-full h-full overflow-auto custom-scrollbar p-[1000px]">
        <div className="relative w-[2000px] h-[2000px]">
          
          {/* SVG Links Layer - Red String Style */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
            <defs>
              <filter id="string-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5" />
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
              
              // Draw straight path for red string tight between pins
              const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
              
              return (
                <g key={link.id}>
                  {/* String Shadow */}
                  <path d={pathData} stroke="rgba(0,0,0,0.4)" strokeWidth="4" fill="none" transform="translate(2, 4)" filter="blur(2px)" />
                  {/* Red String */}
                  <path
                    d={pathData}
                    stroke="#a52a2a"
                    strokeWidth="3"
                    fill="none"
                    filter="url(#string-shadow)"
                    strokeLinecap="round"
                  />
                  {/* String threads detailed overlay */}
                  <path
                    d={pathData}
                    stroke="#8b0000"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    fill="none"
                  />
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
                const now = Date.now();
                if (socketRef.current && (now - (throttleRef.current || 0) > 30)) {
                  const x = Math.min(Math.max(node.x + (info.offset.x / 2000) * 100, 2), 98);
                  const y = Math.min(Math.max(node.y + (info.offset.y / 2000) * 100, 2), 98);
                  const team = JSON.parse(localStorage.getItem('team') || '{}');
                  socketRef.current.emit('node_dragging', { teamId: team.id, nodeId: node.id, x, y });
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
              style={{ left: `${node.x}%`, top: `${node.y}%`, position: 'absolute', x: '-50%', y: '-50%' }}
              className={`cursor-grab active:cursor-grabbing min-w-[200px] max-w-[250px] z-20 group ${getNodeStyles(node.type)} ${linkingSourceId === node.id ? 'ring-4 ring-green-600 animate-pulse' : ''}`}
            >
              <div className="pushpin absolute -top-3 left-1/2 -translate-x-1/2 z-30" />
              
              <div className="flex items-center justify-between gap-2 mb-4 pointer-events-none border-b border-[rgba(0,0,0,0.1)] pb-2 p-4">
                <div className="flex items-center gap-2 text-[#8b0000]">
                  {getNodeIcon(node.type)}
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest">{node.type}</span>
                </div>
                <div className="flex items-center gap-1 pointer-events-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLinkingSourceId(node.id); }} 
                    className="p-1 hover:bg-[rgba(0,0,0,0.1)] rounded transition-colors text-black"
                    title="Connect Thread"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} 
                    className="p-1 hover:bg-[rgba(0,0,0,0.1)] rounded transition-colors text-[#8b0000]"
                    title="Remove Pin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="px-4 pb-4">
                 <div className="text-xl font-display font-bold text-black mb-2 uppercase tracking-tighter leading-tight">
                   {node.content.label.replace(' ', '_')}
                 </div>
                 <div className="text-xs typewriter-text text-gray-700 leading-relaxed max-h-32 overflow-hidden">
                   {node.content.description || 'NO ADDITIONAL METADATA...'}
                 </div>
              </div>

              {/* Linking Button Overlay */}
              {linkingSourceId !== null && linkingSourceId !== node.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLinkNodes(node.id); }}
                  className="absolute inset-0 bg-[rgba(34,197,94,0.9)] border-4 border-green-800 flex items-center justify-center animate-pulse z-50 text-sm font-display font-bold text-white tracking-widest shadow-xl"
                >
                  <LinkIcon className="w-6 h-6 mr-2" /> CONNECT THREAD
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Helper Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-[#fdfbf2] border-2 border-black text-[10px] font-sans font-bold text-black uppercase tracking-widest whitespace-nowrap shadow-md">
        {linkingSourceId ? 'Select target evidence to connect thread...' : 'Drag items to re-pin | Connect threads with Link icon'}
      </div>
    </div>
  );
}
