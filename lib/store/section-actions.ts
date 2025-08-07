import { StateCreator } from 'zustand'
import { databases, ID, COLLECTIONS, DATABASE_ID, Query } from '../appwrite'
import type { Section } from '../../types'
import type { AppStore, SectionState, SectionActions } from './types'

export const createSectionSlice: StateCreator<
  AppStore,
  [],
  [],
  SectionState & SectionActions
> = (set, get) => ({
  // Estado inicial
  sections: [],
  loading: {
    isLoading: false,
    error: null
  },

  // Acciones
  fetchSections: async (projectId) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const queries = projectId ? [Query.equal('project_id', projectId)] : []
      
      const response: any = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        queries
      )
      
      const sections = response.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        description: doc.description,
        project_id: doc.project_id,
        parent_section_id: doc.parent_section_id,
        order: doc.order,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      })) as Section[]

      set({
        sections,
        loading: { isLoading: false, error: null }
      })
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al cargar secciones'
        }
      }))
    }
  },

  createSection: async (sectionData) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response: any = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        ID.unique(),
        sectionData
      )

      const newSection: Section = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        project_id: response.project_id,
        parent_section_id: response.parent_section_id,
        order: response.order,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        sections: [...state.sections, newSection],
        loading: { isLoading: false, error: null }
      }))

      return newSection
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al crear sección'
        }
      }))
      throw error
    }
  },

  updateSection: async (id, updates) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        id,
        {
          name: updates.name,
          description: updates.description,
          project_id: updates.project_id,
          parent_section_id: updates.parent_section_id,
          order: updates.order
        }
      )

      const updatedSection: Section = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        project_id: response.project_id,
        parent_section_id: response.parent_section_id,
        order: response.order,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        sections: state.sections.map(s => s.$id === id ? updatedSection : s),
        loading: { isLoading: false, error: null }
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al actualizar sección'
        }
      }))
      throw error
    }
  },

  deleteSection: async (id) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        id
      )

      set((state) => ({
        sections: state.sections.filter(s => s.$id !== id),
        loading: { isLoading: false, error: null }
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al eliminar sección'
        }
      }))
      throw error
    }
  }
})