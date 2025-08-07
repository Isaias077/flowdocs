import { StateCreator } from 'zustand'
import { databases, ID, COLLECTIONS, DATABASE_ID, Query } from '../appwrite'
import type { FlowChangeLog } from '../../types'
import type { AppStore, ChangeLogState, ChangeLogActions } from './types'

export const createChangeLogSlice: StateCreator<
  AppStore,
  [],
  [],
  ChangeLogState & ChangeLogActions
> = (set, get) => ({
  // Estado inicial
  changeLogs: [],
  loading: {
    isLoading: false,
    error: null
  },

  // Acciones
  fetchChangeLogs: async (flowId) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const queries = flowId ? [
        Query.equal('flow_id', flowId),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ] : []
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FLOW_CHANGELOG,
        queries
      )
      
      const changeLogs = response.documents.map(doc => ({
        $id: doc.$id,
        flow_id: doc.flow_id,
        step_id: doc.step_id,
        change_type: doc.change_type,
        field_name: doc.field_name,
        old_value: doc.old_value,
        new_value: doc.new_value,
        description: doc.description,
        user_id: doc.user_id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      })) as FlowChangeLog[]

      set({
        changeLogs,
        loading: { isLoading: false, error: null }
      })
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al cargar changelog'
        }
      }))
    }
  },

  createChangeLog: async (changeLogData) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response: any = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FLOW_CHANGELOG,
        ID.unique(),
        changeLogData
      )

      const newChangeLog: FlowChangeLog = {
        $id: response.$id,
        flow_id: response.flow_id,
        step_id: response.step_id,
        change_type: response.change_type,
        field_name: response.field_name,
        old_value: response.old_value,
        new_value: response.new_value,
        description: response.description,
        user_id: response.user_id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        changeLogs: [...state.changeLogs, newChangeLog],
        loading: { isLoading: false, error: null }
      }))

      return newChangeLog
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al crear changelog'
        }
      }))
      throw error
    }
  }
})
