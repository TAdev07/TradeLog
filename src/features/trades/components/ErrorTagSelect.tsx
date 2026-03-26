import { ERROR_TAGS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ErrorTagSelectProps {
  value: string[]
  onChange: (tags: string[]) => void
}

export function ErrorTagSelect({ value, onChange }: ErrorTagSelectProps) {
  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ERROR_TAGS.map((tag) => {
        const isSelected = value.includes(tag.value)
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
          >
            <Badge
              variant={isSelected ? 'destructive' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                isSelected && 'bg-loss/20 text-loss border-loss/30'
              )}
            >
              {tag.label}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}
