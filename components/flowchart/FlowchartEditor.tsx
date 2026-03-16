'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';

// Import CSS for React Flow
import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges } from './constants';

export default function FlowchartEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div 
      id="flowchart-container"
      className="w-full h-full min-h-[800px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50 backdrop-blur-sm relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls showInteractive={false} className="bg-slate-900 border-slate-700 fill-white" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.id.includes('admin')) return '#7c3aed';
            if (node.id.includes('cust')) return '#0ea5e9';
            if (node.id.includes('mech')) return '#10b981';
            return '#1e293b';
          }}
          maskColor="rgba(0, 0, 0, 0.3)"
          className="bg-slate-900 border border-slate-800 rounded-lg"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        
        <Panel position="top-left" className="bg-slate-900/80 backdrop-blur-md p-4 rounded-lg border border-slate-700 m-4">
          <h2 className="text-lg font-bold text-white mb-1">TaraFix System Flow</h2>
          <p className="text-xs text-slate-400">Programmatic Architecture View</p>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-xs text-slate-300">Admin Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <span className="text-xs text-slate-300">Customer Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-300">Mechanic Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-slate-500" />
              <span className="text-xs text-slate-300">Database Layer</span>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right" className="m-4">
          <div className="text-[10px] text-slate-500 font-mono">
            v2.0.0-coded
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
