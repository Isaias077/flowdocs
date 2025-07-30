import { databases, DATABASE_ID, COLLECTIONS, ID } from '@/lib/appwrite'
import { FlowChangeLog } from '@/types'
import { getGitHubIntegration } from '@/lib/github-integration'

interface LogChangeParams {
  flowId: string
  stepId?: string | null
  changeType: 'step_created' | 'step_updated' | 'step_deleted' | 'flow_updated'
  fieldName?: string | null
  oldValue?: string | null
  newValue?: string | null
  description: string
  userId?: string | null
}

export const useChangelog = () => {
  const logChange = async (params: LogChangeParams) => {
    try {
      const changeId = ID.unique()
      const changeData = {
        flow_id: params.flowId,
        step_id: params.stepId || null,
        change_type: params.changeType,
        field_name: params.fieldName || null,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        description: params.description,
        user_id: params.userId || null
      }

      // Guardar en Appwrite
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FLOW_CHANGELOG,
        changeId,
        changeData
      )

      // Sincronizar con GitHub si está habilitado
      const githubIntegration = getGitHubIntegration()
      console.log('GitHub Integration status:', {
        hasIntegration: !!githubIntegration,
        changeType: params.changeType,
        description: params.description
      })
      
      if (githubIntegration) {
        const changelogEntry = {
          id: changeId,
          change_type: params.changeType,
          description: params.description,
          old_value: params.oldValue || undefined,
          new_value: params.newValue || undefined,
          field_changed: params.fieldName || undefined,
          flow_id: params.flowId,
          step_id: params.stepId || undefined,
          created_at: new Date().toISOString()
        }
        
        console.log('Syncing change to GitHub:', changelogEntry)
        
        // Sincronización asíncrona para no bloquear la UI
        githubIntegration.syncChange(changelogEntry).catch(error => {
          console.error('Error syncing to GitHub:', error)
        })
      } else {
        console.log('GitHub integration not available - check configuration')
      }
    } catch (error) {
      console.error('Error logging change:', error)
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  const logStepCreated = async (flowId: string, stepId: string, stepName: string) => {
    await logChange({
      flowId,
      stepId,
      changeType: 'step_created',
      description: `Se creó el paso "${stepName}"`
    })
  }

  const logStepUpdated = async (
    flowId: string, 
    stepId: string, 
    stepName: string, 
    fieldName: string, 
    oldValue: string, 
    newValue: string
  ) => {
    await logChange({
      flowId,
      stepId,
      changeType: 'step_updated',
      fieldName,
      oldValue,
      newValue,
      description: `Se modificó el campo "${fieldName}" del paso "${stepName}"`
    })
  }

  const logStepDeleted = async (flowId: string, stepName: string, microservice: string) => {
    await logChange({
      flowId,
      changeType: 'step_deleted',
      description: `Se eliminó el paso "${stepName}" del microservicio "${microservice}"`
    })
  }

  const logFlowUpdated = async (
    flowId: string, 
    fieldName: string, 
    oldValue: string, 
    newValue: string
  ) => {
    await logChange({
      flowId,
      changeType: 'flow_updated',
      fieldName,
      oldValue,
      newValue,
      description: `Se modificó el campo "${fieldName}" del flujo`
    })
  }

  return {
    logChange,
    logStepCreated,
    logStepUpdated,
    logStepDeleted,
    logFlowUpdated
  }
}