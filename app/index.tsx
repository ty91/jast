import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'

import { AchievementGraph } from '@/components/achievement-graph'
import { DatePicker } from '@/components/date-picker'
import { TodoList } from '@/components/todo-list'
import { initializeDatabase } from '@/libs/database'
import { useTodoStore } from '@/stores/todo.store'

export default function Index() {
  const loadTodos = useTodoStore(state => state.loadTodos)
  const loadYearlyStats = useTodoStore(state => state.loadYearlyStats)
  const yearlyStats = useTodoStore(state => state.yearlyStats)

  useEffect(() => {
    const setup = async () => {
      await initializeDatabase()
      await loadTodos()
      await loadYearlyStats()
    }
    setup()
  }, [loadTodos, loadYearlyStats])

  return (
    <SafeAreaView style={styles.container}>
      <AchievementGraph stats={yearlyStats} />
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
