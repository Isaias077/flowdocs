'use client'

import { useState } from 'react'
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
  const { syncProjectToGitHub } = useProjectSync()

  const handleSync = async () => {
    const githubIntegration = getGitHubIntegration()
    
    if (!githubIntegration) {
      return
    }

    setIsLoading(true)
    try {
      await syncProjectToGitHub(projectId)
    } catch (error) {
      console.error('Error syncing project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const githubIntegration = getGitHubIntegration()
  
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