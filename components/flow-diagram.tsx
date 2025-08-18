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

  useEffect(() => {
    console.log('[Perf] FlowDiagram mount')
    return () => {
      console.log('[Perf] FlowDiagram unmount')
    }
  }, [])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    const t0 = typeof performance !== 'undefined' && (performance as any).now ? performance.now() : Date.now()

    // Convert steps to nodes and edges
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

    const newNodes: Node[] = sortedSteps.map((step, index) => ({
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

    const t1 = typeof performance !== 'undefined' && (performance as any).now ? performance.now() : Date.now()
    console.log(`[Perf] FlowDiagram build graph: ${(t1 - t0).toFixed(1)}ms (steps=${steps.length}, nodes=${newNodes.length}, edges=${newEdges.length})`)

    setNodes(newNodes)
    setEdges(newEdges)

    try {
      requestAnimationFrame(() => {
        const t2 = typeof performance !== 'undefined' && (performance as any).now ? performance.now() : Date.now()
        console.log(`[Perf] FlowDiagram setState->RAF ${(t2 - t1).toFixed(1)}ms`)
      })
    } catch {}
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
        onInit={() => {
          const t = typeof performance !== 'undefined' && (performance as any).now ? performance.now() : Date.now()
          console.log('[Perf] ReactFlow onInit at', t)
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}