import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Sign-in (Phase 3, Supabase Auth via features/auth). Scaffold only. */
export default function SignIn() {
  const { t } = useTranslation();
  return (
    <Screen padded className="justify-center gap-2">
      <Text variant="title">{t('auth.signIn')}</Text>
      <Text className="text-fg-secondary">{t('auth.coming')}</Text>
    </Screen>
  );
}
