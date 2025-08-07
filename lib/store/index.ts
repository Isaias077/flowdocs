import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { AppStore } from './types'
import { createProjectSlice } from './project-actions'
import { createFlowSlice } from './flow-actions'
import { createStepSlice } from './step-actions'
import { createSectionSlice } from './section-actions'
import { createChangeLogSlice } from './changelog-actions'

// Crear el store principal combinando todos los slices
export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createFlowSlice(...a),
      ...createStepSlice(...a),
      ...createSectionSlice(...a),
      ...createChangeLogSlice(...a)
    }),
    {
      name: 'flowdocs-store'
    }
  )
)

// Exportar tipos para uso en componentes
export type { AppStore } from './types'

// Selectores útiles para optimizar re-renders
export const useProjects = () => useAppStore((state) => state.projects)
export const useCurrentProject = () => useAppStore((state) => state.currentProject)
export const useProjectsLoading = () => useAppStore((state) => state.loading)

export const useFlows = () => useAppStore((state) => state.flows)
export const useCurrentFlow = () => useAppStore((state) => state.currentFlow)
export const useFlowsLoading = () => useAppStore((state) => state.loading)

export const useSteps = () => useAppStore((state) => state.steps)
export const useStepsLoading = () => useAppStore((state) => state.loading)

export const useSections = () => useAppStore((state) => state.sections)
export const useSectionsLoading = () => useAppStore((state) => state.loading)

export const useChangeLogs = () => useAppStore((state) => state.changeLogs)
export const useChangeLogsLoading = () => useAppStore((state) => state.loading)

// Selectores de acciones con useShallow para evitar re-renders innecesarios
export const useProjectActions = () => useAppStore(
  useShallow((state) => ({
    fetchProjects: state.fetchProjects,
    createProject: state.createProject,
    updateProject: state.updateProject,
    deleteProject: state.deleteProject,
    setCurrentProject: state.setCurrentProject
  }))
)

export const useFlowActions = () => useAppStore(
  useShallow((state) => ({
    fetchFlows: state.fetchFlows,
    createFlow: state.createFlow,
    updateFlow: state.updateFlow,
    deleteFlow: state.deleteFlow,
    setCurrentFlow: state.setCurrentFlow
  }))
)

export const useStepActions = () => useAppStore(
  useShallow((state) => ({
    fetchSteps: state.fetchSteps,
    createStep: state.createStep,
    updateStep: state.updateStep,
    deleteStep: state.deleteStep
  }))
)

export const useSectionActions = () => useAppStore(
  useShallow((state) => ({
    fetchSections: state.fetchSections,
    createSection: state.createSection,
    updateSection: state.updateSection,
    deleteSection: state.deleteSection
  }))
)

export const useChangeLogActions = () => useAppStore(
  useShallow((state) => ({
    fetchChangeLogs: state.fetchChangeLogs,
    createChangeLog: state.createChangeLog
  }))
)