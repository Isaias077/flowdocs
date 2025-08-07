import type { Project, Flow, Step, Section, FlowChangeLog } from '../../types'

// Estado de carga
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Estado del store para proyectos
export interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: LoadingState
}

// Estado del store para flows
export interface FlowState {
  flows: Flow[]
  currentFlow: Flow | null
  loading: LoadingState
}

// Estado del store para steps
export interface StepState {
  steps: Step[]
  loading: LoadingState
}

// Estado del store para sections
export interface SectionState {
  sections: Section[]
  loading: LoadingState
}

// Estado del store para changelog
export interface ChangeLogState {
  changeLogs: FlowChangeLog[]
  loading: LoadingState
}

// Acciones para proyectos
export interface ProjectActions {
  fetchProjects: () => Promise<void>
  createProject: (project: Omit<Project, '$id' | '$createdAt' | '$updatedAt'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

// Acciones para flows
export interface FlowActions {
  fetchFlows: (projectId?: string) => Promise<void>
  createFlow: (flow: Omit<Flow, '$id' | '$createdAt' | '$updatedAt'>) => Promise<Flow>
  updateFlow: (id: string, updates: Partial<Flow>) => Promise<Flow>
  deleteFlow: (id: string) => Promise<void>
  setCurrentFlow: (flow: Flow | null) => void
}

// Acciones para steps
export interface StepActions {
  fetchSteps: (flowId?: string) => Promise<void>
  createStep: (step: Omit<Step, '$id' | '$createdAt' | '$updatedAt'>) => Promise<Step>
  updateStep: (id: string, updates: Partial<Step>) => Promise<Step>
  deleteStep: (id: string) => Promise<void>
}

// Acciones para sections
export interface SectionActions {
  fetchSections: (projectId?: string) => Promise<void>
  createSection: (section: Omit<Section, '$id' | '$createdAt' | '$updatedAt'>) => Promise<Section>
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>
  deleteSection: (id: string) => Promise<void>
}

// Acciones para changelog
export interface ChangeLogActions {
  fetchChangeLogs: (flowId?: string) => Promise<void>
  createChangeLog: (changeLog: Omit<FlowChangeLog, '$id' | '$createdAt' | '$updatedAt'>) => Promise<FlowChangeLog>
}

// Store completo
export interface AppStore extends 
  ProjectState,
  FlowState,
  StepState,
  SectionState,
  ChangeLogState,
  ProjectActions,
  FlowActions,
  StepActions,
  SectionActions,
  ChangeLogActions {}