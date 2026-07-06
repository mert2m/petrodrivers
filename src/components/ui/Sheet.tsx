import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet modal. Blur is used selectively on the header only (spec §4). Tap-backdrop to dismiss;
 * drag-to-dismiss lands with gesture-handler in a later phase (TODO).
 */
export function Sheet({ visible, onClose, title, children, className }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View entering={FadeIn} exiting={FadeOut} className="absolute inset-0 bg-black/60">
          <Pressable accessibilityLabel="Close sheet" className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(24)}
          exiting={SlideOutDown}
          className={cn(
            'rounded-t-2xl border-t border-line bg-surface-elevated px-4 pb-8 pt-3',
            className,
          )}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-line-strong" />
          {title ? (
            <Text variant="heading" className="mb-3">
              {title}
            </Text>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
