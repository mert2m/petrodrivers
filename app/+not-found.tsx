import { Link, Stack } from 'expo-router';

import { Screen, Text } from '@/components/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen padded className="items-center justify-center gap-3">
        <Text variant="title">This road doesn’t exist</Text>
        <Text className="text-fg-secondary">The page you’re looking for wandered off.</Text>
        <Link href="/(tabs)/map" className="mt-2">
          <Text className="text-accent">Back to the map</Text>
        </Link>
      </Screen>
    </>
  );
}
