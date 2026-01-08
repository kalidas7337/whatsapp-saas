'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CannedResponse, CreateResponseInput } from '@/lib/responses/types'
import { SYSTEM_VARIABLES, extractVariables } from '@/lib/responses/variables'

interface ResponseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  response?: CannedResponse | null
  onSave: (input: CreateResponseInput) => Promise<CannedResponse | null>
}

const CATEGORIES = [
  'Greetings',
  'Pricing',
  'Support',
  'Sales',
  'FAQ',
  'General',
  'FollowUp',
  'Closing',
]

export function ResponseForm({
  open,
  onOpenChange,
  response,
  onSave,
}: ResponseFormProps) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'General',
    shortcut: '',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [detectedVariables, setDetectedVariables] = useState<string[]>([])

  // Initialize form when response changes
  useEffect(() => {
    if (response) {
      setForm({
        title: response.title,
        content: response.content,
        category: response.category,
        shortcut: response.shortcut || '',
        tags: response.tags,
      })
    } else {
      setForm({
        title: '',
        content: '',
        category: 'General',
        shortcut: '',
        tags: [],
      })
    }
  }, [response, open])

  // Detect variables in content
  useEffect(() => {
    setDetectedVariables(extractVariables(form.content))
  }, [form.content])

  const handleAddTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      setForm({ ...form, tags: [...form.tags, tagInput] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
  }

  const insertVariable = (varName: string) => {
    setForm({
      ...form,
      content: form.content + `{{${varName}}}`,
    })
  }

  const handleSubmit = async () => {
    if (!form.title || !form.content) return

    setSaving(true)
    try {
      const result = await onSave({
        title: form.title,
        content: form.content,
        category: form.category,
        shortcut: form.shortcut || undefined,
        tags: form.tags,
      })
      if (result) {
        onOpenChange(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!response

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Response' : 'Create New Response'}
          </DialogTitle>
          <DialogDescription>
            Create a reusable response template with optional variables
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-6">
          {/* Title & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Welcome Message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shortcut */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="shortcut">Shortcut</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Type this shortcut in the composer to quickly insert this
                    response
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="shortcut"
              value={form.shortcut}
              onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
              placeholder="/welcome"
            />
            <p className="text-xs text-muted-foreground">
              Must start with / and contain only lowercase letters, numbers, and underscores
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Insert variable
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[300px] overflow-auto">
                  {SYSTEM_VARIABLES.map((v) => (
                    <DropdownMenuItem
                      key={v.name}
                      onClick={() => insertVariable(v.name)}
                    >
                      <div>
                        <div className="font-mono text-xs">{`{{${v.name}}}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {v.description}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Hello {{contact_name}}, thank you for reaching out..."
              rows={5}
            />
            {detectedVariables.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  Variables detected:
                </span>
                {detectedVariables.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                }
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.content}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
