import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Sign-up (Phase 3). Scaffold only. */
export default function SignUp() {
  const { t } = useTranslation();
  return (
    <Screen padded className="justify-center gap-2">
      <Text variant="title">{t('auth.createAccount')}</Text>
      <Text className="text-fg-secondary">{t('auth.coming')}</Text>
    </Screen>
  );
}
