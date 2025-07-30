'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Step } from '@/types'
import { StepNode } from './step-node'

const nodeTypes: NodeTypes = {
  stepNode: StepNode,
}

interface FlowDiagramProps {
  steps: Step[]
  onNodeClick: (step: Step) => void
}

export function FlowDiagram({ steps, onNodeClick }: FlowDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    // Convert steps to nodes and edges
    const newNodes: Node[] = steps
      .sort((a, b) => a.order - b.order)  
      .map((step, index) => ({
        id: step.$id,
        type: 'stepNode',
        position: { x: index * 300 + 50, y: 100 },
        data: { 
          step,
          onClick: () => onNodeClick(step)
        },
      }))

    const newEdges: Edge[] = []
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `${newNodes[i].id}-${newNodes[i + 1].id}`,
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        type: 'straight',
        animated: true,
      })
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [steps, onNodeClick, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}