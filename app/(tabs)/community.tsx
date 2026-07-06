import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Community tab — reverse-chron feed of check-ins, photos, comments. Phase 3, features/community. */
export default function CommunityScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']} padded className="gap-2">
      <Text variant="title">{t('community.title')}</Text>
      <Text className="text-fg-secondary">{t('community.subtitle')}</Text>
    </Screen>
  );
}
