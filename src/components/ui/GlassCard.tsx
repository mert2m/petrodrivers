import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface GlassCardProps extends ViewProps {
  children: ReactNode;
  /**
   * Enable backdrop blur. Blur is EXPENSIVE — reserve it for modals, floating cards, and the
   * road-detail sheet header (spec §4). Long lists / scroll-heavy areas should pass blur={false}.
   */
  blur?: boolean;
  intensity?: number;
  className?: string;
}

/** Glassmorphism card. Falls back to a flat translucent surface when blur is off. */
export function GlassCard({
  children,
  blur = false,
  intensity = 30,
  className,
  ...rest
}: GlassCardProps) {
  const shell = cn('overflow-hidden rounded-xl border border-line', className);

  if (blur) {
    return (
      <BlurView intensity={intensity} tint="dark" className={shell}>
        <View className="bg-surface-glass p-4" {...rest}>
          {children}
        </View>
      </BlurView>
    );
  }

  return (
    <View className={cn(shell, 'bg-surface-elevated p-4')} {...rest}>
      {children}
    </View>
  );
}
