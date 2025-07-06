import { Todo } from '@/types/todo'

import { db } from './database'

export class TodoService {
  static async getTodosByDate(date: string): Promise<Todo[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const rows = await db.getAllAsync<any>(
      `
      SELECT * FROM todos 
      WHERE created_at >= ? AND created_at <= ? AND is_deleted = 0
      ORDER BY id ASC
    `,
      [startOfDay.toISOString(), endOfDay.toISOString()]
    )

    return rows.map(row => ({
      id: row.id,
      parentId: row.parent_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }))
  }

  static async createTodo(title: string, parentId?: number): Promise<Todo> {
    const now = new Date().toISOString()

    const result = await db.runAsync(
      'INSERT INTO todos (parent_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [parentId || null, title, now, now]
    )

    return {
      id: result.lastInsertRowId,
      parentId: parentId || null,
      title,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }
  }

  static async updateTodo(id: number, title: string): Promise<void> {
    const now = new Date().toISOString()
    await db.runAsync('UPDATE todos SET title = ?, updated_at = ? WHERE id = ?', [title, now, id])
  }

  static async softDeleteTodo(id: number): Promise<void> {
    const now = new Date().toISOString()

    await db.runAsync('UPDATE todos SET is_deleted = 1, updated_at = ? WHERE id = ?', [now, id])

    await db.runAsync('UPDATE todos SET parent_id = NULL WHERE parent_id = ?', [id])
  }

  static async getTodoById(id: number): Promise<Todo | null> {
    const row = await db.getFirstAsync<any>('SELECT * FROM todos WHERE id = ?', [id])

    if (!row) return null

    return {
      id: row.id,
      parentId: row.parent_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }
  }
}
