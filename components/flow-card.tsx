'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { GitBranch, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { Flow, Section } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface FlowCardProps {
  flow: Flow
  projectId: string
  sections?: Section[]
  onUpdate: (flow: Flow) => void
  onDelete: (flowId: string) => void
}

export function FlowCard({ flow, projectId, sections = [], onUpdate, onDelete }: FlowCardProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: flow.name,
    description: flow.description,
    section_id: flow.section_id || '',
    status: flow.status
  })

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Flow name is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('flows')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          section_id: formData.section_id || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', flow.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data)
      setIsEditDialogOpen(false)
      toast.success('Flow updated successfully')
    } catch (error) {
      toast.error('Failed to update flow')
      console.error('Error updating flow:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flow.id)

      if (error) throw error

      onDelete(flow.id)
      toast.success('Flow deleted successfully')
    } catch (error) {
      toast.error('Failed to delete flow')
      console.error('Error deleting flow:', error)
    }
  }

  const openEditDialog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFormData({
      name: flow.name,
      description: flow.description,
      section_id: flow.section_id || '',
      status: flow.status
    })
    setIsEditDialogOpen(true)
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const getStatusColor = (status: Flow['status']) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'review': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-700 border-green-200'
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusLabel = (status: Flow['status']) => {
    switch (status) {
      case 'in-progress': return 'In Progress'
      case 'review': return 'Review'
      case 'approved': return 'Approved'
      case 'completed': return 'Completed'
      case 'archived': return 'Archived'
      default: return 'Draft'
    }
  }

  return (
    <>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-slate-200 group relative">
        <Link href={`/projects/${projectId}/flows/${flow.id}`} className="block h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg flex items-center gap-2 flex-1">
                <GitBranch className="w-5 h-5 text-blue-600" />
                {flow.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDropdownClick}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={openEditDialog}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Flow
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Flow
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{flow.name}"? This will permanently delete the flow and all its steps. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete()
                          }} 
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Flow
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getStatusColor(flow.status)}>
                {getStatusLabel(flow.status)}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {flow.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">
              Updated {new Date(flow.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Link>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Flow</DialogTitle>
              <DialogDescription>
                Update the flow name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-flow-name">Flow Name</Label>
                <Input
                  id="edit-flow-name"
                  placeholder="Enter flow name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-flow-description">Description</Label>
                <Textarea
                  id="edit-flow-description"
                  placeholder="Enter flow description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-flow-status">Status</Label>
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
              {sections.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="edit-flow-section">Section</Label>
                  <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No section</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
    </>
  )
}