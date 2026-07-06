import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading element (icon, thumbnail, difficulty dot). */
  leading?: ReactNode;
  /** Trailing element (chevron, badge, value). */
  trailing?: ReactNode;
  onPress?: () => void;
  className?: string;
}

/** Flat list row — no blur (used in scroll-heavy lists, spec §4 performance discipline). */
export function ListRow({ title, subtitle, leading, trailing, onPress, className }: ListRowProps) {
  const content = (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', className)}>
      {leading ? <View>{leading}</View> : null}
      <View className="flex-1">
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" className="text-fg-secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={undefined}
      className="active:bg-surface-elevated"
    >
      {content}
    </Pressable>
  );
}
