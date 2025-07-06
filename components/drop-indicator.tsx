import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface DropIndicatorProps {
  isActive: boolean
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={styles.line} />
      <View style={styles.circle} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#007AFF',
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    left: 8,
  },
})

