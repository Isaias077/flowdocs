import { StateCreator } from 'zustand'
import { databases, ID, COLLECTIONS, DATABASE_ID, Query } from '../appwrite'
import type { Flow } from '../../types'
import type { AppStore, FlowState, FlowActions } from './types'

export const createFlowSlice: StateCreator<
  AppStore,
  [],
  [],
  FlowState & FlowActions
> = (set, get) => ({
  // Estado inicial
  flows: [],
  currentFlow: null,
  loading: {
    isLoading: false,
    error: null
  },

  // Acciones
  fetchFlows: async (projectId) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const queries = projectId ? [Query.equal('project_id', projectId)] : []
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        queries
      )
      
      const flows = response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name,
        description: doc.description,
        project_id: doc.project_id,
        section_id: doc.section_id,
        status: doc.status,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      })) as Flow[]

      set({
        flows,
        loading: { isLoading: false, error: null }
      })
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al cargar flows'
        }
      }))
    }
  },

  createFlow: async (flowData) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response: any = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        ID.unique(),
        flowData
      )

      const newFlow: Flow = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        project_id: response.project_id,
        section_id: response.section_id,
        status: response.status,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        flows: [...state.flows, newFlow],
        loading: { isLoading: false, error: null }
      }))

      return newFlow
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al crear flow'
        }
      }))
      throw error
    }
  },

  updateFlow: async (id, updates) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        id,
        {
          name: updates.name,
          description: updates.description,
          project_id: updates.project_id,
          section_id: updates.section_id,
          status: updates.status
        }
      )

      const updatedFlow: Flow = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        project_id: response.project_id,
        section_id: response.section_id,
        status: response.status,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        flows: state.flows.map(f => f.$id === id ? updatedFlow : f),
        currentFlow: state.currentFlow?.$id === id ? updatedFlow : state.currentFlow,
        loading: { isLoading: false, error: null }
      }))

      return updatedFlow
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al actualizar flow'
        }
      }))
      throw error
    }
  },

  deleteFlow: async (id) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        id
      )

      set((state) => ({
        flows: state.flows.filter(f => f.$id !== id),
        currentFlow: state.currentFlow?.$id === id ? null : state.currentFlow,
        loading: { isLoading: false, error: null }
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al eliminar flow'
        }
      }))
      throw error
    }
  },

  setCurrentFlow: (flow) => {
    set({ currentFlow: flow })
  }
})
