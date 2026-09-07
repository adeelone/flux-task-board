import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label, Priority, Status, Task, TeamMember } from '../types'

interface NewTaskInput {
  title: string
  description?: string | null
  status?: Status
  priority?: Priority
  due_date?: string | null
  assignee_ids?: string[]
  label_ids?: string[]
}

interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: Status
  priority?: Priority
  due_date?: string | null
  position?: number
  assignee_ids?: string[]
  label_ids?: string[]
}

function toTask(row: any): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_ids: (row.task_assignees ?? []).map((a: any) => a.member_id),
    label_ids: (row.task_labels ?? []).map((l: any) => l.label_id),
  }
}

const TASK_SELECT = '*, task_assignees(member_id), task_labels(label_id)'

export function useBoard(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [tasksRes, membersRes, labelsRes] = await Promise.all([
        supabase.from('tasks').select(TASK_SELECT).order('position', { ascending: true }),
        supabase.from('team_members').select('*').order('created_at', { ascending: true }),
        supabase.from('labels').select('*').order('created_at', { ascending: true }),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (membersRes.error) throw membersRes.error
      if (labelsRes.error) throw labelsRes.error
      setTasks((tasksRes.data ?? []).map(toTask))
      setMembers(membersRes.data ?? [])
      setLabels(labelsRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your board')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Realtime: keep the board in sync as rows change (covers multi-tab / future multi-user use)
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, () => {
        loadAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_labels' }, () => loadAll())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, loadAll])

  const createTask = useCallback(
    async (input: NewTaskInput) => {
      if (!userId) return
      const status = input.status ?? 'todo'
      const columnTasks = tasks.filter((t) => t.status === status)
      const maxPos = columnTasks.reduce((m, t) => Math.max(m, t.position), 0)

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description ?? null,
          status,
          priority: input.priority ?? 'normal',
          due_date: input.due_date ?? null,
          position: maxPos + 1,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      const taskId = data.id as string
      await syncAssignees(taskId, input.assignee_ids ?? [])
      await syncLabels(taskId, input.label_ids ?? [])
      await loadAll()
    },
    [userId, tasks, loadAll]
  )

  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      const { assignee_ids, label_ids, ...rest } = input
      if (Object.keys(rest).length > 0) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ ...rest, updated_at: new Date().toISOString() })
          .eq('id', taskId)
        if (updateError) throw updateError
      }
      if (assignee_ids !== undefined) await syncAssignees(taskId, assignee_ids)
      if (label_ids !== undefined) await syncLabels(taskId, label_ids)
      await loadAll()
    },
    [loadAll]
  )

  // Optimistic move for smooth drag-and-drop; falls back to reload on failure.
  const moveTask = useCallback(
    async (taskId: string, status: Status, position: number) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status, position } : t))
      )
      const { error: moveError } = await supabase
        .from('tasks')
        .update({ status, position, updated_at: new Date().toISOString() })
        .eq('id', taskId)
      if (moveError) {
        setError(moveError.message)
        await loadAll()
      }
    },
    [loadAll]
  )

  const deleteTask = useCallback(async (taskId: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId)
    if (deleteError) throw deleteError
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const createMember = useCallback(
    async (name: string, color: string) => {
      if (!userId) return
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({ user_id: userId, name, color })
      if (insertError) throw insertError
      await loadAll()
    },
    [userId, loadAll]
  )

  const deleteMember = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('team_members').delete().eq('id', id)
      if (deleteError) throw deleteError
      await loadAll()
    },
    [loadAll]
  )

  const createLabel = useCallback(
    async (name: string, color: string) => {
      if (!userId) return
      const { error: insertError } = await supabase.from('labels').insert({ user_id: userId, name, color })
      if (insertError) throw insertError
      await loadAll()
    },
    [userId, loadAll]
  )

  const deleteLabel = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('labels').delete().eq('id', id)
      if (deleteError) throw deleteError
      await loadAll()
    },
    [loadAll]
  )

  return {
    tasks,
    members,
    labels,
    loading,
    error,
    setError,
    reload: loadAll,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    createMember,
    deleteMember,
    createLabel,
    deleteLabel,
  }
}

async function syncAssignees(taskId: string, memberIds: string[]) {
  await supabase.from('task_assignees').delete().eq('task_id', taskId)
  if (memberIds.length > 0) {
    await supabase.from('task_assignees').insert(memberIds.map((member_id) => ({ task_id: taskId, member_id })))
  }
}

async function syncLabels(taskId: string, labelIds: string[]) {
  await supabase.from('task_labels').delete().eq('task_id', taskId)
  if (labelIds.length > 0) {
    await supabase.from('task_labels').insert(labelIds.map((label_id) => ({ task_id: taskId, label_id })))
  }
}
