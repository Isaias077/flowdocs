"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Github, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { getGitHubIntegration, resetGitHubIntegration, updateGitHubConfig } from '@/lib/github-integration'
import { useProjectSync } from '@/hooks/use-project-sync'
import { toast } from 'sonner'

interface GitHubConfigProps {
  className?: string
}

export function GitHubConfig({ className }: GitHubConfigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    token: '',
    owner: '',
    repo: '',
    enabled: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [repositoryInfo, setRepositoryInfo] = useState<any>(null)
  const { syncProjectToGitHub, syncAllProjectsToGitHub } = useProjectSync()

  useEffect(() => {
    // Cargar configuración desde localStorage
    const savedConfig = localStorage.getItem('github_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig({
          token: parsed.token || '',
          owner: parsed.owner || '',
          repo: parsed.repo || '',
          enabled: parsed.enabled || false
        })
        
        // Verificar si la integración está activa
        const githubIntegration = getGitHubIntegration()
        if (githubIntegration) {
          setConnectionStatus('connected')
          loadRepositoryInfo()
        }
      } catch (error) {
        console.error('Error loading saved config:', error)
      }
    } else {
      // Cargar desde variables de entorno como fallback
      const envConfig = {
        token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
        owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || '',
        repo: process.env.NEXT_PUBLIC_GITHUB_REPO || '',
        enabled: process.env.NEXT_PUBLIC_GITHUB_SYNC_ENABLED === 'true'
      }
      
      // Solo cargar desde env si hay valores
      if (envConfig.token || envConfig.owner || envConfig.repo) {
        setConfig(envConfig)
      }
      
      const githubIntegration = getGitHubIntegration()
      if (githubIntegration) {
        setConnectionStatus('connected')
        loadRepositoryInfo()
      }
    }
  }, [])

  const loadRepositoryInfo = async () => {
    try {
      const githubIntegration = getGitHubIntegration()
      if (githubIntegration) {
        const info = await githubIntegration.getRepositoryInfo()
        setRepositoryInfo(info)
      }
    } catch (error) {
      console.error('Error loading repository info:', error)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      // Crear una instancia temporal para probar
      const { GitHubIntegration } = await import('@/lib/github-integration')
      const tempIntegration = new GitHubIntegration({
        token: config.token,
        owner: config.owner,
        repo: config.repo,
        enabled: true
      })

      const isConnected = await tempIntegration.testConnection()
      if (isConnected) {
        setConnectionStatus('connected')
        const info = await tempIntegration.getRepositoryInfo()
        setRepositoryInfo(info)
        toast.success('Conexión exitosa con GitHub')
      } else {
        setConnectionStatus('error')
        toast.error('Error al conectar con GitHub')
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error('Error al probar la conexión')
      console.error('Connection test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setIsLoading(true)
    try {
      // Usar la nueva función para actualizar la configuración
      updateGitHubConfig(config)
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new Event('github-config-updated'))
      
      // Verificar la conexión después de guardar
      if (config.enabled && config.token && config.owner && config.repo) {
        const githubIntegration = getGitHubIntegration()
        if (githubIntegration) {
          const isConnected = await githubIntegration.testConnection()
          if (isConnected) {
            setConnectionStatus('connected')
            const info = await githubIntegration.getRepositoryInfo()
            setRepositoryInfo(info)
          } else {
            setConnectionStatus('error')
          }
        }
      } else {
        setConnectionStatus('unknown')
        setRepositoryInfo(null)
      }
      
      toast.success('Configuración guardada exitosamente')
      setIsOpen(false)
    } catch (error) {
      toast.error('Error al guardar la configuración')
      console.error('Save configuration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const forceBatchCommit = async () => {
    try {
      const githubIntegration = getGitHubIntegration()
      if (githubIntegration) {
        await githubIntegration.forceBatchCommit()
        toast.success('Cambios pendientes sincronizados con GitHub')
      } else {
        toast.error('GitHub no está configurado')
      }
    } catch (error) {
      toast.error('Error al sincronizar cambios')
      console.error('Force batch commit error:', error)
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
            Configura la integración con GitHub para sincronizar automáticamente el historial de cambios.
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
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{getStatusText()}</p>
                  {repositoryInfo && (
                    <p className="text-xs text-muted-foreground">
                      {repositoryInfo.full_name} • {repositoryInfo.private ? 'Privado' : 'Público'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceBatchCommit}
                    disabled={connectionStatus !== 'connected'}
                  >
                    Sincronizar Pendientes
                  </Button>
                  {repositoryInfo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repositoryInfo.html_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuración</CardTitle>
              <CardDescription>
                Configura los detalles de tu repositorio de GitHub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Habilitar sincronización con GitHub</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Propietario</Label>
                  <Input
                    id="owner"
                    placeholder="usuario o organización"
                    value={config.owner}
                    onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo">Repositorio</Label>
                  <Input
                    id="repo"
                    placeholder="nombre-del-repositorio"
                    value={config.repo}
                    onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token de Acceso Personal</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_..."
                  value={config.token}
                  onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Necesitas un token con permisos de escritura en el repositorio.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información sobre la nueva estrategia */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Nueva Estrategia:</strong> Sincronización a nivel de proyecto. Los proyectos se guardan completos con todos sus flows y steps en GitHub.
            </AlertDescription>
          </Alert>

          {/* Acciones de sincronización */}
          {connectionStatus === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sincronización de Proyectos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Obtener projectId desde la URL si estamos en una página de proyecto
                      const pathParts = window.location.pathname.split('/')
                      const projectIndex = pathParts.indexOf('projects')
                      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
                        const projectId = pathParts[projectIndex + 1]
                        syncProjectToGitHub(projectId)
                      } else {
                        toast.error('No se pudo detectar el proyecto actual')
                      }
                    }}
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

          {/* Botones de acción */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={isLoading || !config.token || !config.owner || !config.repo}
            >
              {isLoading ? 'Probando...' : 'Probar Conexión'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveConfiguration} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}