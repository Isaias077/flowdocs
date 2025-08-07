import { StateCreator } from 'zustand'
import { databases, ID, COLLECTIONS, DATABASE_ID } from '../appwrite'
import type { Project } from '../../types'
import type { AppStore, ProjectState, ProjectActions } from './types'

export const createProjectSlice: StateCreator<
  AppStore,
  [],
  [],
  ProjectState & ProjectActions
> = (set, get) => ({
  // Estado inicial
  projects: [],
  currentProject: null,
  loading: {
    isLoading: false,
    error: null
  },

  // Acciones
  fetchProjects: async () => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROJECTS
      )
      
      const projects = response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name,
        description: doc.description,
        documentation_links: doc.documentation_links,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      })) as Project[]

      set({
        projects,
        loading: { isLoading: false, error: null }
      })
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al cargar proyectos'
        }
      }))
    }
  },

  createProject: async (projectData) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response: any = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        ID.unique(),
        projectData
      )

      const newProject: Project = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        documentation_links: response.documentation_links,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        projects: [...state.projects, newProject],
        loading: { isLoading: false, error: null }
      }))

      return newProject
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al crear proyecto'
        }
      }))
      throw error
    }
  },

  updateProject: async (id, updates) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        id,
        {
          name: updates.name,
          description: updates.description,
          documentation_links: updates.documentation_links
        }
      )

      const updatedProject: Project = {
        $id: response.$id,
        name: response.name,
        description: response.description,
        documentation_links: response.documentation_links,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      }

      set((state) => ({
        projects: state.projects.map(p => p.$id === id ? updatedProject : p),
        currentProject: state.currentProject?.$id === id ? updatedProject : state.currentProject,
        loading: { isLoading: false, error: null }
      }))
      
      return updatedProject
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al actualizar proyecto'
        }
      }))
      throw error
    }
  },

  deleteProject: async (id) => {
    set((state) => ({
      loading: { ...state.loading, isLoading: true, error: null }
    }))

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        id
      )

      set((state) => ({
        projects: state.projects.filter(p => p.$id !== id),
        currentProject: state.currentProject?.$id === id ? null : state.currentProject,
        loading: { isLoading: false, error: null }
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error al eliminar proyecto'
        }
      }))
      throw error
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
  }
})
