import { Screen, Text } from '@/components/ui';

/** Sign-in (Phase 3, Supabase Auth via features/auth). Scaffold only. */
export default function SignIn() {
  return (
    <Screen padded className="justify-center gap-2">
      <Text variant="title">Sign in</Text>
      <Text className="text-fg-secondary">Supabase auth arrives in Phase 3.</Text>
    </Screen>
  );
}
