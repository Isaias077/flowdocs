'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { X, Edit2, Trash2, ExternalLink, Plus } from 'lucide-react'
import { Step, Link } from '@/types'
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { useChangelog } from '@/hooks/use-changelog'
import { toast } from 'sonner'

interface StepPanelProps {
  step: Step | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (step: Step) => void
  onDelete: (stepId: string) => void
}

export function StepPanel({ step, isOpen, onClose, onUpdate, onDelete }: StepPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { logStepUpdated, logStepDeleted } = useChangelog()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    microservice: '',
    functional_description: '',
    links: '',
    bdd_cases: ''
  })

  const handleEdit = () => {
    if (step) {
      setFormData({
        name: step.name,
        description: step.description,
        microservice: step.microservice,
        functional_description: step.functional_description,
        links: step.links,
        bdd_cases: step.bdd_cases
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (!step) return

    try {
      // Detectar cambios y registrarlos
      const changes = []
      if (step.name !== formData.name.trim()) {
        changes.push({ field: 'name', old: step.name, new: formData.name.trim() })
      }
      if (step.description !== formData.description.trim()) {
        changes.push({ field: 'description', old: step.description, new: formData.description.trim() })
      }
      if (step.microservice !== formData.microservice.trim()) {
        changes.push({ field: 'microservice', old: step.microservice, new: formData.microservice.trim() })
      }
      if (step.functional_description !== formData.functional_description.trim()) {
        changes.push({ field: 'functional_description', old: step.functional_description, new: formData.functional_description.trim() })
      }
      if (step.links !== formData.links.trim()) {
        changes.push({ field: 'links', old: step.links, new: formData.links.trim() })
      }
      if (step.bdd_cases !== formData.bdd_cases.trim()) {
        changes.push({ field: 'bdd_cases', old: step.bdd_cases, new: formData.bdd_cases.trim() })
      }

      const updatedStep: unknown = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        step.$id,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          microservice: formData.microservice.trim(),
          functional_description: formData.functional_description.trim(),
          links: formData.links.trim(),
          bdd_cases: formData.bdd_cases.trim()
        }
      )

      // Registrar cada cambio en el historial
      for (const change of changes) {
        await logStepUpdated(
          step.flow_id,
          step.$id,
          formData.name.trim() || step.name,
          change.field,
          change.old,
          change.new
        )
      }

      onUpdate(updatedStep as unknown as Step)
      setIsEditing(false)
      toast.success('Step updated successfully')
    } catch (error) {
      toast.error('Failed to update step')
      console.error('Error updating step:', error)
    }
  }

  const handleDelete = async () => {
    if (!step) return

    try {
      // Registrar la eliminación antes de borrar
      await logStepDeleted(step.flow_id, step.name, step.microservice)

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.STEPS,
        step.$id
      )

      onDelete(step.$id)
      onClose()
      toast.success('Step deleted successfully')
    } catch (error) {
      toast.error('Failed to delete step')
      console.error('Error deleting step:', error)
    }
  }

  const parseLinks = (linksString: string): Link[] => {
    try {
      return linksString ? JSON.parse(linksString) : []
    } catch {
      return []
    }
  }

  if (!step) return null

  const links = parseLinks(step.links)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="text-left">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-lg font-semibold"
                  />
                ) : (
                  step.name
                )}
              </SheetTitle>
              <div className="mt-2">
                {isEditing ? (
                  <Input
                    value={formData.microservice}
                    onChange={(e) => setFormData({ ...formData, microservice: e.target.value })}
                    placeholder="Microservice name"
                  />
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {step.microservice}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {!isEditing && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Step</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this step? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
          <SheetDescription className="text-left">
            Step details and associated microservice information
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="space-y-6 pr-2">
          <div>
            <Label className="text-sm font-medium text-slate-700">Description</Label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter step description"
                className="mt-2"
                rows={3}
              />
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                {step.description || 'No description provided'}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium text-slate-700">Functional Requirements</Label>
            {isEditing ? (
              <Textarea
                value={formData.functional_description}
                onChange={(e) => setFormData({ ...formData, functional_description: e.target.value })}
                placeholder="Enter functional requirements"
                className="mt-2"
                rows={4}
              />
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                {step.functional_description || 'No functional requirements provided'}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium text-slate-700">BDD Test Cases</Label>
            {isEditing ? (
              <Textarea
                value={formData.bdd_cases}
                onChange={(e) => setFormData({ ...formData, bdd_cases: e.target.value })}
                placeholder="Given... When... Then..."
                className="mt-2 font-mono text-sm"
                rows={6}
              />
            ) : (
              <div className="mt-2">
                {step.bdd_cases ? (
                  <pre className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md whitespace-pre-wrap font-mono">
                    {step.bdd_cases}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">No BDD test cases provided</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium text-slate-700">Related Links</Label>
            {isEditing ? (
              <Textarea
                value={formData.links}
                onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                placeholder='[{"type":"docs","url":"https://...","title":"Documentation"}]'
                className="mt-2"
                rows={3}
              />
            ) : (
              <div className="mt-2 space-y-2">
                {links.length > 0 ? (
                  links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{link.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {link.type}
                      </Badge>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No links provided</p>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        {isEditing && (
          <SheetFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}