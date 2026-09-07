import { useMemo, useState } from 'react'
import { AlertCircle, LayoutGrid, Plus } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { StatsBar } from './components/StatsBar'
import { TeamPanel } from './components/TeamPanel'
import { FilterBar, type Filters } from './components/FilterBar'
import { TaskModal, type TaskDraft } from './components/TaskModal'
import type { Status, Task } from './types'

const EMPTY_FILTERS: Filters = { query: '', priority: 'all', memberId: 'all', labelId: 'all' }

export default function App() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const board = useBoard(user?.id ?? null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; status: Status; task?: Task } | null>(null)

  const filteredTasks = useMemo(() => {
    return board.tasks.filter((t) => {
      if (filters.query && !t.title.toLowerCase().includes(filters.query.toLowerCase())) return false
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false
      if (filters.memberId !== 'all' && !t.assignee_ids.includes(filters.memberId)) return false
      if (filters.labelId !== 'all' && !t.label_ids.includes(filters.labelId)) return false
      return true
    })
  }, [board.tasks, filters])

  async function handleSave(draft: TaskDraft) {
    if (modal?.mode === 'edit' && modal.task) {
      await board.updateTask(modal.task.id, {
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        priority: draft.priority,
        due_date: draft.due_date || null,
        assignee_ids: draft.assignee_ids,
        label_ids: draft.label_ids,
      })
    } else {
      await board.createTask({
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        priority: draft.priority,
        due_date: draft.due_date || null,
        assignee_ids: draft.assignee_ids,
        label_ids: draft.label_ids,
      })
    }
  }

  const bootLoading = authLoading || (board.loading && board.tasks.length === 0 && !authError)

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
                <LayoutGrid size={16} />
              </div>
              <div>
                <h1 className="font-[var(--font-display)] text-[16px] font-bold leading-none text-[var(--color-ink)]">Flux Board</h1>
                <p className="text-[11px] text-[var(--color-ink-faint)]">Your personal task board</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TeamPanel members={board.members} onCreate={board.createMember} onDelete={board.deleteMember} />
              <button
                onClick={() => setModal({ mode: 'create', status: 'todo' })}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-strong)]"
              >
                <Plus size={14} /> New task
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatsBar tasks={board.tasks} />
            <FilterBar filters={filters} onChange={setFilters} members={board.members} labels={board.labels} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-5">
        {(authError || board.error) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            <AlertCircle size={15} className="shrink-0" />
            {authError ?? board.error}
          </div>
        )}

        {bootLoading ? (
          <Board tasks={[]} members={[]} labels={[]} loading onOpenTask={() => {}} onAddTask={() => {}} onMove={() => {}} />
        ) : board.tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-strong)] py-24 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <LayoutGrid size={22} />
            </div>
            <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">Your board is empty</h2>
            <p className="mt-1 max-w-xs text-[13px] text-[var(--color-ink-faint)]">
              Create your first task to start organizing work across To Do, In Progress, In Review, and Done.
            </p>
            <button
              onClick={() => setModal({ mode: 'create', status: 'todo' })}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-brand-strong)]"
            >
              <Plus size={14} /> Create a task
            </button>
          </div>
        ) : (
          <Board
            tasks={filteredTasks}
            members={board.members}
            labels={board.labels}
            loading={false}
            onOpenTask={(task) => setModal({ mode: 'edit', status: task.status, task })}
            onAddTask={(status) => setModal({ mode: 'create', status })}
            onMove={board.moveTask}
          />
        )}
      </main>

      {modal && (
        <TaskModal
          mode={modal.mode}
          initialStatus={modal.status}
          task={modal.task}
          members={board.members}
          labels={board.labels}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.task ? () => board.deleteTask(modal.task!.id) : undefined}
          onCreateLabel={board.createLabel}
        />
      )}
    </div>
  )
}
