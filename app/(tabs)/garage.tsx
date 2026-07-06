import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Garage tab — vehicles + setups (tires/suspension/notes). Phase 4, features/garage. */
export default function GarageScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">{t('garage.title')}</Text>
      <Text className="text-fg-secondary">{t('garage.subtitle')}</Text>
    </Screen>
  );
}
