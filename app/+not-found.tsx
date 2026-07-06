import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <Screen padded className="items-center justify-center gap-3">
        <Text variant="title">{t('notFound.title')}</Text>
        <Text className="text-fg-secondary">{t('notFound.body')}</Text>
        <Link href="/(tabs)/map" className="mt-2">
          <Text className="text-accent">{t('notFound.back')}</Text>
        </Link>
      </Screen>
    </>
  );
}
