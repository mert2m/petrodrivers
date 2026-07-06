import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/components/ui';

/**
 * Road detail (spec §8) — hero carousel, description, elevation profile, corner-difficulty breakdown,
 * surface quality, scenic rating, current weather, best driving time, community reports + comments,
 * favorite + "I drove this" check-in. Built in Phase 2 (features/roads). Route scaffolded now.
 */
export default function RoadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Road', headerTransparent: true }} />
      <Screen padded className="gap-2">
        <Text variant="title">Road detail</Text>
        <Text className="text-fg-secondary">Road id: {id}</Text>
        <Text className="text-fg-tertiary">Full detail page arrives in Phase 2.</Text>
      </Screen>
    </>
  );
}
