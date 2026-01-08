'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FolderOpen, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCannedResponses } from '@/hooks/responses/use-canned-responses'
import { ResponseCard } from './response-card'
import { ResponseForm } from './response-form'
import { CannedResponse } from '@/lib/responses/types'
import { cn } from '@/lib/utils'

interface ResponseManagerProps {
  className?: string
}

export function ResponseManager({ className }: ResponseManagerProps) {
  const {
    responses,
    categories,
    loading,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    createResponse,
    updateResponse,
    deleteResponse,
    recordUsage,
    refresh,
  } = useCannedResponses()

  const [formOpen, setFormOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCreate = () => {
    setEditingResponse(null)
    setFormOpen(true)
  }

  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response)
    setFormOpen(true)
  }

  const handleSave = async (input: Parameters<typeof createResponse>[0]) => {
    if (editingResponse) {
      return updateResponse(editingResponse.id, input)
    }
    return createResponse(input)
  }

  const handleCopy = (response: CannedResponse) => {
    recordUsage(response.id)
  }

  // Group responses by category for counts
  const categoryCounts = responses.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar - Categories */}
      <div className="w-56 border-r flex flex-col bg-muted/30">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-sm">Categories</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* All responses */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                All Responses
              </span>
              <Badge variant={selectedCategory === null ? 'secondary' : 'outline'} className="text-xs">
                {responses.length}
              </Badge>
            </button>

            {/* Category list */}
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                  selectedCategory === cat.name
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {cat.name}
                </span>
                <Badge
                  variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {categoryCounts[cat.name] || 0}
                </Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search responses..."
              className="max-w-sm"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Response
          </Button>
        </div>

        {/* Response list */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No responses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create canned responses to quickly reply to common messages
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Response
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {responses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  onEdit={handleEdit}
                  onDelete={deleteResponse}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Form dialog */}
      <ResponseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        response={editingResponse}
        onSave={handleSave}
      />
    </div>
  )
}
