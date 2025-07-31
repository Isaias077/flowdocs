'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, Loader2 } from 'lucide-react'
import { useProjectSync } from '@/hooks/use-project-sync'
import { getGitHubIntegration } from '@/lib/github-integration'

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
  const [githubIntegration, setGithubIntegration] = useState<any>(null)
  const { syncProjectToGitHub } = useProjectSync()

  // Verificar estado de integración de GitHub
  useEffect(() => {
    const checkGitHubIntegration = () => {
      const integration = getGitHubIntegration()
      setGithubIntegration(integration)
    }

    checkGitHubIntegration()
    
    // Escuchar cambios en localStorage para actualizar el estado
    const handleStorageChange = () => {
      checkGitHubIntegration()
    }

    // Escuchar evento personalizado de actualización de configuración
    const handleConfigUpdate = () => {
      checkGitHubIntegration()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('github-config-updated', handleConfigUpdate)
    
    // También verificar periódicamente por si la configuración cambia
    const interval = setInterval(checkGitHubIntegration, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('github-config-updated', handleConfigUpdate)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    if (!githubIntegration) {
      return
    }

    setIsLoading(true)
    try {
      await syncProjectToGitHub(projectId)
      // Verificar nuevamente el estado después de la sincronización
      const updatedIntegration = getGitHubIntegration()
      setGithubIntegration(updatedIntegration)
    } catch (error) {
      console.error('Error syncing project:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!githubIntegration) {
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