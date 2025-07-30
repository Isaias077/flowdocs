export interface Project {
  $id: string
  name: string
  description: string
  documentation_links: string
  $createdAt: string
  $updatedAt: string
}

export interface Flow {
  $id: string
  name: string
  description: string
  project_id: string
  section_id: string | null
  status: 'draft' | 'in-progress' | 'review' | 'approved' | 'completed' | 'archived'
  $createdAt: string
  $updatedAt: string
}

export interface Step {
  $id: string
  name: string
  description: string
  flow_id: string
  microservice: string
  order: number
  functional_description: string
  links: string
  bdd_cases: string
  $createdAt: string
  $updatedAt: string
}

export interface Link {
  type: 'docs' | 'pr' | 'bdd' | 'other'
  url: string
  title: string
}

export interface DocumentationLink {
  type: 'api' | 'architecture' | 'requirements' | 'deployment' | 'other'
  url: string
  title: string
  description?: string
}

export interface Section {
  $id: string
  name: string
  description: string
  project_id: string
  parent_section_id: string | null
  order: number
  $createdAt: string
  $updatedAt: string
}

export interface FlowChangeLog {
  $id: string
  flow_id: string
  step_id: string | null
  change_type: 'step_created' | 'step_updated' | 'step_deleted' | 'flow_updated'
  field_name: string | null
  old_value: string | null
  new_value: string | null
  description: string
  user_id: string | null
  $createdAt: string
  $updatedAt: string
}