'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, FileImage, FileText } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface FlowExportProps {
  flowName: string
  targetElementId?: string
}

export function FlowExport({ flowName, targetElementId = 'flow-diagram' }: FlowExportProps) {
  const exportAsPNG = async () => {
    try {
      const element = document.getElementById(targetElementId)
      if (!element) {
        toast.error('Flow diagram not found')
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const link = document.createElement('a')
      link.download = `${flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.success('Flow exported as PNG')
    } catch (error) {
      toast.error('Failed to export as PNG')
      console.error('Export error:', error)
    }
  }

  const exportAsPDF = async () => {
    try {
      const element = document.getElementById(targetElementId)
      if (!element) {
        toast.error('Flow diagram not found')
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.pdf`)

      toast.success('Flow exported as PDF')
    } catch (error) {
      toast.error('Failed to export as PDF')
      console.error('Export error:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsPNG}>
          <FileImage className="w-4 h-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}