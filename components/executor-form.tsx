'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface ExecutorData {
  type: string
  identifier: string
  metadata: Record<string, string>
}

interface ExecutorFormProps {
  executor: ExecutorData
  isEditing: boolean
  onChange: (executor: ExecutorData) => void
}

// Configuración de tipos de executor
const EXECUTOR_TYPES = {
  'microservice': {
    label: 'Microservice',
    identifierLabel: 'Service Name',
    defaultMetadata: { version: '1.0' }
  },
  'api-endpoint': {
    label: 'API Endpoint',
    identifierLabel: 'Endpoint Path',
    defaultMetadata: { method: 'GET' }
  },
  'manual-task': {
    label: 'Manual Task',
    identifierLabel: 'Task Name',
    defaultMetadata: { priority: 'medium' }
  },
  'database-query': {
    label: 'Database Query',
    identifierLabel: 'Query Name',
    defaultMetadata: { database: 'main' }
  }
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export function ExecutorForm({ executor, isEditing, onChange }: ExecutorFormProps) {
  const [newMetadataKey, setNewMetadataKey] = useState('')
  const [newMetadataValue, setNewMetadataValue] = useState('')
  const [showAddMetadata, setShowAddMetadata] = useState(false)

  const currentTypeConfig = EXECUTOR_TYPES[executor.type as keyof typeof EXECUTOR_TYPES] || EXECUTOR_TYPES.microservice

  const handleTypeChange = (newType: string) => {
    const typeConfig = EXECUTOR_TYPES[newType as keyof typeof EXECUTOR_TYPES]
    onChange({
      ...executor,
      type: newType,
      identifier: '',
      metadata: typeConfig?.defaultMetadata || {}
    })
  }

  const handleIdentifierChange = (value: string) => {
    onChange({ ...executor, identifier: value })
  }

  const handleMetadataChange = (key: string, value: string) => {
    const newMetadata = { ...executor.metadata }
    if (value.trim() === '') {
      delete newMetadata[key]
    } else {
      newMetadata[key] = value
    }
    onChange({ ...executor, metadata: newMetadata })
  }

  const handleAddMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      handleMetadataChange(newMetadataKey.trim(), newMetadataValue.trim())
      setNewMetadataKey('')
      setNewMetadataValue('')
      setShowAddMetadata(false)
    }
  }

  const handleRemoveMetadata = (key: string) => {
    const newMetadata = { ...executor.metadata }
    delete newMetadata[key]
    onChange({ ...executor, metadata: newMetadata })
  }

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-slate-700">Executor</Label>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {currentTypeConfig.label}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
              {executor.identifier || 'Unknown'}
            </Badge>
          </div>
        </div>
        
        {Object.keys(executor.metadata).length > 0 && (
          <div>
            <Label className="text-sm font-medium text-slate-700">Metadata</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(executor.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-slate-700">Executor</Label>
        <div className="space-y-3 mt-2">
          {/* Type Selector */}
          <div>
            <Label className="text-xs text-slate-600">Type</Label>
            <Select value={executor.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select executor type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXECUTOR_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Identifier Field */}
          <div>
            <Label className="text-xs text-slate-600">{currentTypeConfig.identifierLabel}</Label>
            <Input
              value={executor.identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              placeholder={`Enter ${currentTypeConfig.identifierLabel.toLowerCase()}`}
              className="w-full"
            />
          </div>

          {/* Metadata Section */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Metadata</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMetadata(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2 mt-1">
              {Object.entries(executor.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value
                        const newMetadata = { ...executor.metadata }
                        delete newMetadata[key]
                        if (newKey.trim()) {
                          newMetadata[newKey] = value
                        }
                        onChange({ ...executor, metadata: newMetadata })
                      }}
                      placeholder="Key"
                      className="text-xs"
                    />
                    {key === 'method' && executor.type === 'api-endpoint' ? (
                      <Select value={value} onValueChange={(newValue) => handleMetadataChange(key, newValue)}>
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => handleMetadataChange(key, e.target.value)}
                        placeholder="Value"
                        className="text-xs"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMetadata(key)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {showAddMetadata && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={newMetadataKey}
                      onChange={(e) => setNewMetadataKey(e.target.value)}
                      placeholder="Key"
                      className="text-xs"
                    />
                    <Input
                      value={newMetadataValue}
                      onChange={(e) => setNewMetadataValue(e.target.value)}
                      placeholder="Value"
                      className="text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddMetadata}
                    className="h-6 w-6 p-0 text-green-500 hover:text-green-700"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddMetadata(false)
                      setNewMetadataKey('')
                      setNewMetadataValue('')
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}