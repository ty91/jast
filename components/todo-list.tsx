import React, { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTodoStore } from '@/stores/todo.store'
import { TodoWithChildren } from '@/types/todo'

import { TodoItem } from './todo-item'

export const TodoList: React.FC = () => {
  const { getTodosWithHierarchy, isLoading, addTodo } = useTodoStore()
  const [newTodoText, setNewTodoText] = useState('')
  const [addingChildForId, setAddingChildForId] = useState<number | null>(null)
  const todosWithHierarchy = getTodosWithHierarchy()

  const handleAddTodo = async () => {
    if (newTodoText.trim()) {
      await addTodo(newTodoText.trim(), addingChildForId || undefined)
      setNewTodoText('')
      setAddingChildForId(null)
    }
  }

  const renderTodoItem = ({ item }: { item: TodoWithChildren }) => (
    <View>
      <TodoItem todo={item} onAddChild={() => setAddingChildForId(item.id)} />
      {item.children.map(child => (
        <TodoItem key={child.id} todo={child} isChild />
      ))}
      {addingChildForId === item.id && (
        <View style={styles.addChildContainer}>
          <TextInput
            style={styles.addChildInput}
            value={newTodoText}
            onChangeText={setNewTodoText}
            placeholder="Add sub-task..."
            onSubmitEditing={handleAddTodo}
            onBlur={() => {
              if (!newTodoText.trim()) {
                setAddingChildForId(null)
              }
            }}
            autoFocus
          />
        </View>
      )}
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={todosWithHierarchy}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTodoItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No todos for this day</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {addingChildForId === null && (
        <View style={styles.addTodoContainer}>
          <TextInput
            style={styles.addTodoInput}
            value={newTodoText}
            onChangeText={setNewTodoText}
            placeholder="Add a new todo..."
            onSubmitEditing={handleAddTodo}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo} disabled={!newTodoText.trim()}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  addTodoContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  addTodoInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addChildContainer: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  addChildInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
})
