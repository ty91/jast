export enum TodoStatus {
  PENDING = 0,
  COMPLETED = 1,
}

export interface Todo {
  id: number
  parentId: number | null
  title: string
  status: TodoStatus
  position: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface TodoWithChildren extends Todo {
  children: Todo[]
}
