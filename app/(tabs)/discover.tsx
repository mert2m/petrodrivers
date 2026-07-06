import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Discover tab — searchable/filterable road list (Phase 2, features/roads + features/favorites). */
export default function DiscoverScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">{t('discover.title')}</Text>
      <Text className="text-fg-secondary">{t('discover.subtitle')}</Text>
    </Screen>
  );
}
