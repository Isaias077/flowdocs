'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, GitBranch, ArrowLeft, Search, Filter } from 'lucide-react'
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite'
import { Project, Flow, Section } from '@/types'
import { toast } from 'sonner'
import { EditableTitle } from '@/components/editable-title'
import { DocumentationModal } from '@/components/documentation-modal'
import { ProjectActions } from '@/components/project-actions'
import { FlowCard } from '@/components/flow-card'
import { SortableSectionTree } from '@/components/sortable-section-tree'
import ProjectSyncButton from '@/components/project-sync-button'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [flows, setFlows] = useState<Flow[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as Flow['status']
  })
  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (projectId) {
      fetchProjectAndFlows()
    }
  }, [projectId])

  const fetchProjectAndFlows = async () => {
    try {
      // Fetch project
      const projectData = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        projectId
      )
      setProject(projectData as unknown as Project)

      // Fetch flows
      const flowsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        [
          Query.equal('project_id', projectId),
          Query.orderDesc('$updatedAt')
        ]
      )
      setFlows(flowsResponse.documents as unknown as Flow[])

      // Fetch sections
      const sectionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        [
          Query.equal('project_id', projectId),
          Query.orderAsc('order')
        ]
      )
      setSections(sectionsResponse.documents as unknown as Section[])
    } catch (error) {
      toast.error('Failed to fetch project data')
      console.error('Error fetching project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Flow name is required')
      return
    }

    try {
      const newFlow = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        ID.unique(),
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          project_id: projectId,
          status: formData.status
        }
      )

      setFlows([newFlow as unknown as Flow, ...flows])
      setFormData({ name: '', description: '', status: 'draft' })
      setIsDialogOpen(false)
      toast.success('Flow created successfully')
    } catch (error) {
      toast.error('Failed to create flow')
      console.error('Error creating flow:', error)
    }
  }

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sectionFormData.name.trim()) {
      toast.error('Section name is required')
      return
    }

    try {
      const nextOrder = Math.max(...sections.map(s => s.order), 0) + 1

      const newSection = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        ID.unique(),
        {
          name: sectionFormData.name.trim(),
          description: sectionFormData.description.trim(),
          project_id: projectId,
          order: nextOrder
        }
      )

      setSections([...sections, newSection as unknown as Section])
      setSectionFormData({ name: '', description: '' })
      setIsSectionDialogOpen(false)
      toast.success('Section created successfully')
    } catch (error) {
      toast.error('Failed to create section')
      console.error('Error creating section:', error)
    }
  }

  const handleProjectNameUpdate = async (newName: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROJECTS,
        projectId,
        {
          name: newName
        }
      )

      setProject(prev => prev ? { ...prev, name: newName } : null)
      toast.success('Project name updated')
    } catch (error) {
      toast.error('Failed to update project name')
      console.error('Error updating project name:', error)
      throw error
    }
  }

  const handleDocumentationUpdate = (newLinks: string) => {
    setProject(prev => prev ? { ...prev, documentation_links: newLinks } : null)
  }

  const handleSectionUpdate = (updatedSection: Section) => {
    setSections(sections.map(s => s.$id === updatedSection.$id ? updatedSection : s))
  }

  const handleSectionDelete = (sectionId: string) => {
    // Get all subsection IDs that will be deleted
    const getAllSubsectionIds = (sectionId: string, allSections: Section[]): string[] => {
      const directChildren = allSections.filter(s => s.parent_section_id === sectionId)
      let allIds = [sectionId]
      
      for (const child of directChildren) {
        allIds = allIds.concat(getAllSubsectionIds(child.$id, allSections))
      }
      
      return allIds
    }

    const allSectionIdsToDelete = getAllSubsectionIds(sectionId, sections)
    
    // Remove all sections and subsections
    setSections(sections.filter(s => s.$id !== sectionId))
    
    // Remove all flows that were in any of the deleted sections
    setFlows(flows.filter(f => !f.section_id || !allSectionIdsToDelete.includes(f.section_id)))
  }

  const handleSectionCreate = (newSection: Section) => {
    setSections([...sections, newSection])
  }

  const handleFlowUpdate = (updatedFlow: Flow) => {
    setFlows(flows.map(f => f.$id === updatedFlow.$id ? updatedFlow : f))
  }

  const handleFlowDelete = (flowId: string) => {
    setFlows(flows.filter(f => f.$id !== flowId))
  }

  const handleFlowCreate = (newFlow: Flow) => {
    setFlows([newFlow, ...flows])
  }

  const handleSectionsReorder = (reorderedSections: Section[]) => {
    setSections(reorderedSections)
  }

  // Filter flows based on search query and status
  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || flow.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Project Not Found</h1>
          <p className="text-slate-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <EditableTitle
              title={project.name}
              onSave={handleProjectNameUpdate}
              className="text-3xl font-bold text-slate-900"
              placeholder="Enter project name"
            />
            {project.description && (
              <p className="text-slate-600 mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <ProjectSyncButton 
              projectId={projectId} 
              showText={true}
              variant="outline"
            />
            <DocumentationModal
              projectId={projectId}
              documentationLinks={project.documentation_links || '[]'}
              onUpdate={handleDocumentationUpdate}
            />
            <ProjectActions
              project={project}
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Section
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Flow
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Flow</DialogTitle>
                <DialogDescription>
                  Add a new user flow to this project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Flow Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter flow name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter flow description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Flow['status']) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Flow</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSectionSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
                <DialogDescription>
                  Add a new section to organize your flows.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="section-name">Section Name</Label>
                  <Input
                    id="section-name"
                    placeholder="Enter section name"
                    value={sectionFormData.name}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-description">Description</Label>
                  <Textarea
                    id="section-description"
                    placeholder="Enter section description (optional)"
                    value={sectionFormData.description}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Section</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {sections.length === 0 && flows.length === 0 ? (
          <div className="text-center py-16">
            <GitBranch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Content Yet</h2>
            <p className="text-slate-500 mb-6">
              Create sections to organize your flows or add flows directly.
            </p>
            <div className="flex gap-3 justify-center">
              <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Section
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flow
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search and Filter Controls */}
            {(sections.length > 0 || flows.length > 0) && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search flows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Sections</h2>
                <SortableSectionTree
                  sections={sections}
                  flows={filteredFlows}
                  projectId={projectId}
                  onSectionUpdate={handleSectionUpdate}
                  onSectionDelete={handleSectionDelete}
                  onSectionCreate={handleSectionCreate}
                  onFlowUpdate={handleFlowUpdate}
                  onFlowDelete={handleFlowDelete}
                  onFlowCreate={handleFlowCreate}
                  onSectionsReorder={handleSectionsReorder}
                />
              </div>
            )}

            {/* Flows not in sections */}
            {filteredFlows.filter(flow => !flow.section_id).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {sections.length > 0 ? 'Other Flows' : 'Flows'}
                  </h2>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Flow Here
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFlows.filter(flow => !flow.section_id).map((flow) => (
                    <FlowCard
                      key={flow.$id}
                      flow={flow}
                      projectId={projectId}
                      sections={sections}
                      onUpdate={handleFlowUpdate}
                      onDelete={handleFlowDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}