'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, GitBranch } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Project, Flow, Step } from '@/types'
import { FlowDiagram } from '@/components/flow-diagram'
import { StepPanel } from '@/components/step-panel'
import { FlowActions } from '@/components/flow-actions'
import { FlowExport } from '@/components/flow-export'
import { toast } from 'sonner'

export default function FlowPage() {
  const params = useParams()
  const projectId = params.id as string
  const flowId = params.flowId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [flow, setFlow] = useState<Flow | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [allFlows, setAllFlows] = useState<Flow[]>([])
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    microservice: '',
    functional_description: '',
    bdd_cases: ''
  })

  useEffect(() => {
    if (projectId && flowId) {
      fetchData()
    }
  }, [projectId, flowId])

  const fetchData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch current flow
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .single()

      if (flowError) throw flowError
      setFlow(flowData)

      // Fetch all flows for sidebar
      const { data: allFlowsData, error: allFlowsError } = await supabase
        .from('flows')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (allFlowsError) throw allFlowsError
      setAllFlows(allFlowsData || [])

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('flow_id', flowId)
        .order('order', { ascending: true })

      if (stepsError) throw stepsError
      setSteps(stepsData || [])
    } catch (error) {
      toast.error('Failed to fetch data')
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Step name is required')
      return
    }

    try {
      const nextOrder = Math.max(...steps.map(s => s.order), 0) + 1

      const { data, error } = await supabase
        .from('steps')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          microservice: formData.microservice.trim(),
          functional_description: formData.functional_description.trim(),
          bdd_cases: formData.bdd_cases.trim(),
          flow_id: flowId,
          order: nextOrder,
          links: '[]'
        }])
        .select()

      if (error) throw error

      setSteps([...steps, data[0]])
      setFormData({ name: '', description: '', microservice: '', functional_description: '', bdd_cases: '' })
      setIsDialogOpen(false)
      toast.success('Step created successfully')
    } catch (error) {
      toast.error('Failed to create step')
      console.error('Error creating step:', error)
    }
  }

  const handleStepUpdate = (updatedStep: Step) => {
    setSteps(steps.map(step => step.id === updatedStep.id ? updatedStep : step))
    setSelectedStep(updatedStep)
  }

  const handleStepDelete = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId))
    setSelectedStep(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading flow...</p>
        </div>
      </div>
    )
  }

  if (!project || !flow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Flow Not Found</h1>
          <p className="text-slate-600 mb-4">The flow you're looking for doesn't exist.</p>
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
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {project.name}
              </Button>
            </Link>
            <div className="text-slate-400">/</div>
            <h1 className="text-xl font-semibold text-slate-900">
              {flow.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <FlowActions
              flow={flow}
              projectId={projectId}
              onUpdate={(updatedFlow) => setFlow(updatedFlow)}
            />
            <FlowExport flowName={flow.name} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add New Step</DialogTitle>
                    <DialogDescription>
                      Add a new step to this flow.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Step Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter step name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="microservice">Microservice</Label>
                      <Input
                        id="microservice"
                        placeholder="Enter microservice name"
                        value={formData.microservice}
                        onChange={(e) => setFormData({ ...formData, microservice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter step description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="functional_description">Functional Requirements</Label>
                      <Textarea
                        id="functional_description"
                        placeholder="Enter functional requirements"
                        value={formData.functional_description}
                        onChange={(e) => setFormData({ ...formData, functional_description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bdd_cases">BDD Test Cases</Label>
                      <Textarea
                        id="bdd_cases"
                        placeholder="Given... When... Then..."
                        value={formData.bdd_cases}
                        onChange={(e) => setFormData({ ...formData, bdd_cases: e.target.value })}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Step</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {flow.description && (
          <p className="text-slate-600 mt-2">{flow.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-white border-r">
              <div className="p-4">
                <h2 className="font-semibold text-slate-900 mb-4">Flows</h2>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {allFlows.map((f) => (
                      <Link key={f.id} href={`/projects/${projectId}/flows/${f.id}`}>
                        <Card className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                          f.id === flowId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}>
                          <CardHeader className="p-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-blue-600" />
                              {f.name}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Flow Diagram */}
          <ResizablePanel defaultSize={80}>
            <div id="flow-diagram" className="h-full bg-white relative">
              {steps.length > 0 ? (
                <FlowDiagram 
                  steps={steps} 
                  onNodeClick={setSelectedStep}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <GitBranch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Steps Yet</h3>
                    <p className="text-slate-500 mb-6">
                      Add your first step to start building this flow.
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Step
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Step Detail Panel */}
      <StepPanel
        step={selectedStep}
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        onUpdate={handleStepUpdate}
        onDelete={handleStepDelete}
      />
    </div>
  )
}