export interface Todo {
  id: number
  parentId: number | null
  title: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface TodoWithChildren extends Todo {
  children: Todo[]
}
