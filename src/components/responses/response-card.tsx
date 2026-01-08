'use client'

import { useState } from 'react'
import { Copy, Edit, Trash2, BarChart2, Hash, Tag, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CannedResponse } from '@/lib/responses/types'

interface ResponseCardProps {
  response: CannedResponse
  onEdit: (response: CannedResponse) => void
  onDelete: (id: string) => Promise<boolean>
  onCopy: (response: CannedResponse) => void
}

export function ResponseCard({
  response,
  onEdit,
  onDelete,
  onCopy,
}: ResponseCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(response.id)
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyContent = () => {
    navigator.clipboard.writeText(response.content)
    onCopy(response)
  }

  // Extract variables from content for display
  const variableMatches = response.content.match(/\{\{(\w+)\}\}/g) || []
  const uniqueVariables = [...new Set(variableMatches)]

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-sm truncate">{response.title}</h3>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {response.category}
                </Badge>
              </div>

              {/* Shortcut */}
              {response.shortcut && (
                <div className="flex items-center gap-1 mb-2">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {response.shortcut}
                  </code>
                </div>
              )}

              {/* Content preview */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {response.content}
              </p>

              {/* Variables */}
              {uniqueVariables.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {uniqueVariables.slice(0, 3).map((v) => (
                    <Badge key={v} variant="outline" className="text-[10px] px-1.5">
                      {v}
                    </Badge>
                  ))}
                  {uniqueVariables.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{uniqueVariables.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Tags */}
              {response.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {response.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {response.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{response.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  {response.usageCount} uses
                </span>
                {response.successRate > 0 && (
                  <span>{Math.round(response.successRate * 100)}% success</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(response)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{response.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
