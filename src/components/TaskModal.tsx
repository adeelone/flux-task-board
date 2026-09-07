import { useEffect, useState } from 'react'
import { Plus, Tag, Trash2, X } from 'lucide-react'
import type { Label, Priority, Status, Task, TeamMember } from '../types'
import { STATUSES } from '../types'
import { Avatar } from './AvatarStack'

const LABEL_COLORS = ['#5b5bf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899']

export interface TaskDraft {
  title: string
  description: string
  status: Status
  priority: Priority
  due_date: string
  assignee_ids: string[]
  label_ids: string[]
}

interface Props {
  mode: 'create' | 'edit'
  initialStatus: Status
  task?: Task
  members: TeamMember[]
  labels: Label[]
  onClose: () => void
  onSave: (draft: TaskDraft) => Promise<void>
  onDelete?: () => Promise<void>
  onCreateLabel: (name: string, color: string) => Promise<void>
}

export function TaskModal({ mode, initialStatus, task, members, labels, onClose, onSave, onDelete, onCreateLabel }: Props) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? initialStatus,
    priority: task?.priority ?? 'normal',
    due_date: task?.due_date ?? '',
    assignee_ids: task?.assignee_ids ?? [],
    label_ids: task?.label_ids ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
  const [showLabelForm, setShowLabelForm] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!draft.title.trim()) {
      setError('Give the task a title.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving this task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this task.')
      setDeleting(false)
    }
  }

  async function handleAddLabel() {
    if (!newLabelName.trim()) return
    await onCreateLabel(newLabelName.trim(), newLabelColor)
    setNewLabelName('')
    setShowLabelForm(false)
  }

  function toggleAssignee(id: string) {
    setDraft((d) => ({
      ...d,
      assignee_ids: d.assignee_ids.includes(id) ? d.assignee_ids.filter((x) => x !== id) : [...d.assignee_ids, id],
    }))
  }

  function toggleLabel(id: string) {
    setDraft((d) => ({
      ...d,
      label_ids: d.label_ids.includes(id) ? d.label_ids.filter((x) => x !== id) : [...d.label_ids, id],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{mode === 'create' ? 'New task' : 'Edit task'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Task title"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-[14px] font-medium outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-soft)]"
            />
          </div>

          <div>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Add a description..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-soft)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Status }))}
                className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-brand)]"
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Priority</label>
              <select
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
                className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-brand)]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Due date</label>
            <input
              type="date"
              value={draft.due_date}
              onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Assignees</label>
            {members.length === 0 ? (
              <p className="text-[12px] text-[var(--color-ink-faint)]">Add team members from the "Team" menu to assign tasks.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => {
                  const active = draft.assignee_ids.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] font-medium transition-colors ${
                        active ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]' : 'border-[var(--color-border)] text-[var(--color-ink-soft)]'
                      }`}
                    >
                      <Avatar member={m} size={16} /> {m.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Labels</label>
              <button
                onClick={() => setShowLabelForm((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-strong)]"
              >
                <Plus size={12} /> New label
              </button>
            </div>

            {showLabelForm && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] p-1.5">
                <input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  placeholder="Label name"
                  className="flex-1 rounded-md border-0 px-2 py-1 text-[12px] outline-none"
                />
                <div className="flex gap-1">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewLabelColor(c)}
                      className={`h-4 w-4 rounded-full ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-[var(--color-brand)]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={handleAddLabel} className="rounded-md bg-[var(--color-brand)] px-2 py-1 text-[11px] font-semibold text-white">
                  Add
                </button>
              </div>
            )}

            {labels.length === 0 ? (
              <p className="text-[12px] text-[var(--color-ink-faint)]">No labels yet — create one above.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const active = draft.label_ids.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11.5px] font-medium transition-colors"
                      style={
                        active
                          ? { borderColor: l.color, backgroundColor: `${l.color}1a`, color: l.color }
                          : { borderColor: 'var(--color-border)', color: 'var(--color-ink-soft)' }
                      }
                    >
                      <Tag size={11} /> {l.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          {mode === 'edit' && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={13} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[var(--color-brand)] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create task' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
