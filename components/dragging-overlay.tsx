import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

import { TodoWithChildren } from '@/types/todo'

interface DraggingOverlayProps {
  item: TodoWithChildren
  position: { x: number; y: number }
}

export const DraggingOverlay: React.FC<DraggingOverlayProps> = ({ item, position }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.x - 40 }, { translateY: position.y - 100 }],
  }))

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.itemContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {item.children.length > 0 && <Text style={styles.childrenCount}>+{item.children.length} subtasks</Text>}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 200,
    opacity: 0.9,
  },
  title: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  childrenCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
})
