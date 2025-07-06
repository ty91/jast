import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'

import { AchievementGraph } from '@/components/achievement-graph'
import { DatePicker } from '@/components/date-picker'
import { TodoListV2 } from '@/components/v2/todo-list-v2'
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
      <TodoListV2 />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
