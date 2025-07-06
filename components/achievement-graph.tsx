import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

interface DailyStat {
  date: number
  total: number
  completed: number
}

interface AchievementGraphProps {
  stats: DailyStat[]
}

const CELL_SIZE = 10
const CELL_MARGIN = 2
const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getColorForAchievement(total: number, completed: number): string {
  if (total === 0) return '#ebedf0' // No todos - gray

  const percentage = (completed / total) * 100

  if (percentage === 100) return '#006d32' // 100% - darkest green
  if (percentage >= 75) return '#0e7a3e'
  if (percentage >= 50) return '#0fa84a'
  if (percentage >= 25) return '#2dd357'
  if (percentage > 0) return '#7ee889'
  return '#ebedf0' // 0% - gray
}

export function AchievementGraph({ stats }: AchievementGraphProps) {
  const graphData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Create a map for quick lookup
    const statsMap = new Map(stats.map(s => [s.date, s]))

    // Generate all dates for the past year
    const weeks: { date: Date; stat?: DailyStat }[][] = []
    let currentWeek: { date: Date; stat?: DailyStat }[] = []

    // Start from the beginning of the week containing one year ago
    const startDate = new Date(oneYearAgo)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const currentDate = new Date(startDate)

    while (currentDate <= today) {
      const dateInt = parseInt(
        `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`,
      )

      currentWeek.push({
        date: new Date(currentDate),
        stat: statsMap.get(dateInt),
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Add the last week if it's not complete
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }, [stats])

  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = []
    let lastMonth = -1

    graphData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]?.date
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth()
        if (month !== lastMonth) {
          labels.push({
            month: MONTH_LABELS[month],
            position: weekIndex * (CELL_SIZE + CELL_MARGIN),
          })
          lastMonth = month
        }
      }
    })

    return labels
  }, [graphData])

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.graphContainer}>
          {/* Month labels */}
          <View style={styles.monthLabelsContainer}>
            {monthLabels.map((label, index) => (
              <Text key={index} style={[styles.monthLabel, { left: label.position }]}>
                {label.month}
              </Text>
            ))}
          </View>

          {/* Week day labels */}
          <View style={styles.weekLabelsContainer}>
            {WEEK_LABELS.map((label, index) => (
              <Text key={index} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Graph cells */}
          <View style={styles.graph}>
            {graphData.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => {
                  const color = day.stat ? getColorForAchievement(day.stat.total, day.stat.completed) : '#ebedf0'

                  return <View key={dayIndex} style={[styles.cell, { backgroundColor: color }]} />
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  graphContainer: {
    flexDirection: 'row',
  },
  monthLabelsContainer: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 0,
    height: 20,
    flexDirection: 'row',
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#586069',
  },
  weekLabelsContainer: {
    flexDirection: 'column',
    marginRight: 5,
    marginTop: 20,
  },
  weekLabel: {
    fontSize: 10,
    color: '#586069',
    height: CELL_SIZE + CELL_MARGIN,
    lineHeight: CELL_SIZE + CELL_MARGIN,
  },
  graph: {
    flexDirection: 'row',
    marginTop: 20,
  },
  week: {
    flexDirection: 'column',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: CELL_MARGIN,
    marginRight: CELL_MARGIN,
    borderRadius: 2,
  },
})
