// Turkish resources. Typed as a widened (string-leaf) version of `typeof en` so the key structure must
// match en.ts exactly — a missing or extra key is a compile error, but values may differ.
import type { en } from './en';

type Loose<T> = { [K in keyof T]: T[K] extends string ? string : Loose<T[K]> };

export const tr: Loose<typeof en> = {
  common: {
    save: 'Kaydet',
    details: 'Detaylar',
    skip: 'Atla',
    back: 'Geri',
    saveRoad: 'Yolu kaydet',
    retry: 'Tekrar dene',
    loading: 'Yükleniyor…',
  },
  tabs: {
    map: 'Harita',
    discover: 'Keşfet',
    garage: 'Garaj',
    community: 'Topluluk',
    profile: 'Profil',
  },
  map: {
    title: 'Yakınındaki yollar',
    phase2Note:
      'Zorluğa göre renklenen harita Phase 2’de geliyor. Segmentler aşağıdaki göstergeye göre renklenecek.',
  },
  discover: {
    title: 'Keşfet',
    subtitle:
      'İkonik yolları bölge, zorluk ve manzara puanına göre gez ve filtrele. Phase 2’de geliyor.',
  },
  garage: {
    title: 'Garaj',
    subtitle: 'Araçların, lastik ve süspansiyon kurulumların ve notların. Phase 4’te geliyor.',
  },
  community: {
    title: 'Topluluk',
    subtitle: 'Sürücülerden son check-in’ler, fotoğraflar ve yol başlıkları. Phase 3’te geliyor.',
  },
  profile: {
    title: 'Profil',
    subtitle:
      'Pasaportun, koleksiyonun, favorilerin ve kapsama istatistiklerin. Phase 4’te geliyor.',
    language: 'Dil',
    stats: {
      roadsDriven: 'Sürülen yol',
      regions: 'Bölgeler',
      hairpins: 'Firketeler',
    },
  },
  road: {
    headerTitle: 'Yol',
    detailTitle: 'Yol detayı',
    roadId: 'Yol id: {{id}}',
    phase2: 'Tam detay sayfası Phase 2’de geliyor.',
  },
  difficulty: {
    easy: 'Kolay',
    medium: 'Orta',
    technical: 'Teknik',
    hairpin: 'Firkete',
  },
  notFound: {
    title: 'Bu yol mevcut değil',
    body: 'Aradığın sayfa kaybolmuş.',
    back: 'Haritaya dön',
  },
  auth: {
    signIn: 'Giriş yap',
    createAccount: 'Hesap oluştur',
    coming: 'Supabase kimlik doğrulama Phase 3’te geliyor.',
  },
  safety: {
    title: 'Yasalara ve koşullara uygun sür',
    body: 'PetroDrivers, harika yolları sorumlu şekilde keşfetmene yardımcı olur. Tüm hız sınırlarına ve trafik kurallarına uy, koşullara göre sür ve sürüş sırasında uygulamayla asla etkileşime geçme.',
  },
};
