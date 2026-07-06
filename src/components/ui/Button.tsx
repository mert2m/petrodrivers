import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { motion } from '@/theme/tokens';

import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const surfaceByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  secondary: 'bg-surface-elevated border border-line',
  ghost: 'bg-transparent',
};

const labelColorByVariant: Record<ButtonVariant, string> = {
  primary: 'text-fg-inverse',
  secondary: 'text-fg',
  ghost: 'text-accent',
};

/** Premium press: subtle spring scale (Reanimated). No Material ripple (spec §4). */
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  className,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      style={animatedStyle}
      onPressIn={(e) => {
        scale.value = withSpring(0.96, motion.spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, motion.spring.snappy);
        onPressOut?.(e);
      }}
      className={cn(
        'items-center justify-center rounded-lg px-5 py-3',
        surfaceByVariant[variant],
        disabled && 'opacity-40',
        className,
      )}
      {...rest}
    >
      <Text variant="label" className={labelColorByVariant[variant]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
