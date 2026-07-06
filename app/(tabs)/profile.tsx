import { Screen, Text } from '@/components/ui';

/**
 * Profile tab — hosts the dashboard: road collection, passport/achievements, favorites, and
 * count-based stats (roads driven, regions covered, hairpins conquered — NEVER speed). Phase 4.
 */
export default function ProfileScreen() {
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">Profile</Text>
      <Text className="text-fg-secondary">
        Your passport, collection, favorites, and coverage stats. Coming in Phase 4.
      </Text>
    </Screen>
  );
}
