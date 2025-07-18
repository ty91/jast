import { create } from 'zustand'

import { TodoService } from '@/libs/todo.service'
import { Todo, TodoStatus, TodoWithChildren } from '@/types/todo'

interface TodoStore {
  todos: Todo[]
  selectedDate: Date
  isLoading: boolean
  yearlyStats: { date: number; total: number; completed: number }[]

  setSelectedDate: (date: Date) => void
  loadTodos: () => Promise<void>
  loadYearlyStats: () => Promise<void>
  addTodo: (title: string, parentId?: number) => Promise<void>
  updateTodo: (id: number, title: string) => Promise<void>
  updateTodoStatus: (id: number, status: TodoStatus) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
  getTodosWithHierarchy: () => TodoWithChildren[]
  reorderTodos: (reorderedTodos: { id: number; position: number }[]) => Promise<void>
  updateTodoParent: (id: number, parentId: number | null) => Promise<void>
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  selectedDate: new Date(),
  isLoading: false,
  yearlyStats: [],

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date })
    get().loadTodos()
  },

  loadTodos: async () => {
    set({ isLoading: true })
    try {
      const todos = await TodoService.getTodosByDate(get().selectedDate)
      set({ todos })
    } catch (error) {
      console.error('Failed to load todos:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadYearlyStats: async () => {
    try {
      const stats = await TodoService.getYearlyStats()
      set({ yearlyStats: stats })
    } catch (error) {
      console.error('Failed to load yearly stats:', error)
    }
  },

  addTodo: async (title: string, parentId?: number) => {
    try {
      await TodoService.createTodo(title, get().selectedDate, parentId)
      await get().loadTodos()
      await get().loadYearlyStats()
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  },

  updateTodo: async (id: number, title: string) => {
    try {
      await TodoService.updateTodo(id, title)
      await get().loadTodos()
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  },

  updateTodoStatus: async (id: number, status: TodoStatus) => {
    try {
      await TodoService.updateTodoStatus(id, status)
      await get().loadTodos()
      await get().loadYearlyStats()
    } catch (error) {
      console.error('Failed to update todo status:', error)
    }
  },

  deleteTodo: async (id: number) => {
    try {
      await TodoService.softDeleteTodo(id)
      await get().loadTodos()
      await get().loadYearlyStats()
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  },

  getTodosWithHierarchy: () => {
    const todos = get().todos
    const rootTodos = todos.filter(todo => !todo.parentId).sort((a, b) => a.position - b.position)

    return rootTodos.map(rootTodo => ({
      ...rootTodo,
      children: todos.filter(todo => todo.parentId === rootTodo.id).sort((a, b) => a.position - b.position),
    }))
  },

  reorderTodos: async (reorderedTodos: { id: number; position: number }[]) => {
    try {
      await TodoService.reorderTodos(reorderedTodos)
      await get().loadTodos()
    } catch (error) {
      console.error('Failed to reorder todos:', error)
    }
  },

  updateTodoParent: async (id: number, parentId: number | null) => {
    try {
      await TodoService.updateTodoParent(id, parentId)
      await get().loadTodos()
    } catch (error) {
      console.error('Failed to update todo parent:', error)
    }
  },
}))
