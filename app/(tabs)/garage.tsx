import { Screen, Text } from '@/components/ui';

/** Garage tab — vehicles + setups (tires/suspension/notes). Phase 4, features/garage. */
export default function GarageScreen() {
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">Garage</Text>
      <Text className="text-fg-secondary">
        Your vehicles, tire and suspension setups, and notes. Coming in Phase 4.
      </Text>
    </Screen>
  );
}
