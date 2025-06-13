import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://nppihrcktggshousbquw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcGlocmNrdGdnc2hvdXNicXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczOTM3MTgsImV4cCI6MjA1Mjk2OTcxOH0.N3l_My8D9cPGdln6zjZTwfSD8u-JwXMMNHVxECFI4mQ"

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string
          documentation_links: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          documentation_links?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          documentation_links?: string
          created_at?: string
          updated_at?: string
        }
      }
      flows: {
        Row: {
          id: string
          name: string
          description: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          project_id: string
          section_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          project_id?: string
          section_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          name: string
          description: string
          project_id: string
          parent_section_id: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          project_id: string
          parent_section_id?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          project_id?: string
          parent_section_id?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      steps: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          description: string
          flow_id: string
          microservice: string
          order: number
          functional_description: string
          links?: string
          bdd_cases?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          flow_id?: string
          microservice?: string
          order?: number
          functional_description?: string
          links?: string
          bdd_cases?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}