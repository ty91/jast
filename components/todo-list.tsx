import React, { useCallback, useState } from 'react'
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
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { useTodoStore } from '@/stores/todo.store'
import { TodoWithChildren } from '@/types/todo'

import { DraggingOverlay } from './dragging-overlay'
import { DropIndicator } from './drop-indicator'
import { FloatingAddButton } from './floating-add-button'
import { TodoItem } from './todo-item'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface DragState {
  isDragging: boolean
  draggingItem: TodoWithChildren | null
  dragPosition: { x: number; y: number }
  dropTargetIndex: number | null
}

export const TodoList: React.FC = () => {
  const { getTodosWithHierarchy, isLoading, addTodo, reorderTodos } = useTodoStore()
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggingItem: null,
    dragPosition: { x: 0, y: 0 },
    dropTargetIndex: null,
  })
  const todosWithHierarchy = getTodosWithHierarchy()

  const handleAddTodo = async () => {
    if (newTodoText.trim()) {
      await addTodo(newTodoText.trim())
      setNewTodoText('')
      setIsAddingTodo(false)
      setAddingAtIndex(null)
    }
  }

  const handleAddTodoAtBottom = useCallback(() => {
    setAddingAtIndex(todosWithHierarchy.length)
    setIsAddingTodo(true)
  }, [todosWithHierarchy.length])

  const handleCancelAdd = () => {
    setNewTodoText('')
    setIsAddingTodo(false)
    setAddingAtIndex(null)
  }

  const handleDragStart = useCallback((item: TodoWithChildren, position: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      draggingItem: item,
      dragPosition: position,
      dropTargetIndex: null,
    })
  }, [])

  const handleDragMove = useCallback(
    (position: { x: number; y: number }) => {
      // Calculate drop target based on y position
      // This is a simplified version - in a real app, you'd calculate based on item positions
      const itemHeight = 56
      const potentialIndex = Math.floor((position.y - 200) / itemHeight)
      const clampedIndex = Math.max(0, Math.min(potentialIndex, todosWithHierarchy.length))

      setDragState(prev => ({
        ...prev,
        dragPosition: position,
        dropTargetIndex: clampedIndex,
      }))
    },
    [todosWithHierarchy.length],
  )

  const handleDragEnd = useCallback(async () => {
    if (dragState.dropTargetIndex !== null && dragState.draggingItem) {
      const fromIndex = todosWithHierarchy.findIndex(t => t.id === dragState.draggingItem!.id)
      const toIndex = dragState.dropTargetIndex

      if (fromIndex !== toIndex && fromIndex !== -1) {
        const updates: { id: number; position: number }[] = []
        const allTodos = [...todosWithHierarchy]

        // Remove dragged item (and its children)
        const [draggedItem] = allTodos.splice(fromIndex, 1)

        // Insert at new position
        const insertIndex = toIndex > fromIndex ? toIndex - 1 : toIndex
        allTodos.splice(insertIndex, 0, draggedItem)

        // Calculate new positions
        allTodos.forEach((todo, index) => {
          updates.push({ id: todo.id, position: index + 1 })
          // Also update positions for children
          todo.children.forEach((child, childIndex) => {
            updates.push({ id: child.id, position: childIndex + 1 })
          })
        })

        if (updates.length > 0) {
          await reorderTodos(updates)
        }
      }
    }

    setDragState({
      isDragging: false,
      draggingItem: null,
      dragPosition: { x: 0, y: 0 },
      dropTargetIndex: null,
    })
  }, [dragState.dropTargetIndex, dragState.draggingItem, reorderTodos, todosWithHierarchy])

  const renderTodoWithChildren = ({ item, index }: { item: TodoWithChildren; index: number }) => (
    <>
      <DropIndicator isActive={dragState.isDragging && dragState.dropTargetIndex === index} />
      {isAddingTodo && addingAtIndex === index && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.addTodoInline}>
          <AnimatedTextInput
            style={styles.addTodoInput}
            value={newTodoText}
            onChangeText={setNewTodoText}
            placeholder="What needs to be done?"
            onSubmitEditing={handleAddTodo}
            onBlur={() => {
              if (!newTodoText.trim()) {
                handleCancelAdd()
              }
            }}
            autoFocus
            returnKeyType="done"
          />
        </Animated.View>
      )}
      <TodoItem
        todo={item}
        isDragging={dragState.draggingItem?.id === item.id}
        onDragStart={position => handleDragStart(item, position)}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      {item.children.map(child => (
        <TodoItem
          key={child.id}
          todo={child}
          isChild
          isDragging={dragState.draggingItem?.id === item.id}
          onDragStart={position => handleDragStart(item, position)}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}
    </>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={todosWithHierarchy}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTodoWithChildren}
          ListEmptyComponent={
            <TouchableOpacity style={styles.emptyContainer} onPress={handleAddTodoAtBottom}>
              <Text style={styles.emptyText}>Tap to add your first todo</Text>
            </TouchableOpacity>
          }
          ListFooterComponent={
            <>
              <DropIndicator
                isActive={dragState.isDragging && dragState.dropTargetIndex === todosWithHierarchy.length}
              />
              {isAddingTodo && addingAtIndex === todosWithHierarchy.length && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={styles.addTodoInline}
                >
                  <AnimatedTextInput
                    style={styles.addTodoInput}
                    value={newTodoText}
                    onChangeText={setNewTodoText}
                    placeholder="What needs to be done?"
                    onSubmitEditing={handleAddTodo}
                    onBlur={() => {
                      if (!newTodoText.trim()) {
                        handleCancelAdd()
                      }
                    }}
                    autoFocus
                    returnKeyType="done"
                  />
                </Animated.View>
              )}
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {!isAddingTodo && <FloatingAddButton onPress={handleAddTodoAtBottom} />}

        {dragState.isDragging && dragState.draggingItem && (
          <DraggingOverlay item={dragState.draggingItem} position={dragState.dragPosition} />
        )}
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
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
    paddingBottom: 100,
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
  addTodoInline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  addTodoInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
})
