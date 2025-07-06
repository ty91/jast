import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'

import { DatePicker } from '@/components/date-picker'
import { TodoList } from '@/components/todo-list'
import { initializeDatabase } from '@/libs/database'
import { useTodoStore } from '@/stores/todo.store'

export default function Index() {
  const loadTodos = useTodoStore(state => state.loadTodos)

  useEffect(() => {
    const setup = async () => {
      await initializeDatabase()
      await loadTodos()
    }
    setup()
  }, [loadTodos])

  return (
    <SafeAreaView style={styles.container}>
      <DatePicker />
      <TodoList />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
