import * as Haptics from 'expo-haptics'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

interface FloatingAddButtonProps {
  onPress: () => void
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress }) => {
  const scale = useSharedValue(1)
  const rotate = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 500 }),
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 300 }),
    )

    rotate.value = withSequence(withTiming(0), withSpring(45, { damping: 10, stiffness: 200 }))

    onPress()

    setTimeout(() => {
      rotate.value = withSpring(0, { damping: 10, stiffness: 100 })
    }, 300)
  }

  return (
    <AnimatedTouchableOpacity style={[styles.container, animatedStyle]} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.plus}>+</Text>
    </AnimatedTouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  plus: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
})
