import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export interface ScreenProps extends ViewProps {
  children: ReactNode;
  /** Which edges get safe-area insets. Default: top+bottom (map screens often pass [] to go edge-to-edge). */
  edges?: Edge[];
  /** Extra horizontal padding on the content. */
  padded?: boolean;
  className?: string;
}

/** Base screen surface: forced-dark background + safe area. Flat (no blur) for scroll-heavy areas (spec §4). */
export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = false,
  className,
  ...rest
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface">
      <View className={cn('flex-1', padded && 'px-4', className)} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
