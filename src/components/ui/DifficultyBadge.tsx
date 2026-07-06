import { View } from 'react-native';

import { cn } from '@/lib/cn';
import type { Difficulty } from '@/theme/tokens';

import { Text } from './Text';

export interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
  className?: string;
}

const LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  technical: 'Technical',
  hairpin: 'Hairpin',
};

// Filled pill in the segment color; text contrast + hairpin gets an outline (near-black on dark bg).
const PILL: Record<Difficulty, string> = {
  easy: 'bg-difficulty-easy',
  medium: 'bg-difficulty-medium',
  technical: 'bg-difficulty-technical',
  hairpin: 'bg-difficulty-hairpin border border-difficulty-hairpinOutline',
};

const TEXT: Record<Difficulty, string> = {
  easy: 'text-fg-inverse',
  medium: 'text-fg-inverse',
  technical: 'text-fg',
  hairpin: 'text-fg',
};

/** Chip that colors a road/segment by difficulty. Same palette the map line layer uses. */
export function DifficultyBadge({ difficulty, size = 'md', className }: DifficultyBadgeProps) {
  return (
    <View
      className={cn(
        'items-center justify-center self-start rounded-pill',
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1',
        PILL[difficulty],
        className,
      )}
    >
      <Text variant="caption" className={TEXT[difficulty]}>
        {LABEL[difficulty]}
      </Text>
    </View>
  );
}
