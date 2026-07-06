import { Screen, Text } from '@/components/ui';

/** Discover tab — searchable/filterable road list (Phase 2, features/roads + features/favorites). */
export default function DiscoverScreen() {
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">Discover</Text>
      <Text className="text-fg-secondary">
        Browse and filter iconic roads by region, difficulty, and scenic rating. Coming in Phase 2.
      </Text>
    </Screen>
  );
}
