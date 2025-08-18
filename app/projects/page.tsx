'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FolderOpen } from 'lucide-react'
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite'
import { Project } from '@/types'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    try {
      if (typeof performance !== 'undefined' && (performance as any).mark) {
        performance.mark('projects_page_mount')
      }
    } catch {}
    const t0 = (typeof performance !== 'undefined' && (performance as any).now)
      ? performance.now()
      : Date.now()

    fetchProjects().finally(() => {
      const t1 = (typeof performance !== 'undefined' && (performance as any).now)
        ? performance.now()
        : Date.now()
      const dur = t1 - t0
      try {
        if (typeof performance !== 'undefined' && (performance as any).measure) {
          performance.measure('projects_time_to_data', 'projects_page_mount')
        }
      } catch {}
      console.log(`[Perf] ProjectsPage data loaded in ${dur.toFixed(1)}ms`)
    })
  }, [])

  const fetchProjects = async () => {
    const label = '[Projects] fetchProjects'
    console.time?.(label)
    const t0 = (typeof performance !== 'undefined' && (performance as any).now)
      ? performance.now()
      : Date.now()
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        [Query.orderDesc('$updatedAt')] // orden en servidor
      )
      
      setProjects(response.documents as unknown as Project[])
      const t1 = (typeof performance !== 'undefined' && (performance as any).now)
        ? performance.now()
        : Date.now()
      console.log(`[Perf] Projects: fetched ${response.documents.length} projects in ${(t1 - t0).toFixed(1)}ms`)
    } catch (error) {
      toast.error('Failed to fetch projects')
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
      console.timeEnd?.(label)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const newProject = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        ID.unique(),
        {
          name: formData.name.trim(),
          description: formData.description.trim()
        }
      )

      setProjects([newProject as unknown as Project, ...projects])
      setFormData({ name: '', description: '' })
      setIsDialogOpen(false)
      toast.success('Project created successfully')
    } catch (error) {
      toast.error('Failed to create project')
      console.error('Error creating project:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600 mt-2">
              Manage your documentation projects and user flows
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to organize your documentation flows.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter project description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Project</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Projects Yet</h2>
            <p className="text-slate-500 mb-6">
              Create your first project to start documenting your user flows.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.$id} href={`/projects/${project.$id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-500">
                      Created {new Date(project.$createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}