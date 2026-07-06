import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Controlled segmented control. Selected segment fills with accent; flat surface elsewhere. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn('flex-row rounded-lg bg-surface-elevated p-1', className)}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            className={cn(
              'flex-1 items-center justify-center rounded-md py-2',
              selected && 'bg-accent',
            )}
          >
            <Text variant="label" className={selected ? 'text-fg-inverse' : 'text-fg-secondary'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
