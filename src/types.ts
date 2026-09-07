export type Status = 'todo' | 'in_progress' | 'in_review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'var(--color-todo)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--color-progress)' },
  { id: 'in_review', label: 'In Review', color: 'var(--color-review)' },
  { id: 'done', label: 'Done', color: 'var(--color-done)' },
]

export interface TeamMember {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Label {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  assignee_ids: string[]
  label_ids: string[]
}

export interface ActivityEntry {
  id: string
  task_id: string
  message: string
  created_at: string
}
