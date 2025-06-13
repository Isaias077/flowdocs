import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, GitBranch, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            FlowDocs
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Visualize and document your user flows with interactive diagrams. 
            Manage projects, microservices, and process documentation in one place.
          </p>
          <Link href="/projects">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Visual Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Create interactive flow diagrams that make complex processes easy to understand and follow.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Flow Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Organize your workflows by project and track microservice dependencies with detailed step information.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Share flows via URLs and keep your team aligned with clear, accessible documentation.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}