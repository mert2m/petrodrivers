import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/**
 * Road detail (spec §8) — hero carousel, description, elevation profile, corner-difficulty breakdown,
 * surface quality, scenic rating, current weather, best driving time, community reports + comments,
 * favorite + "I drove this" check-in. Built in Phase 2 (features/roads). Route scaffolded now.
 */
export default function RoadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t('road.headerTitle'), headerTransparent: true }}
      />
      <Screen padded className="gap-2">
        <Text variant="title">{t('road.detailTitle')}</Text>
        <Text className="text-fg-secondary">{t('road.roadId', { id })}</Text>
        <Text className="text-fg-tertiary">{t('road.phase2')}</Text>
      </Screen>
    </>
  );
}
