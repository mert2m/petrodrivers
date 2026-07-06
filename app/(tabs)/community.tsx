import { Screen, Text } from '@/components/ui';

/** Community tab — reverse-chron feed of check-ins, photos, comments. Phase 3, features/community. */
export default function CommunityScreen() {
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">Community</Text>
      <Text className="text-fg-secondary">
        Recent check-ins, photos, and road threads from drivers. Coming in Phase 3.
      </Text>
    </Screen>
  );
}
