import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite'
import { getGitHubIntegration, ProjectExportData } from '@/lib/github-integration'
import { Project, Flow, Step } from '@/types'
import { toast } from 'sonner'

export const useProjectSync = () => {
  const exportProjectData = async (projectId: string): Promise<ProjectExportData> => {
    try {
      // Obtener datos del proyecto
      const project = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        projectId
      ) as unknown as Project

      // Obtener todos los flows del proyecto
      const flowsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        [
          Query.equal('project_id', projectId),
          Query.orderAsc('$createdAt')
        ]
      )

      const flows = []
      
      // Para cada flow, obtener sus steps
      for (const flow of flowsResponse.documents) {
        const stepsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STEPS,
          [
            Query.equal('flow_id', flow.$id),
            Query.orderAsc('order')
          ]
        )

        const flowData = {
          id: flow.$id,
          name: flow.name,
          description: flow.description || undefined,
          status: flow.status || 'active',
          created_at: flow.$createdAt,
          updated_at: flow.$updatedAt,
          steps: stepsResponse.documents.map((step: any) => ({
            id: step.$id,
            name: step.name,
            description: step.description || undefined,
            microservice: step.microservice,
            order: step.order,
            created_at: step.$createdAt,
            updated_at: step.$updatedAt
          }))
        }

        flows.push(flowData)
      }

      return {
        project: {
          id: project.$id,
          name: project.name,
          description: project.description || undefined,
          created_at: project.$createdAt,
          updated_at: project.$updatedAt
        },
        flows
      }
    } catch (error) {
      console.error('Error exporting project data:', error)
      throw error
    }
  }

  const syncProjectToGitHub = async (projectId: string): Promise<void> => {
    try {
      const githubIntegration = getGitHubIntegration()
      
      if (!githubIntegration) {
        toast.error('GitHub integration not configured')
        return
      }

      toast.loading('Sincronizando proyecto con GitHub...')
      
      const projectData = await exportProjectData(projectId)
      await githubIntegration.syncProject(projectData)
      
      toast.success(`Proyecto "${projectData.project.name}" sincronizado con GitHub`)
    } catch (error) {
      console.error('Error syncing project to GitHub:', error)
      toast.error('Error al sincronizar con GitHub')
      throw error
    }
  }

  const syncAllProjectsToGitHub = async (): Promise<void> => {
    try {
      const githubIntegration = getGitHubIntegration()
      
      if (!githubIntegration) {
        toast.error('GitHub integration not configured')
        return
      }

      toast.loading('Sincronizando todos los proyectos con GitHub...')
      
      // Obtener todos los proyectos
      const projectsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        [Query.orderAsc('$createdAt')]
      )

      const allProjectsData: ProjectExportData[] = []
      
      for (const project of projectsResponse.documents) {
        const projectData = await exportProjectData(project.$id)
        allProjectsData.push(projectData)
      }

      await githubIntegration.syncAllProjects(allProjectsData)
      
      toast.success(`${allProjectsData.length} proyectos sincronizados con GitHub`)
    } catch (error) {
      console.error('Error syncing all projects to GitHub:', error)
      toast.error('Error al sincronizar todos los proyectos')
      throw error
    }
  }

  return {
    exportProjectData,
    syncProjectToGitHub,
    syncAllProjectsToGitHub
  }
}