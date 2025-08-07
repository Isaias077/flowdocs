import { StateCreator } from 'zustand'
import { databases, ID, COLLECTIONS, DATABASE_ID, Query } from '../appwrite'
import type { Step } from '../../types'
import type { AppStore, StepState, StepActions } from './types'

export const createStepSlice: StateCreator<
  AppStore,
  [],
  [],
  StepState & StepActions
> = (set, get) => ({
  // Estado inicial
  steps: [],
  loading: {
    isLoading: false,
    error: null
  },

  // Acciones
  fetchSteps: async (flowId) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const queries = flowId ? [Query.equal('flow_id', flowId)] : []
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        queries
      )
      
      const steps = response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name,
        description: doc.description,
        flow_id: doc.flow_id,
        microservice: doc.microservice,
        order: doc.order,
        functional_description: doc.functional_description,
        links: doc.links,
        bdd_cases: doc.bdd_cases,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      })) as Step[]

      set({
        steps,
        loading: { isLoading: false, error: null }
      })
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al cargar steps'
        }
      }))
    }
  },

  createStep: async (stepData) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response: any = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        ID.unique(),
        stepData
      )

      const newStep: Step = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        flow_id: response.flow_id,
        microservice: response.microservice,
        order: response.order,
        functional_description: response.functional_description,
        links: response.links,
        bdd_cases: response.bdd_cases,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        steps: [...state.steps, newStep],
        loading: { isLoading: false, error: null }
      }))

      return newStep
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al crear step'
        }
      }))
      throw error
    }
  },

  updateStep: async (id, updates) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        id,
        {
          name: updates.name,
          description: updates.description,
          flow_id: updates.flow_id,
          microservice: updates.microservice,
          order: updates.order,
          functional_description: updates.functional_description,
          links: updates.links,
          bdd_cases: updates.bdd_cases
        }
      )

      const updatedStep: Step = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        flow_id: response.flow_id,
        microservice: response.microservice,
        order: response.order,
        functional_description: response.functional_description,
        links: response.links,
        bdd_cases: response.bdd_cases,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        steps: state.steps.map(s => s.$id === id ? updatedStep : s),
        loading: { isLoading: false, error: null }
      }))
      return updatedStep;
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al actualizar step'
        }
      }))
      throw error
    }
  },

  deleteStep: async (id) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        id
      )

      set((state) => ({
        steps: state.steps.filter(s => s.$id !== id),
        loading: { isLoading: false, error: null }
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al eliminar step'
        }
      }))
      throw error
    }
  }
})
