'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { History, GitCommit, Plus, Edit, Trash2, FileText } from 'lucide-react'
import { useChangeLogActions, useChangeLogs, useChangeLogsLoading } from '@/lib/store'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface FlowChangelogProps {
  flowId: string
}

export function FlowChangelog({ flowId }: FlowChangelogProps) {
  const { fetchChangeLogs } = useChangeLogActions()
  const changeLogs = useChangeLogs()
  const loading = useChangeLogsLoading()
  const [isOpen, setIsOpen] = useState(false)

  const fetchChangelog = async () => {
    try {
      await fetchChangeLogs(flowId)
    } catch (error) {
      toast.error('Error al cargar el historial de cambios')
      console.error('Error fetching changelog:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchChangelog()
    }
  }, [isOpen, flowId])

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'step_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'step_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'step_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />
      case 'flow_updated':
        return <FileText className="w-4 h-4 text-orange-600" />
      default:
        return <GitCommit className="w-4 h-4 text-gray-600" />
    }
  }

  const getChangeBadgeColor = (changeType: string) => {
    switch (changeType) {
      case 'step_created':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'step_updated':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'step_deleted':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'flow_updated':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatChangeType = (changeType: string) => {
    switch (changeType) {
      case 'step_created':
        return 'Paso Creado'
      case 'step_updated':
        return 'Paso Actualizado'
      case 'step_deleted':
        return 'Paso Eliminado'
      case 'flow_updated':
        return 'Flujo Actualizado'
      default:
        return changeType
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-w-[95vw] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Cambios del Flujo
          </DialogTitle>
          <DialogDescription>
            Registro completo de todas las modificaciones realizadas en este flujo y sus pasos.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 modal-scroll overflow-x-auto">
          {loading.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-slate-500">Cargando historial...</p>
              </div>
            </div>
          ) : changeLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <History className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin Historial</h3>
                <p className="text-slate-500">
                  No hay cambios registrados para este flujo aún.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 min-w-[600px]">
              {changeLogs.map((change: any, index: any) => (
                <div key={change.$id} className="relative">
                  {/* Timeline line */}
                  {index < changeLogs.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-200"></div>
                  )}
                  
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                      {getChangeIcon(change.change_type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getChangeBadgeColor(change.change_type)}`}>
                          {formatChangeType(change.change_type)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(change.$createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 border">
                        <p className="text-sm font-medium text-slate-900 mb-2">
                          {change.description}
                        </p>
                        
                        {change.field_name && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-600">
                              Campo: <span className="font-mono bg-slate-200 px-1 rounded">{change.field_name}</span>
                            </p>
                            
                            {change.old_value && (
                              <div className="text-xs">
                                <span className="text-red-600 font-medium">Anterior:</span>
                                <div className="bg-red-50 border border-red-200 rounded p-2 mt-1 font-mono text-red-800 overflow-x-auto max-w-full">
                                  <div className="min-w-0 whitespace-pre-wrap break-words">
                                    {change.old_value}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {change.new_value && (
                              <div className="text-xs">
                                <span className="text-green-600 font-medium">Nuevo:</span>
                                <div className="bg-green-50 border border-green-200 rounded p-2 mt-1 font-mono text-green-800 overflow-x-auto max-w-full">
                                  <div className="min-w-0 whitespace-pre-wrap break-words">
                                    {change.new_value}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}