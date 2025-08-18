"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useProjectSync } from '@/hooks/use-project-sync'
import { toast } from 'sonner'

type ConnectionStatus = 'unknown' | 'connected' | 'error'

type TestResponse = {
  ok: boolean
  enabled: boolean
  hasAuth: boolean
  hasRepo: boolean
  user?: { login?: string; id?: number }
  repository?: {
    full_name?: string
    private?: boolean
    default_branch?: string
    html_url?: string
  }
  rateLimitRemaining?: number
  rateLimitReset?: number
  message?: string
  detail?: string
}

interface GitHubConfigProps {
  className?: string
}

export function GitHubConfig({ className }: GitHubConfigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown')
  const [repositoryInfo, setRepositoryInfo] = useState<TestResponse['repository'] | null>(null)
  const [testInfo, setTestInfo] = useState<TestResponse | null>(null)
  const { syncProjectToGitHub, syncAllProjectsToGitHub } = useProjectSync()

  useEffect(() => {
    // Chequear estado al montar
    ;(async () => {
      await loadStatus()
    })()
  }, [])

  const loadStatus = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/github/test', { cache: 'no-store' })
      const json: TestResponse = await res.json()
      setTestInfo(json)

      const connected = Boolean(json?.ok && json?.enabled && json?.hasAuth && json?.hasRepo)
      setConnectionStatus(connected ? 'connected' : json?.enabled ? 'error' : 'unknown')
      setRepositoryInfo(json?.repository ?? null)

      if (!connected && json?.message) {
        // Log suave, no ruido en UI
        console.debug('GitHub test:', json.message)
      }
    } catch (error) {
      setConnectionStatus('error')
      setRepositoryInfo(null)
      console.error('Error testing GitHub connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado'
      case 'error':
        return 'Error de conexión'
      default:
        return 'Estado desconocido'
    }
  }

  const handleSyncCurrentProject = async () => {
    try {
      const parts = window.location.pathname.split('/')
      const idx = parts.indexOf('projects')
      if (idx !== -1 && parts[idx + 1]) {
        const projectId = parts[idx + 1]
        await syncProjectToGitHub(projectId)
      } else {
        toast.error('No se pudo detectar el proyecto actual')
      }
    } catch (e) {
      console.error('Error syncing current project:', e)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Github className="h-4 w-4 mr-2" />
          GitHub
          {getStatusIcon()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Configuración de GitHub
          </DialogTitle>
          <DialogDescription>
            Sincroniza proyectos y cambios con GitHub mediante endpoints de servidor seguros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado de conexión */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Estado de Conexión
                {getStatusIcon()}
              </CardTitle>
              <CardDescription>
                {connectionStatus === 'connected'
                  ? 'Integración habilitada y con acceso al repositorio.'
                  : connectionStatus === 'error'
                  ? 'Hay un problema con la configuración o permisos.'
                  : 'La integración no está habilitada en el servidor.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{getStatusText()}</p>
                  {repositoryInfo && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {repositoryInfo.full_name} • {repositoryInfo.private ? 'Privado' : 'Público'}
                      </p>
                      {repositoryInfo.default_branch && (
                        <p className="text-xs text-muted-foreground">
                          Branch por defecto: {repositoryInfo.default_branch}
                        </p>
                      )}
                    </>
                  )}
                  {testInfo && (
                    <p className="text-xs text-muted-foreground">
                      Enabled: {String(testInfo.enabled)} • Auth: {String(testInfo.hasAuth)} • Repo:{' '}
                      {String(testInfo.hasRepo)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadStatus}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Probando...' : 'Probar Conexión'}
                  </Button>
                  {repositoryInfo?.html_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repositoryInfo.html_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de estrategia */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              La configuración se gestiona en el servidor mediante variables de entorno. Define en
              tu .env:
              GITHUB_SYNC_ENABLED=true, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.
              Reinicia el servidor tras cambios.
            </AlertDescription>
          </Alert>

          {/* Acciones de sincronización */}
          {connectionStatus === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sincronización de Proyectos</CardTitle>
                <CardDescription>Exporta proyectos como JSON y README.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCurrentProject}
                    disabled={isLoading}
                  >
                    Sincronizar Proyecto Actual
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncAllProjectsToGitHub()}
                    disabled={isLoading}
                  >
                    Sincronizar Todos los Proyectos
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los proyectos se guardan como archivos JSON y README en GitHub.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ayuda */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}