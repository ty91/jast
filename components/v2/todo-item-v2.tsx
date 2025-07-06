import * as Haptics from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { useTodoStore } from '@/stores/todo.store'
import { Todo, TodoStatus } from '@/types/todo'

interface TodoItemV2Props {
  todo: Todo
  isChild?: boolean
  isDragging?: boolean
  onDragStart?: (position: { x: number; y: number }) => void
  onDragMove?: (position: { x: number; y: number }) => void
  onDragEnd?: () => void
}

const SWIPE_THRESHOLD_1 = 80
const SWIPE_THRESHOLD_2 = 160
const DELETE_THRESHOLD_1 = -80
const DELETE_THRESHOLD_2 = -160
const ITEM_HEIGHT = 56

export const TodoItemV2: React.FC<TodoItemV2Props> = ({
  todo,
  isChild = false,
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.title)
  const { updateTodo, updateTodoStatus, deleteTodo, updateTodoParent } = useTodoStore()

  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [])

  const handleIndent = useCallback(() => {
    const todos = useTodoStore.getState().todos
    const currentIndex = todos.findIndex(t => t.id === todo.id)

    if (currentIndex > 0) {
      const potentialParent = todos[currentIndex - 1]
      if (!potentialParent.parentId && !isChild) {
        updateTodoParent(todo.id, potentialParent.id)
        triggerHaptic()
      }
    }
  }, [todo.id, isChild, updateTodoParent, triggerHaptic])

  const handleOutdent = useCallback(() => {
    if (isChild && todo.parentId) {
      updateTodoParent(todo.id, null)
      triggerHaptic()
    }
  }, [todo.id, todo.parentId, isChild, updateTodoParent, triggerHaptic])

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(event => {
      if (onDragStart) {
        runOnJS(triggerHaptic)()
        runOnJS(onDragStart)({ x: event.absoluteX, y: event.absoluteY })
      }
    })

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      if (onDragMove && isDragging) {
        runOnJS(onDragMove)({ x: event.absoluteX, y: event.absoluteY })
      } else {
        translateX.value = event.translationX

        // Right swipe (indent/outdent)
        if (event.translationX > 0) {
          if (event.translationX > SWIPE_THRESHOLD_2) {
            scale.value = withSpring(1.02)
            if (event.translationX === SWIPE_THRESHOLD_2) {
              runOnJS(triggerHaptic)()
            }
          } else if (event.translationX > SWIPE_THRESHOLD_1) {
            scale.value = withSpring(1.01)
          }
        }
        // Left swipe (delete)
        else if (event.translationX < 0) {
          if (event.translationX < DELETE_THRESHOLD_2) {
            scale.value = withSpring(0.98)
            if (event.translationX === DELETE_THRESHOLD_2) {
              runOnJS(triggerHaptic)()
            }
          } else if (event.translationX < DELETE_THRESHOLD_1) {
            scale.value = withSpring(0.99)
          }
        }
      }
    })
    .onEnd(event => {
      if (isDragging && onDragEnd) {
        runOnJS(onDragEnd)()
      } else {
        // Right swipe action
        if (event.translationX > SWIPE_THRESHOLD_2) {
          if (isChild) {
            runOnJS(handleOutdent)()
          } else {
            runOnJS(handleIndent)()
          }
        }
        // Left swipe action (delete)
        else if (event.translationX < DELETE_THRESHOLD_2) {
          opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(deleteTodo)(todo.id)
          })
        }

        translateX.value = withSpring(0)
        scale.value = withSpring(1)
      }
    })

  const gesture = Gesture.Simultaneous(longPressGesture, panGesture)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: isDragging ? 0.3 : opacity.value,
  }))

  const swipeIndicatorStyle = useAnimatedStyle(() => {
    const indicatorOpacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD_1, SWIPE_THRESHOLD_2], [0, 0.3, 1])

    const indicatorScale = interpolate(translateX.value, [0, SWIPE_THRESHOLD_1, SWIPE_THRESHOLD_2], [0.8, 1, 1.2])

    return {
      opacity: translateX.value < 0 ? 0 : indicatorOpacity,
      transform: [{ scale: indicatorScale }],
    }
  })

  const deleteIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [DELETE_THRESHOLD_2, DELETE_THRESHOLD_1, 0], [1, 0.3, 0])

    const scale = interpolate(translateX.value, [DELETE_THRESHOLD_2, DELETE_THRESHOLD_1, 0], [1.2, 1, 0.8])

    return {
      opacity,
      transform: [{ scale }],
    }
  })

  const handleSave = async () => {
    if (editText.trim()) {
      await updateTodo(todo.id, editText.trim())
      setIsEditing(false)
    }
  }

  const toggleStatus = async () => {
    const newStatus = todo.status === TodoStatus.COMPLETED ? TodoStatus.PENDING : TodoStatus.COMPLETED
    await updateTodoStatus(todo.id, newStatus)
  }

  const handleDelete = () => {
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(deleteTodo)(todo.id)
          })
        },
      },
    ])
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, isChild && styles.childContainer, animatedStyle]}>
        <View style={styles.swipeIndicatorContainer}>
          <Animated.View style={[styles.swipeIndicator, swipeIndicatorStyle]}>
            <Text style={styles.swipeIndicatorText}>{isChild ? '←' : '→'}</Text>
          </Animated.View>
        </View>

        <View style={styles.deleteIndicatorContainer}>
          <Animated.View style={[styles.deleteIndicator, deleteIndicatorStyle]}>
            <Text style={styles.deleteIndicatorText}>🗑</Text>
          </Animated.View>
        </View>

        <TouchableOpacity onPress={toggleStatus} style={styles.checkbox}>
          <Animated.View style={[styles.checkboxInner, todo.status === TodoStatus.COMPLETED && styles.checkboxChecked]}>
            {todo.status === TodoStatus.COMPLETED && <Text style={styles.checkmark}>✓</Text>}
          </Animated.View>
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

        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  childContainer: {
    paddingLeft: 56,
    backgroundColor: '#fafafa',
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  swipeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicatorText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteIndicatorContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  deleteIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIndicatorText: {
    fontSize: 20,
  },
  checkbox: {
    marginRight: 12,
    padding: 4,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingVertical: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  deleteText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
})
