import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DifficultyBadge, Screen, Text } from '@/components/ui';
import type { Difficulty } from '@/theme/tokens';

const LEGEND: Difficulty[] = ['easy', 'medium', 'technical', 'hairpin'];

/**
 * Map tab — the wedge. Phase 2 mounts the Mapbox canvas + data-driven difficulty line layer here
 * (via features/map). Phase 0 shows the difficulty legend so the design language is visible.
 */
export default function MapScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']} padded className="gap-4">
      <Text variant="title">{t('map.title')}</Text>
      <Text className="text-fg-secondary">{t('map.phase2Note')}</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {LEGEND.map((d) => (
          <DifficultyBadge key={d} difficulty={d} />
        ))}
      </View>
    </Screen>
  );
}
