'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Database, Globe, Cpu } from 'lucide-react'
import { Step } from '@/types'

interface StepNodeProps extends NodeProps {
  data: {
    step: Step
    onClick: () => void
  }
}

const getServiceIcon = (service: string) => {
  const lowerService = service.toLowerCase()
  if (lowerService.includes('api') || lowerService.includes('backend')) {
    return <Server className="w-4 h-4" />
  }
  if (lowerService.includes('database') || lowerService.includes('db')) {
    return <Database className="w-4 h-4" />
  }
  if (lowerService.includes('frontend') || lowerService.includes('ui')) {
    return <Globe className="w-4 h-4" />
  }
  return <Cpu className="w-4 h-4" />
}

const getServiceColor = (service: string) => {
  const lowerService = service.toLowerCase()
  if (lowerService.includes('api') || lowerService.includes('backend')) {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (lowerService.includes('database') || lowerService.includes('db')) {
    return 'bg-green-100 text-green-700 border-green-200'
  }
  if (lowerService.includes('frontend') || lowerService.includes('ui')) {
    return 'bg-purple-100 text-purple-700 border-purple-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export function StepNode({ data }: StepNodeProps) {
  const { step, onClick } = data

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Card 
        className="w-64 cursor-pointer hover:shadow-lg transition-shadow border-2 border-slate-200"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {step.order}
          </div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">
              {step.name}
            </h3>
            <div className="ml-2 text-slate-400">
              {getServiceIcon(step.microservice)}
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`text-xs mb-2 ${getServiceColor(step.microservice)}`}
          >
            {step.microservice}
          </Badge>
          
          {step.description && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {step.description}
            </p>
          )}
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} />
    </>
  )
}