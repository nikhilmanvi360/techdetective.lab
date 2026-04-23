import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Suspect: Zero' }, style: { background: '#f0e0a0', border: '2px solid #a07830', color: '#1a0e04', fontWeight: 'bold' } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Evidence: Encrypted Log' }, style: { background: '#e8d488', border: '2px solid #8B2020', color: '#1a0e04' } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8B2020' } }];

export default function InvestigationGraph() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds));

  return (
    <div className="w-full h-full bg-[#140e06] border-2 border-[#a07830] shadow-2xl relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#a07830" gap={20} variant={"dots" as any} />
        <Controls />
        <MiniMap nodeStrokeColor="#a07830" nodeColor="#f0e0a0" />
      </ReactFlow>
      
      {/* HUD Label */}
      <div className="absolute top-4 left-4 z-10 px-4 py-1 bg-[#4a3820] border-2 border-[#d4a017] text-[#f0d070] text-[10px] font-black uppercase tracking-[0.2em]">
        Neural Investigation Matrix
      </div>
    </div>
  );
}
