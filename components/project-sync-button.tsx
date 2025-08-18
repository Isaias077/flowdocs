'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, Loader2 } from 'lucide-react'
import { useProjectSync } from '@/hooks/use-project-sync'

interface ProjectSyncButtonProps {
  projectId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showText?: boolean
}

export default function ProjectSyncButton({ 
  projectId, 
  variant = 'outline', 
  size = 'sm',
  showText = false 
}: ProjectSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const { syncProjectToGitHub } = useProjectSync()

  // Verificar estado de integración de GitHub (servidor)
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/github/test', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled) {
          setIsEnabled(Boolean(json?.ok && json?.enabled && json?.hasAuth && json?.hasRepo))
        }
      } catch {
        if (!cancelled) setIsEnabled(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSync = async () => {
    setIsLoading(true)
    try {
      await syncProjectToGitHub(projectId)
    } catch (error) {
      console.error('Error syncing project:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isEnabled) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {showText && (
              <span>{isLoading ? 'Sincronizando...' : 'Sync GitHub'}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sincronizar proyecto con GitHub</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}