import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Label, Status, Task, TeamMember } from '../types'
import { TaskCard } from './TaskCard'

interface Props {
  status: Status
  label: string
  color: string
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  onOpenTask: (task: Task) => void
  onAddTask: (status: Status) => void
}

export function Column({ status, label, color, tasks, members, labels, onOpenTask, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })

  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <h2 className="text-[13px] font-semibold tracking-wide text-[var(--color-ink)]">{label}</h2>
          <span className="rounded-full bg-[var(--color-border)] px-1.5 py-[1px] text-[11px] font-medium text-[var(--color-ink-soft)]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="rounded-md p-1 text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-ink)]"
          aria-label={`Add task to ${label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl border p-2 transition-colors scrollbar-thin overflow-y-auto ${
          isOver ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]' : 'border-transparent bg-[var(--color-surface-2)]'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} members={members} labels={labels} onOpen={() => onOpenTask(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status)}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border-strong)] py-8 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            <Plus size={16} />
            <span className="text-[12px] font-medium">Add a task</span>
          </button>
        )}
      </div>
    </div>
  )
}
