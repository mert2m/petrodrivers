// English resources. This is the SHAPE source of truth — tr.ts is typed as `typeof en`, so any missing
// or extra key in a translation is a compile error. Keep keys grouped by screen/feature.
export const en = {
  common: {
    save: 'Save',
    details: 'Details',
    skip: 'Skip',
    back: 'Back',
    saveRoad: 'Save road',
    retry: 'Retry',
    loading: 'Loading…',
  },
  tabs: {
    map: 'Map',
    discover: 'Discover',
    garage: 'Garage',
    community: 'Community',
    profile: 'Profile',
  },
  map: {
    title: 'Roads near you',
    phase2Note:
      'The difficulty-colored map lands in Phase 2. Segments will be shaded by the legend below.',
  },
  discover: {
    title: 'Discover',
    subtitle:
      'Browse and filter iconic roads by region, difficulty, and scenic rating. Coming in Phase 2.',
  },
  garage: {
    title: 'Garage',
    subtitle: 'Your vehicles, tire and suspension setups, and notes. Coming in Phase 4.',
  },
  community: {
    title: 'Community',
    subtitle: 'Recent check-ins, photos, and road threads from drivers. Coming in Phase 3.',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Your passport, collection, favorites, and coverage stats. Coming in Phase 4.',
    language: 'Language',
    stats: {
      roadsDriven: 'Roads driven',
      regions: 'Regions',
      hairpins: 'Hairpins',
    },
  },
  road: {
    headerTitle: 'Road',
    detailTitle: 'Road detail',
    roadId: 'Road id: {{id}}',
    phase2: 'Full detail page arrives in Phase 2.',
  },
  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    technical: 'Technical',
    hairpin: 'Hairpin',
  },
  notFound: {
    title: 'This road doesn’t exist',
    body: 'The page you’re looking for wandered off.',
    back: 'Back to the map',
  },
  auth: {
    signIn: 'Sign in',
    createAccount: 'Create account',
    coming: 'Supabase auth arrives in Phase 3.',
  },
  safety: {
    title: 'Drive within the law and conditions',
    body: 'PetroDrivers helps you discover great roads to enjoy responsibly. Obey all speed limits and traffic laws, drive to the conditions, and never interact with the app while driving.',
  },
} as const;

export type Resources = typeof en;
