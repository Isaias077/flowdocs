'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { FileText, Plus, ExternalLink, Trash2, Edit2 } from 'lucide-react'
import { DocumentationLink } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DocumentationModalProps {
  projectId: string
  documentationLinks: string
  onUpdate: (newLinks: string) => void
}

export function DocumentationModal({ projectId, documentationLinks, onUpdate }: DocumentationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    type: 'docs' as any,
    url: '',
    title: '',
    description: ''
  })

  const parseLinks = (linksString: string): DocumentationLink[] => {
    try {
      return linksString ? JSON.parse(linksString) : []
    } catch {
      return []
    }
  }

  const links = parseLinks(documentationLinks)

  const handleAddLink = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Title and URL are required')
      return
    }

    const newLink: DocumentationLink = {
      type: formData.type,
      url: formData.url.trim(),
      title: formData.title.trim(),
      description: formData.description.trim()
    }

    const updatedLinks = editingIndex !== null 
      ? links.map((link, index) => index === editingIndex ? newLink : link)
      : [...links, newLink]

    await saveLinks(updatedLinks)
    setFormData({ type: 'docs', url: '', title: '', description: '' })
    setIsAddingLink(false)
    setEditingIndex(null)
  }

  const handleEditLink = (index: number) => {
    const link = links[index]
    setFormData({
      type: link.type,
      url: link.url,
      title: link.title,
      description: link.description || ''
    })
    setEditingIndex(index)
    setIsAddingLink(true)
  }

  const handleDeleteLink = async (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index)
    await saveLinks(updatedLinks)
  }

  const saveLinks = async (updatedLinks: DocumentationLink[]) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          documentation_links: JSON.stringify(updatedLinks),
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      onUpdate(JSON.stringify(updatedLinks))
      toast.success('Documentation links updated')
    } catch (error) {
      toast.error('Failed to update documentation links')
      console.error('Error updating documentation links:', error)
    }
  }

  const getTypeColor = (type: DocumentationLink['type']) => {
    switch (type) {
      case 'api': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'architecture': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'requirements': return 'bg-green-100 text-green-700 border-green-200'
      case 'deployment': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Documentation
          {links.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {links.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Documentation</DialogTitle>
          <DialogDescription>
            Manage useful links and documentation for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link, index) => (
                <Card key={index} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {link.title}
                          </a>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getTypeColor(link.type)}>
                            {link.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLink(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Link</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this documentation link?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteLink(index)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  {link.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-600">{link.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No documentation links added yet</p>
            </div>
          )}

          {isAddingLink && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">
                  {editingIndex !== null ? 'Edit Link' : 'Add New Link'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Link title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: DocumentationLink['type']) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API Documentation</SelectItem>
                        <SelectItem value="architecture">Architecture</SelectItem>
                        <SelectItem value="requirements">Requirements</SelectItem>
                        <SelectItem value="deployment">Deployment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this link"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddLink}>
                    {editingIndex !== null ? 'Update Link' : 'Add Link'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingLink(false)
                      setEditingIndex(null)
                      setFormData({ type: 'docs', url: '', title: '', description: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!isAddingLink && (
            <Button onClick={() => setIsAddingLink(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}