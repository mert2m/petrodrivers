import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Screen, SegmentedControl, Text } from '@/components/ui';
import { setLanguage, type Language } from '@/i18n';

/**
 * Profile tab — hosts the dashboard: road collection, passport/achievements, favorites, and
 * count-based stats (roads driven, regions covered, hairpins conquered — NEVER speed). Phase 4.
 * Also home to the language switcher (EN / TR) until a dedicated Settings screen exists.
 */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const lang: Language = i18n.language === 'tr' ? 'tr' : 'en';

  const stats: { key: string; label: string }[] = [
    { key: 'roadsDriven', label: t('profile.stats.roadsDriven') },
    { key: 'regions', label: t('profile.stats.regions') },
    { key: 'hairpins', label: t('profile.stats.hairpins') },
  ];

  return (
    <Screen edges={['top']} padded className="gap-4">
      <Text variant="title">{t('profile.title')}</Text>
      <Text className="text-fg-secondary">{t('profile.subtitle')}</Text>

      <View className="mt-2 flex-row gap-2">
        {stats.map((s) => (
          <View key={s.key} className="flex-1 rounded-lg bg-surface-elevated p-3">
            <Text variant="caption" className="text-fg-secondary">
              {s.label}
            </Text>
            <Text variant="title">0</Text>
          </View>
        ))}
      </View>

      <View className="mt-2 gap-2">
        <Text variant="label" className="text-fg-secondary">
          {t('profile.language')}
        </Text>
        <SegmentedControl<Language>
          value={lang}
          onChange={(v) => void setLanguage(v)}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Türkçe', value: 'tr' },
          ]}
        />
      </View>
    </Screen>
  );
}
