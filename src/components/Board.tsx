import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { STATUSES, type Label, type Status, type Task, type TeamMember } from '../types'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { ColumnSkeleton } from './Skeletons'

interface Props {
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  loading: boolean
  onOpenTask: (task: Task) => void
  onAddTask: (status: Status) => void
  onMove: (taskId: string, status: Status, position: number) => void
}

type Columns = Record<Status, Task[]>

function groupByStatus(tasks: Task[]): Columns {
  const grouped: Columns = { todo: [], in_progress: [], in_review: [], done: [] }
  for (const t of [...tasks].sort((a, b) => a.position - b.position)) {
    grouped[t.status].push(t)
  }
  return grouped
}

export function Board({ tasks, members, labels, loading, onOpenTask, onAddTask, onMove }: Props) {
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(tasks))
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    setColumns(groupByStatus(tasks))
  }, [tasks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const taskById = useMemo(() => {
    const map = new Map<string, Task>()
    tasks.forEach((t) => map.set(t.id, t))
    return map
  }, [tasks])

  function findContainer(id: string): Status | undefined {
    if ((STATUSES as { id: Status }[]).some((s) => s.id === id)) return id as Status
    return (Object.keys(columns) as Status[]).find((status) => columns[status].some((t) => t.id === id))
  }

  function handleDragStart(event: DragStartEvent) {
    const task = taskById.get(String(event.active.id))
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeContainer = findContainer(String(active.id))
    const overContainer = findContainer(String(over.id))
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setColumns((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const activeIndex = activeItems.findIndex((t) => t.id === active.id)
      if (activeIndex === -1) return prev
      const [moved] = activeItems.slice(activeIndex, activeIndex + 1)
      const overIndex = overItems.findIndex((t) => t.id === over.id)

      return {
        ...prev,
        [activeContainer]: activeItems.filter((t) => t.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, overIndex >= 0 ? overIndex : overItems.length),
          { ...moved, status: overContainer },
          ...overItems.slice(overIndex >= 0 ? overIndex : overItems.length),
        ],
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeContainer = findContainer(String(active.id))
    const overContainer = findContainer(String(over.id))
    if (!activeContainer || !overContainer) return

    let finalColumns = columns
    if (activeContainer === overContainer) {
      const items = columns[activeContainer]
      const oldIndex = items.findIndex((t) => t.id === active.id)
      const newIndex = items.findIndex((t) => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalColumns = { ...columns, [activeContainer]: arrayMove(items, oldIndex, newIndex) }
        setColumns(finalColumns)
      }
    }

    const finalItems = finalColumns[overContainer]
    const index = finalItems.findIndex((t) => t.id === active.id)
    if (index === -1) return

    const prevTask = finalItems[index - 1]
    const nextTask = finalItems[index + 1]
    let position: number
    if (prevTask && nextTask) position = (prevTask.position + nextTask.position) / 2
    else if (prevTask) position = prevTask.position + 1
    else if (nextTask) position = nextTask.position - 1
    else position = Date.now()

    onMove(String(active.id), overContainer, position)
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((s) => (
          <ColumnSkeleton key={s.id} />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STATUSES.map((s) => (
          <Column
            key={s.id}
            status={s.id}
            label={s.label}
            color={s.color}
            tasks={columns[s.id]}
            members={members}
            labels={labels}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[284px] rotate-2 opacity-95">
            <TaskCard task={activeTask} members={members} labels={labels} onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
