import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Calendar, GripVertical, MessageSquareText } from 'lucide-react'
import { differenceInCalendarDays, format, isToday, parseISO } from 'date-fns'
import type { Label, Task, TeamMember } from '../types'
import { AvatarStack } from './AvatarStack'

const PRIORITY_STYLES: Record<Task['priority'], { label: string; dot: string; text: string; bg: string }> = {
  low: { label: 'Low', dot: 'bg-[var(--color-low)]', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  normal: { label: 'Normal', dot: 'bg-[var(--color-normal)]', text: 'text-blue-700', bg: 'bg-blue-50' },
  high: { label: 'High', dot: 'bg-[var(--color-high)]', text: 'text-red-700', bg: 'bg-red-50' },
}

function dueMeta(dueDate: string | null) {
  if (!dueDate) return null
  const date = parseISO(dueDate)
  const days = differenceInCalendarDays(date, new Date())
  if (days < 0) return { label: `${format(date, 'MMM d')} · overdue`, tone: 'overdue' as const }
  if (isToday(date)) return { label: 'Due today', tone: 'soon' as const }
  if (days <= 2) return { label: `Due ${format(date, 'EEE')}`, tone: 'soon' as const }
  return { label: format(date, 'MMM d'), tone: 'normal' as const }
}

interface Props {
  task: Task
  members: TeamMember[]
  labels: Label[]
  onOpen: () => void
}

export function TaskCard({ task, members, labels, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = PRIORITY_STYLES[task.priority]
  const due = dueMeta(task.due_date)
  const taskMembers = members.filter((m) => task.assignee_ids.includes(m.id))
  const taskLabels = labels.filter((l) => task.label_ids.includes(l.id))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-[0_1px_2px_rgba(20,20,31,0.04)] transition-all hover:shadow-[0_4px_14px_rgba(20,20,31,0.08)] hover:border-[var(--color-border-strong)] cursor-pointer ${
        isDragging ? 'opacity-40' : 'animate-pop-in'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag task"
        >
          <GripVertical size={15} />
        </button>
        <p className="flex-1 text-[13.5px] font-medium leading-snug text-[var(--color-ink)]">{task.title}</p>
      </div>

      {taskLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pl-5.5">
          {taskLabels.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${l.color}1a`, color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between pl-5.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${priority.bg} ${priority.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
          {due && (
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] font-medium ${
                due.tone === 'overdue' ? 'text-red-600' : due.tone === 'soon' ? 'text-amber-600' : 'text-[var(--color-ink-faint)]'
              }`}
            >
              {due.tone === 'overdue' ? <AlertTriangle size={11} /> : <Calendar size={11} />}
              {due.label}
            </span>
          )}
        </div>
        <AvatarStack members={taskMembers} />
      </div>
    </div>
  )
}

export function TaskCommentBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-[var(--color-ink-faint)]">
      <MessageSquareText size={11} /> {count}
    </span>
  )
}
