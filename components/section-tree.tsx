'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Edit2, Trash2, GitBranch } from 'lucide-react'
import { Section, Flow } from '@/types'
import { FlowCard } from './flow-card'
import { databases, DATABASE_ID, COLLECTIONS, ID } from '@/lib/appwrite'
import { toast } from 'sonner'

interface SectionTreeProps {
  sections: Section[]
  flows: Flow[]
  projectId: string
  onSectionUpdate: (section: Section) => void
  onSectionDelete: (sectionId: string) => void
  onSectionCreate: (section: Section) => void
  onFlowUpdate: (flow: Flow) => void
  onFlowDelete: (flowId: string) => void
  onFlowCreate: (flow: Flow) => void
}

interface SectionNodeProps {
  section: Section
  subsections: Section[]
  flows: Flow[]
  projectId: string
  level: number
  onSectionUpdate: (section: Section) => void
  onSectionDelete: (sectionId: string) => void
  onSectionCreate: (section: Section) => void
  onFlowUpdate: (flow: Flow) => void
  onFlowDelete: (flowId: string) => void
  onFlowCreate: (flow: Flow) => void
}

function SectionNode({ 
  section, 
  subsections, 
  flows, 
  projectId, 
  level,
  onSectionUpdate,
  onSectionDelete,
  onSectionCreate,
  onFlowUpdate,
  onFlowDelete,
  onFlowCreate
}: SectionNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubsectionDialogOpen, setIsSubsectionDialogOpen] = useState(false)
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: section.name,
    description: section.description
  })
  const [subsectionFormData, setSubsectionFormData] = useState({
    name: '',
    description: ''
  })
  const [flowFormData, setFlowFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as Flow['status']
  })

  const sectionFlows = flows.filter(flow => flow.section_id === section.$id)
  const childSections = subsections.filter(sub => sub.parent_section_id === section.$id)

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editFormData.name.trim()) {
      toast.error('Section name is required')
      return
    }

    try {
      const updatedSection: unknown = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        section.$id,
        {
          name: editFormData.name.trim(),
          description: editFormData.description.trim()
        }
      )

      onSectionUpdate(updatedSection as unknown as Section)
      setIsEditDialogOpen(false)
      toast.success('Section updated successfully')
    } catch (error) {
      toast.error('Failed to update section')
      console.error('Error updating section:', error)
    }
  }

  const handleCreateSubsection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subsectionFormData.name.trim()) {
      toast.error('Subsection name is required')
      return
    }

    try {
      const nextOrder = Math.max(...subsections.map(s => s.order), 0) + 1

      const newSection: unknown = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        ID.unique(),
        {
          name: subsectionFormData.name.trim(),
          description: subsectionFormData.description.trim(),
          project_id: projectId,
          parent_section_id: section.$id,
          order: nextOrder
        }
      )

      onSectionCreate(newSection as unknown as Section)
      setSubsectionFormData({ name: '', description: '' })
      setIsSubsectionDialogOpen(false)
      toast.success('Subsection created successfully')
    } catch (error) {
      toast.error('Failed to create subsection')
      console.error('Error creating subsection:', error)
    }
  }

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!flowFormData.name.trim()) {
      toast.error('Flow name is required')
      return
    }

    try {
      const newFlow: unknown = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        ID.unique(),
        {
          name: flowFormData.name.trim(),
          description: flowFormData.description.trim(),
          project_id: projectId,
          section_id: section.$id,
          status: flowFormData.status
        }
      )

      onFlowCreate(newFlow as unknown as Flow)
      setFlowFormData({ name: '', description: '', status: 'draft' })
      setIsFlowDialogOpen(false)
      toast.success('Flow created successfully')
    } catch (error) {
      toast.error('Failed to create flow')
      console.error('Error creating flow:', error)
    }
  }

  const handleDeleteSection = async () => {
    try {
      // First, get all subsections that will be deleted (including nested ones)
      const getAllSubsectionIds = (sectionId: string, allSections: Section[]): string[] => {
        const directChildren = allSections.filter(s => s.parent_section_id === sectionId)
        let allIds = [sectionId]
        
        for (const child of directChildren) {
          allIds = allIds.concat(getAllSubsectionIds(child.$id, allSections))
        }
        
        return allIds
      }

      const allSectionIdsToDelete = getAllSubsectionIds(section.$id, subsections)
      
      // Delete all flows in these sections first
      const flowsToDelete = flows.filter(flow => 
        flow.section_id && allSectionIdsToDelete.includes(flow.section_id)
      )
      
      // Delete flows first
      for (const flow of flowsToDelete) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.FLOWS,
          flow.$id
        )
      }

      // Delete subsections (in reverse order to handle nested sections)
      const sectionsToDelete = allSectionIdsToDelete.filter(id => id !== section.$id)
      for (const sectionId of sectionsToDelete.reverse()) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.SECTIONS,
          sectionId
        )
      }

      // Finally delete the main section
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SECTIONS,
        section.$id
      )

      onSectionDelete(section.$id)
      
      const deletedFlowsCount = flowsToDelete.length
      const deletedSubsectionsCount = allSectionIdsToDelete.length - 1 // Exclude the main section
      
      let message = 'Section deleted successfully'
      if (deletedFlowsCount > 0 || deletedSubsectionsCount > 0) {
        const parts = []
        if (deletedSubsectionsCount > 0) {
          parts.push(`${deletedSubsectionsCount} subsection${deletedSubsectionsCount > 1 ? 's' : ''}`)
        }
        if (deletedFlowsCount > 0) {
          parts.push(`${deletedFlowsCount} flow${deletedFlowsCount > 1 ? 's' : ''}`)
        }
        message += ` (including ${parts.join(' and ')})`
      }
      
      toast.success(message)
    } catch (error) {
      toast.error('Failed to delete section')
      console.error('Error deleting section:', error)
    }
  }

  const openEditDialog = () => {
    setEditFormData({
      name: section.name,
      description: section.description
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className={`${level > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''}`}>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex-1">
              <CollapsibleTrigger className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-md -m-2">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {isOpen ? <FolderOpen className="w-5 h-5 text-amber-600" /> : <Folder className="w-5 h-5 text-amber-600" />}
                <CardTitle className="text-lg">{section.name}</CardTitle>
              </CollapsibleTrigger>
            </Collapsible>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFlowDialogOpen(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <GitBranch className="w-4 h-4 mr-1" />
                Add Flow
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openEditDialog}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Section
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSubsectionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subsection
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Section
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{section.name}"? This will permanently delete the section, all its subsections, and flows. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSection} className="bg-red-600 hover:bg-red-700">
                          Delete Section
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {section.description && (
            <p className="text-sm text-slate-600 mt-2">{section.description}</p>
          )}
        </CardHeader>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Flows in this section */}
              {sectionFlows.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Flows</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sectionFlows.map((flow) => (
                      <FlowCard
                        key={flow.$id}
                        flow={flow}
                        projectId={projectId}
                        onUpdate={onFlowUpdate}
                        onDelete={onFlowDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Subsections */}
              {childSections.map((childSection) => (
                <SectionNode
                  key={childSection.$id}
                  section={childSection}
                  subsections={subsections}
                  flows={flows}
                  projectId={projectId}
                  level={level + 1}
                  onSectionUpdate={onSectionUpdate}
                  onSectionDelete={onSectionDelete}
                  onSectionCreate={onSectionCreate}
                  onFlowUpdate={onFlowUpdate}
                  onFlowDelete={onFlowDelete}
                  onFlowCreate={onFlowCreate}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSection}>
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update the section name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section-name">Section Name</Label>
                <Input
                  id="edit-section-name"
                  placeholder="Enter section name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section-description">Description</Label>
                <Textarea
                  id="edit-section-description"
                  placeholder="Enter section description (optional)"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Subsection Dialog */}
      <Dialog open={isSubsectionDialogOpen} onOpenChange={setIsSubsectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubsection}>
            <DialogHeader>
              <DialogTitle>Create Subsection</DialogTitle>
              <DialogDescription>
                Add a new subsection under "{section.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subsection-name">Subsection Name</Label>
                <Input
                  id="subsection-name"
                  placeholder="Enter subsection name"
                  value={subsectionFormData.name}
                  onChange={(e) => setSubsectionFormData({ ...subsectionFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subsection-description">Description</Label>
                <Textarea
                  id="subsection-description"
                  placeholder="Enter subsection description (optional)"
                  value={subsectionFormData.description}
                  onChange={(e) => setSubsectionFormData({ ...subsectionFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSubsectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Subsection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Flow Dialog */}
      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFlow}>
            <DialogHeader>
              <DialogTitle>Create Flow in Section</DialogTitle>
              <DialogDescription>
                Add a new flow to "{section.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input
                  id="flow-name"
                  placeholder="Enter flow name"
                  value={flowFormData.name}
                  onChange={(e) => setFlowFormData({ ...flowFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-description">Description</Label>
                <Textarea
                  id="flow-description"
                  placeholder="Enter flow description (optional)"
                  value={flowFormData.description}
                  onChange={(e) => setFlowFormData({ ...flowFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-status">Status</Label>
                <Select value={flowFormData.status} onValueChange={(value: Flow['status']) => setFlowFormData({ ...flowFormData, status: value })}>
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
              <Button type="button" variant="outline" onClick={() => setIsFlowDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Flow</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SectionTree({ 
  sections, 
  flows, 
  projectId, 
  onSectionUpdate, 
  onSectionDelete, 
  onSectionCreate,
  onFlowUpdate,
  onFlowDelete,
  onFlowCreate
}: SectionTreeProps) {
  const topLevelSections = sections.filter(section => !section.parent_section_id)

  return (
    <div className="space-y-4">
      {topLevelSections.map((section) => (
        <SectionNode
          key={section.$id}
          section={section}
          subsections={sections}
          flows={flows}
          projectId={projectId}
          level={0}
          onSectionUpdate={onSectionUpdate}
          onSectionDelete={onSectionDelete}
          onSectionCreate={onSectionCreate}
          onFlowUpdate={onFlowUpdate}
          onFlowDelete={onFlowDelete}
          onFlowCreate={onFlowCreate}
        />
      ))}
    </div>
  )
}