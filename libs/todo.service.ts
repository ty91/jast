import { Todo, TodoStatus } from '@/types/todo'
import { dateToInt, intToDate } from '@/utils/date'

import { db } from './database'

export class TodoService {
  static async getTodosByDate(targetDate: Date): Promise<Todo[]> {
    const targetDateInt = dateToInt(targetDate)
    const rows = await db.getAllAsync<any>(
      `
      SELECT * FROM todos 
      WHERE target_date = ? AND is_deleted = 0
      ORDER BY parent_id IS NULL DESC, position ASC
    `,
      [targetDateInt],
    )

    return rows.map(row => ({
      id: row.id,
      parentId: row.parent_id,
      title: row.title,
      status: row.status ?? TodoStatus.PENDING,
      position: row.position ?? 0,
      targetDate: intToDate(row.target_date),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }))
  }

  static async createTodo(title: string, targetDate: Date, parentId?: number): Promise<Todo> {
    const now = new Date().toISOString()
    const targetDateInt = dateToInt(targetDate)

    // Get the next position for this parent level
    const maxPositionRow = await db.getFirstAsync<any>(
      `SELECT MAX(position) as maxPos FROM todos 
       WHERE ${parentId ? 'parent_id = ?' : 'parent_id IS NULL'} 
       AND is_deleted = 0`,
      parentId ? [parentId] : [],
    )

    const nextPosition = (maxPositionRow?.maxPos ?? 0) + 1

    const result = await db.runAsync(
      'INSERT INTO todos (parent_id, title, status, position, target_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [parentId || null, title, TodoStatus.PENDING, nextPosition, targetDateInt, now, now],
    )

    const newTodo = {
      id: result.lastInsertRowId,
      parentId: parentId || null,
      title,
      status: TodoStatus.PENDING,
      position: nextPosition,
      targetDate,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }

    // Update daily stats
    await this.updateDailyStats(targetDate)

    return newTodo
  }

  static async updateTodo(id: number, title: string): Promise<void> {
    const now = new Date().toISOString()
    await db.runAsync('UPDATE todos SET title = ?, updated_at = ? WHERE id = ?', [title, now, id])
  }

  static async updateTodoStatus(id: number, status: TodoStatus): Promise<void> {
    const now = new Date().toISOString()

    // Get the todo to find its target date
    const todo = await this.getTodoById(id)
    if (!todo) return

    await db.runAsync('UPDATE todos SET status = ?, updated_at = ? WHERE id = ?', [status, now, id])

    // Update daily stats
    await this.updateDailyStats(todo.targetDate)
  }

  static async softDeleteTodo(id: number): Promise<void> {
    const now = new Date().toISOString()

    // Get the todo being deleted
    const todo = await this.getTodoById(id)
    if (!todo) return

    // Get its children
    const children = await db.getAllAsync<any>(
      'SELECT * FROM todos WHERE parent_id = ? AND is_deleted = 0 ORDER BY position',
      [id],
    )

    // Mark as deleted
    await db.runAsync('UPDATE todos SET is_deleted = 1, updated_at = ? WHERE id = ?', [now, id])

    // Update daily stats for the deleted todo's date
    await this.updateDailyStats(todo.targetDate)

    if (children.length > 0) {
      // Move children to parent's position
      const siblings = await db.getAllAsync<any>(
        `SELECT * FROM todos 
         WHERE ${todo.parentId ? 'parent_id = ?' : 'parent_id IS NULL'} 
         AND is_deleted = 0 AND id != ?
         ORDER BY position`,
        todo.parentId ? [todo.parentId, id] : [id],
      )

      // Update children to have no parent and inherit parent's position
      for (let i = 0; i < children.length; i++) {
        await db.runAsync('UPDATE todos SET parent_id = NULL, position = ?, updated_at = ? WHERE id = ?', [
          todo.position + i,
          now,
          children[i].id,
        ])
      }

      // Shift siblings that come after the deleted parent
      for (const sibling of siblings) {
        if (sibling.position > todo.position) {
          await db.runAsync('UPDATE todos SET position = ?, updated_at = ? WHERE id = ?', [
            sibling.position + children.length - 1,
            now,
            sibling.id,
          ])
        }
      }
    } else {
      // No children, just reorder siblings
      await this.reorderSiblings(todo.parentId, todo.position)
    }
  }

