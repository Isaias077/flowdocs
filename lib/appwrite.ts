import { Client, Databases, ID, Query } from 'appwrite'

const appwriteUrl = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6885c6280034f3eb8432'
const appwriteDatabaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '688668c400181ad37226'

const client = new Client()
  .setEndpoint(appwriteUrl)
  .setProject(appwriteProjectId)

export const databases = new Databases(client)
export { ID, Query }
export const DATABASE_ID = appwriteDatabaseId

// Collection IDs
export const COLLECTIONS = {
  PROJECTS: '68866b70001252bec5ac',
  FLOWS: '68866bc50026c708b251',
  SECTIONS: '68866c4c000b18d9e454',
  STEPS: '68866da8002a5a5eeb2a',
  FLOW_CHANGELOG: '68870aa100009524946c' // Reemplazar con el ID real de AppWrite
} as const

// Export individual collection IDs for backward compatibility
export const FLOW_CHANGELOG_COLLECTION_ID = COLLECTIONS.FLOW_CHANGELOG

// AppWrite Document Types
export interface AppwriteDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  $collectionId: string
  $databaseId: string
}

export interface ProjectDocument extends AppwriteDocument {
  name: string
  description: string
  documentation_links: string
}

export interface FlowDocument extends AppwriteDocument {
  name: string
  description: string
  project_id: string
  section_id?: string | null
  status: 'draft' | 'in-progress' | 'review' | 'approved' | 'completed' | 'archived'
}

export interface SectionDocument extends AppwriteDocument {
  name: string
  description: string
  project_id: string
  parent_section_id?: string | null
  order: number
}

export interface StepDocument extends AppwriteDocument {
  name: string
  description: string
  flow_id: string
  microservice: string
  order: number
  functional_description: string
  links: string
  bdd_cases: string
}

export interface FlowChangeLogDocument extends AppwriteDocument {
  flow_id: string
  step_id?: string | null
  change_type: 'step_created' | 'step_updated' | 'step_deleted' | 'flow_updated'
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  description: string
  user_id?: string | null
}