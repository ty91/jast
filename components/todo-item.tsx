import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useTodoStore } from '@/stores/todo.store'
import { Todo, TodoStatus } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
  isChild?: boolean
  onAddChild?: () => void
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, isChild = false, onAddChild }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.title)
  const { updateTodo, updateTodoStatus, deleteTodo } = useTodoStore()

  const handleSave = async () => {
    if (editText.trim()) {
      await updateTodo(todo.id, editText.trim())
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTodo(todo.id),
      },
    ])
  }

  const toggleStatus = async () => {
    const newStatus = todo.status === TodoStatus.COMPLETED ? TodoStatus.PENDING : TodoStatus.COMPLETED
    await updateTodoStatus(todo.id, newStatus)
  }

  return (
    <View style={[styles.container, isChild && styles.childContainer]}>
      <TouchableOpacity onPress={toggleStatus} style={styles.checkbox}>
        <View style={[styles.checkboxInner, todo.status === TodoStatus.COMPLETED && styles.checkboxChecked]}>
          {todo.status === TodoStatus.COMPLETED && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={styles.input}
          value={editText}
          onChangeText={setEditText}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          autoFocus
        />
      ) : (
        <TouchableOpacity style={styles.content} onPress={() => setIsEditing(true)} activeOpacity={0.7}>
          <Text style={[styles.title, todo.status === TodoStatus.COMPLETED && styles.titleCompleted]}>
            {todo.title}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {!isChild && onAddChild && (
          <TouchableOpacity onPress={onAddChild} style={styles.actionButton}>
            <Text style={styles.actionText}>+</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Text style={styles.actionText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  childContainer: {
    paddingLeft: 56,
    backgroundColor: '#fafafa',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#333',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 18,
    color: '#666',
  },
})