  static async reorderSiblings(parentId: number | null, deletedPosition: number): Promise<void> {
    const now = new Date().toISOString()
    const siblings = await db.getAllAsync<any>(
      `SELECT * FROM todos 
       WHERE ${parentId ? 'parent_id = ?' : 'parent_id IS NULL'} 
       AND is_deleted = 0 AND position > ?
       ORDER BY position`,
      parentId ? [parentId, deletedPosition] : [deletedPosition],
    )

    for (const sibling of siblings) {
      await db.runAsync('UPDATE todos SET position = ?, updated_at = ? WHERE id = ?', [
        sibling.position - 1,
        now,
        sibling.id,
      ])
    }
  }

  static async reorderTodos(todos: { id: number; position: number }[]): Promise<void> {
    const now = new Date().toISOString()

    for (const todo of todos) {
      await db.runAsync('UPDATE todos SET position = ?, updated_at = ? WHERE id = ?', [todo.position, now, todo.id])
    }
  }

  static async getTodoById(id: number): Promise<Todo | null> {
    const row = await db.getFirstAsync<any>('SELECT * FROM todos WHERE id = ?', [id])

    if (!row) return null

    return {
      id: row.id,
      parentId: row.parent_id,
      title: row.title,
      status: row.status ?? TodoStatus.PENDING,
      position: row.position ?? 0,
      targetDate: intToDate(row.target_date),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }
  }

  static async updateTodoDate(id: number, targetDate: Date): Promise<void> {
    const now = new Date().toISOString()
    const targetDateInt = dateToInt(targetDate)

    // Get the old date to update stats
    const todo = await this.getTodoById(id)
    if (!todo) return

    const oldDate = todo.targetDate

    await db.runAsync('UPDATE todos SET target_date = ?, updated_at = ? WHERE id = ?', [targetDateInt, now, id])

    // Update stats for both old and new dates
    await this.updateDailyStats(oldDate)
    await this.updateDailyStats(targetDate)
  }

  // Daily stats methods
  static async updateDailyStats(date: Date): Promise<void> {
    const dateInt = dateToInt(date)

    // Calculate stats for the given date
    const stats = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as completed
      FROM todos 
      WHERE target_date = ? AND is_deleted = 0`,
      [dateInt],
    )

    if (!stats || stats.total === 0) {
      // Remove the stats entry if no todos exist for this date
      await db.runAsync('DELETE FROM daily_stats WHERE date = ?', [dateInt])
    } else {
      // Upsert the stats
      await db.runAsync(
        `INSERT INTO daily_stats (date, total_count, completed_count) 
         VALUES (?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET 
           total_count = excluded.total_count,
           completed_count = excluded.completed_count`,
        [dateInt, stats.total, stats.completed],
      )
    }
  }

  static async getYearlyStats(): Promise<{ date: number; total: number; completed: number }[]> {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    const startDate = dateToInt(oneYearAgo)
    const endDate = dateToInt(today)

    const rows = await db.getAllAsync<any>(
      `SELECT date, total_count as total, completed_count as completed
       FROM daily_stats 
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [startDate, endDate],
    )

    return rows
  }

  static async updateTodoParent(id: number, parentId: number | null): Promise<void> {
    const now = new Date().toISOString()

    // Get the todo to update
    const todo = await this.getTodoById(id)
    if (!todo) return

    // Get the next position for the new parent level
    const maxPositionRow = await db.getFirstAsync<any>(
      `SELECT MAX(position) as maxPos FROM todos 
       WHERE ${parentId ? 'parent_id = ?' : 'parent_id IS NULL'} 
       AND is_deleted = 0 AND target_date = ?`,
      parentId ? [parentId, dateToInt(todo.targetDate)] : [dateToInt(todo.targetDate)],
    )

    const nextPosition = (maxPositionRow?.maxPos ?? 0) + 1

    // Update the todo's parent and position
    await db.runAsync('UPDATE todos SET parent_id = ?, position = ?, updated_at = ? WHERE id = ?', [
      parentId,
      nextPosition,
      now,
      id,
    ])

    // Reorder siblings in the old parent group
    if (todo.parentId !== parentId) {
      await this.reorderSiblings(todo.parentId, todo.position)
    }
  }
}
