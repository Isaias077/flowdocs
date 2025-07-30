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
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
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
      const updatedFlow: unknown = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        flow.$id,
        {
          name: formData.name.trim(),
          description: formData.description.trim()
        }
      )

      onUpdate(updatedFlow as unknown as Flow)
      setIsEditDialogOpen(false)
      toast.success('Flow updated successfully')
    } catch (error) {
      toast.error('Failed to update flow')
      console.error('Error updating flow:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.FLOWS,
        flow.$id
      )

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
        <DialogContent className="sm:max-w-2xl w-full max-w-[90vw] max-h-[80vh] overflow-hidden">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Flow</DialogTitle>
              <DialogDescription>
                Update the flow name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto overflow-y-auto py-4 modal-scroll max-h-[calc(80vh-160px)]">
              <div className="flex gap-6 min-w-max">
                {/* Left Column */}
                <div className="flex-1 min-w-[300px] space-y-4">
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
                </div>
                
                {/* Right Column */}
                <div className="flex-1 min-w-[300px] space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-flow-description">Description</Label>
                    <Textarea
                      id="edit-flow-description"
                      placeholder="Enter flow description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                    />
                  </div>
                </div>
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