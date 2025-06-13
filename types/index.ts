export interface Project {
  id: string
  name: string
  description: string
  documentation_links: string
  created_at: string
  updated_at: string
}

export interface Flow {
  id: string
  name: string
  description: string
  project_id: string
  section_id: string | null
  status: 'draft' | 'in-progress' | 'review' | 'approved' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface Step {
  id: string
  name: string
  description: string
  flow_id: string
  microservice: string
  order: number
  functional_description: string
  links: string
  bdd_cases: string
  created_at: string
  updated_at: string
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
  id: string
  name: string
  description: string
  project_id: string
  parent_section_id: string | null
  order: number
  created_at: string
  updated_at: string
}