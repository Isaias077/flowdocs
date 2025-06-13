'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { Flow } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface FlowActionsProps {
  flow: Flow
  projectId: string
  onUpdate: (flow: Flow) => void
}

export function FlowActions({ flow, projectId, onUpdate }: FlowActionsProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: flow.name,
    description: flow.description
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

      toast.success('Flow deleted successfully')
      router.push(`/projects/${projectId}`)
    } catch (error) {
      toast.error('Failed to delete flow')
      console.error('Error deleting flow:', error)
    }
  }

  const openEditDialog = () => {
    setFormData({
      name: flow.name,
      description: flow.description
    })
    setIsEditDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEditDialog}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Flow
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Flow
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{flow.name}"? This will permanently delete the flow and all its steps. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete Flow
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

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